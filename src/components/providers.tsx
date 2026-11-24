"use client";

import { useEffect, useRef, useState } from "react";
import { useMarket } from "@/store/market";
import { useApp, equityOf } from "@/store/app";
import { useToast } from "@/store/toast";
import { MISSIONS, MissionId } from "@/lib/course";
import { missionDone } from "@/lib/missions";
import { rulesReview } from "@/lib/offline-coach";
import { usd } from "@/lib/format";
import { scoreLabel } from "@/lib/analysis";
import { aiGate } from "@/lib/ai-notice";

const TICK_MS = 2000;
const inflight = new Set<string>();

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

async function requestReview(tradeId: string) {
  if (inflight.has(tradeId)) return;
  inflight.add(tradeId);
  const s = useApp.getState();
  const t = s.trades.find((x) => x.id === tradeId);
  if (!t) return;
  const prices = useMarket.getState().prices;
  try {
    // Data goes to the server only when AI mode is confirmed and the notice has been acknowledged.
    // Otherwise: wait for the notice (AI on) or use the local rules review (offline or probe failed). Nothing is sent.
    const gate = await aiGate();
    if (gate === "wait") {
      inflight.delete(tradeId);
      return;
    }
    if (gate === "offline") {
      useApp.getState().setReview(tradeId, rulesReview(t));
      return;
    }
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        aiNoticeAck: true,
        trade: { side: t.side, symbol: t.symbol, qty: t.qty, price: t.price, role: t.role, thesis: t.thesis ?? null, stopLoss: t.stopLoss ?? null, takeProfit: t.takeProfit ?? null, realizedPnl: t.realizedPnl ?? null },
        ruleEngine: { score: t.score, label: scoreLabel(t.score), flags: t.flags.map((f) => ({ tone: f.tone, title: f.title, detail: f.detail })), metrics: t.metrics },
        account: { equity: Math.round(equityOf(s.cash, s.positions, prices)), cash: Math.round(s.cash), positions: Object.values(s.positions).map((p) => ({ symbol: p.symbol, qty: p.qty, avgCost: p.avgCost })) },
        trader: { experience: s.profile.experience, goal: s.profile.goal },
      }),
    });
    const data = await res.json();
    if (data?.review) useApp.getState().setReview(tradeId, data.review);
    else useApp.getState().setReview(tradeId, rulesReview(t));
  } catch {
    useApp.getState().setReview(tradeId, rulesReview(t));
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const init = useMarket((s) => s.init);
  const trades = useApp((s) => s.trades);
  const aiNoticeAt = useApp((s) => s.profile.aiNoticeAt);
  const push = useToast((s) => s.push);
  const seenTrades = useRef<Set<string> | null>(null);

  // Test-only price driver. Exists only when the verify script sets window.__VANTAGE_TEST__ before load; users never have it.
  useEffect(() => {
    const w = window as unknown as { __VANTAGE_TEST__?: boolean; __vantageTest?: { setPrices: (p: Record<string, number>) => void } };
    if (!w.__VANTAGE_TEST__) return;
    w.__vantageTest = {
      setPrices: (p) => {
        useMarket.setState((m) => ({ prices: { ...m.prices, ...p } }));
        useApp.getState().processPrices(useMarket.getState().prices);
      },
    };
    return () => {
      delete w.__vantageTest;
    };
  }, []);

  // market clock
  useEffect(() => {
    init();
    const id = setInterval(() => {
      if (document.hidden) return;
      useMarket.getState().tick();
      useApp.getState().processPrices(useMarket.getState().prices);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [init]);

  // reviews + fill toasts
  useEffect(() => {
    if (!seenTrades.current) {
      seenTrades.current = new Set(trades.map((t) => t.id));
    }
    for (const t of trades) {
      if (t.reviewStatus === "pending") requestReview(t.id);
      if (!seenTrades.current.has(t.id)) {
        seenTrades.current.add(t.id);
        if (t.role === "stop-loss" || t.role === "take-profit") {
          push({
            title: t.role === "stop-loss" ? "Stop-loss filled" : "Take-profit filled",
            body: `Sold ${t.qty} ${t.symbol} at ${usd(t.price)}. Realized ${(t.realizedPnl ?? 0) >= 0 ? "+" : "−"}${usd(Math.abs(t.realizedPnl ?? 0))}.`,
            tone: "default",
            href: "/dashboard",
          });
        } else if (t.role === "entry" && t.orderId && useApp.getState().orders.find((o) => o.id === t.orderId)?.type !== "market") {
          push({ title: "Limit order filled", body: `Bought ${t.qty} ${t.symbol} at ${usd(t.price)}.`, tone: "default" });
        }
      }
    }
  }, [trades, push, aiNoticeAt]);

  // missions
  const orders = useApp((s) => s.orders);
  const positions = useApp((s) => s.positions);
  const chat = useApp((s) => s.chat);
  const posts = useApp((s) => s.posts);
  const missions = useApp((s) => s.missions);
  useEffect(() => {
    const state = { trades, orders, positions, chat, posts };
    const done = Object.values(MISSIONS).filter((m) => !missions[m.id] && missionDone(m.id as MissionId, state));
    if (!done.length) return;
    for (const m of done) useApp.getState().completeMission(m.id, m.xp);
    const xp = done.reduce((a, m) => a + m.xp, 0);
    push(
      done.length === 1
        ? { title: `Mission done: ${done[0].title}`, body: `${xp} XP added.`, tone: "good", href: "/learn" }
        : { title: `${done.length} missions done`, body: `${done.map((m) => m.title).join(", ")}. ${xp} XP added.`, tone: "good", href: "/learn" },
    );
  }, [trades, orders, positions, chat, posts, missions, push]);

  return <>{children}</>;
}
