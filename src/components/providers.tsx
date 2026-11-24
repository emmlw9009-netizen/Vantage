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
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
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
  const push = useToast((s) => s.push);
  const seenTrades = useRef<Set<string> | null>(null);

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
            title: t.role === "stop-loss" ? `Stop-loss filled · ${t.symbol}` : `Take-profit filled · ${t.symbol}`,
            body: `Sold ${t.qty} @ ${usd(t.price)} · ${t.realizedPnl && t.realizedPnl >= 0 ? "+" : ""}${usd(t.realizedPnl ?? 0)}`,
            tone: t.role === "take-profit" ? "good" : "warn",
            href: "/dashboard",
          });
        } else if (t.role === "entry" && t.orderId && useApp.getState().orders.find((o) => o.id === t.orderId)?.type !== "market") {
          push({ title: `Limit order filled · ${t.symbol}`, body: `Bought ${t.qty} @ ${usd(t.price)}`, tone: "good" });
        }
      }
    }
  }, [trades, push]);

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
        ? { title: `Mission complete: ${done[0].title}`, body: `+${xp} XP`, tone: "good", href: "/learn" }
        : { title: `${done.length} missions complete`, body: `${done.map((m) => m.title).join(" · ")} · +${xp} XP`, tone: "good", href: "/learn" },
    );
  }, [trades, orders, positions, chat, posts, missions, push]);

  return <>{children}</>;
}
