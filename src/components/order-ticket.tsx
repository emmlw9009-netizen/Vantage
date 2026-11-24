"use client";

import { useMemo, useState } from "react";
import { Lightbulb, ShieldCheck, Target } from "lucide-react";
import { useApp, equityOf, OrderType } from "@/store/app";
import { useMarket } from "@/store/market";
import { analyzeTrade, scoreLabel } from "@/lib/analysis";
import { cn, pct, usd } from "@/lib/format";
import { Segmented, ScoreRing } from "./ui";
import { FlagRow } from "./review-card";

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function OrderTicket({ symbol, onFilled }: { symbol: string; onFilled?: (tradeId: string) => void }) {
  const price = useMarket((s) => s.prices[symbol]);
  const prices = useMarket((s) => s.prices);
  const prevClose = useMarket((s) => s.prevClose);
  const cash = useApp((s) => s.cash);
  const positions = useApp((s) => s.positions);
  const trades = useApp((s) => s.trades);
  const placeOrder = useApp((s) => s.placeOrder);
  const held = positions[symbol]?.qty ?? 0;

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<OrderType>("market");
  // `touched` hides the pre-trade check right after a fill until the user edits the next order
  const [touched, setTouched] = useState(true);
  const [qty, _setQty] = useState("10");
  const [trigger, _setTrigger] = useState("");
  const [stop, _setStop] = useState("");
  const [target, _setTarget] = useState("");
  const [thesis, _setThesis] = useState("");
  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    setTouched(true);
    fn(v);
  };
  const setQty = touch(_setQty);
  const setTrigger = touch(_setTrigger);
  const setStop = touch(_setStop);
  const setTarget = touch(_setTarget);
  const setThesis = touch(_setThesis);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const equity = equityOf(cash, positions, prices);
  const entry = type === "market" ? price : num(trigger) ?? price;
  const q = Math.floor(Number(qty) || 0);
  const stopN = num(stop);
  const targetN = num(target);

  const preview = useMemo(() => {
    if (!price || q <= 0) return null;
    return analyzeTrade(
      { side, symbol, qty: q, price: entry, thesis, stopLoss: side === "buy" ? stopN : undefined, takeProfit: side === "buy" ? targetN : undefined, role: side === "buy" ? "entry" : "exit", realizedPnl: side === "sell" && positions[symbol] ? (entry - positions[symbol].avgCost) * q : undefined },
      { equity, cash, positions, prices, prevClose, recentTradeCount: trades.filter((t) => Date.now() - t.at < 600_000 && t.role === "entry").length + 1 },
    );
  }, [price, q, side, symbol, entry, thesis, stopN, targetN, equity, cash, positions, prices, prevClose, trades]);

  if (!price) return null;

  const notional = q * entry;
  const riskDollars = side === "buy" && stopN ? (entry - stopN) * q : undefined;

  const sizeByRisk = (riskPct: number) => {
    if (!stopN || stopN >= entry) {
      setError("Set a stop-loss below the entry first. Size is calculated from it.");
      return;
    }
    const shares = Math.floor((equity * riskPct) / (entry - stopN));
    setQty(String(Math.max(1, Math.min(shares, Math.floor(cash / entry)))));
    setError(null);
  };

  const submit = () => {
    setError(null);
    setOkMsg(null);
    const res = placeOrder({
      symbol,
      side,
      type,
      qty: q,
      limitPrice: type === "limit" ? num(trigger) : undefined,
      stopPrice: type === "stop" ? num(trigger) : undefined,
      thesis,
      stopLoss: side === "buy" ? stopN : undefined,
      takeProfit: side === "buy" ? targetN : undefined,
    });
    if (!res.ok) return setError(res.error ?? "Order rejected.");
    if (res.tradeId) {
      setOkMsg(`${side === "buy" ? "Bought" : "Sold"} ${q} ${symbol}. Nova is reviewing it now.`);
      onFilled?.(res.tradeId);
    } else setOkMsg(`${type === "limit" ? "Limit" : "Stop"} order placed. It fills when ${symbol} reaches ${usd(entry)}.`);
    _setThesis("");
    _setStop("");
    _setTarget("");
    setTouched(false);
  };

  const input = "h-11 w-full rounded-xl border border-line bg-panel-2 px-3 text-sm outline-none tnum focus:border-line-strong";
  const label = "mb-1.5 block text-xs font-medium text-ink-2";

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border border-line bg-panel-2 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              if (s === "sell" && type === "limit") setType("limit");
              if (s === "buy" && type === "stop") setType("market");
            }}
            className={cn("h-9 rounded-full text-sm font-semibold capitalize transition", side === s ? (s === "buy" ? "bg-accent text-accent-ink" : "bg-ink text-bg") : "text-muted hover:text-ink")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Segmented
          value={type}
          onChange={setType}
          options={side === "buy" ? [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }] : [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }, { value: "stop", label: "Stop" }]}
        />
        <span className="text-xs text-muted">
          {side === "buy" ? `Cash ${usd(cash, 0)}` : `You hold ${held}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="qty">Shares</label>
          <div className="relative">
            <input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} className={input} />
            <button onClick={() => setQty(String(side === "buy" ? Math.floor(cash / entry) : held))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 text-[11px] font-semibold text-muted hover:text-ink">MAX</button>
          </div>
        </div>
        {type === "market" ? (
          <div>
            <span className={label}>Price</span>
            <div className={cn(input, "flex items-center text-ink-2")}>{usd(price)}</div>
          </div>
        ) : (
          <div>
            <label className={label} htmlFor="trigger">{type === "limit" ? "Limit price" : "Stop price"}</label>
            <input id="trigger" inputMode="decimal" placeholder={price.toFixed(2)} value={trigger} onChange={(e) => setTrigger(e.target.value)} className={input} />
          </div>
        )}
      </div>

      {side === "buy" && (
        <div className="mt-4 rounded-2xl border border-line p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <ShieldCheck className="size-3.5" /> Exit plan (bracket)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="stop">Stop-loss</label>
              <input id="stop" inputMode="decimal" placeholder="e.g. 5% below" value={stop} onChange={(e) => setStop(e.target.value)} className={input} />
              <div className="mt-1.5 flex gap-1">
                {[0.03, 0.05, 0.08].map((p) => (
                  <button key={p} onClick={() => setStop((entry * (1 - p)).toFixed(2))} className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-2 hover:bg-panel-2">−{p * 100}%</button>
                ))}
              </div>
            </div>
            <div>
              <label className={label} htmlFor="target">Take-profit</label>
              <input id="target" inputMode="decimal" placeholder="e.g. 10% above" value={target} onChange={(e) => setTarget(e.target.value)} className={input} />
              <div className="mt-1.5 flex gap-1">
                {[0.06, 0.1, 0.16].map((p) => (
                  <button key={p} onClick={() => setTarget((entry * (1 + p)).toFixed(2))} className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-2 hover:bg-panel-2">+{p * 100}%</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">Size by risk:</span>
            {[0.005, 0.01, 0.02].map((r) => (
              <button key={r} onClick={() => sizeByRisk(r)} className="rounded-full border border-line px-2.5 py-1 font-medium hover:bg-panel-2">{r * 100}% of account</button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <label className={cn(label, "flex items-center gap-1.5")} htmlFor="thesis">
          <Lightbulb className="size-3.5" /> Why are you making this trade?
        </label>
        <textarea
          id="thesis"
          rows={3}
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder={side === "buy" ? "I expect … because … I'm wrong if …" : "I'm selling because …"}
          className="w-full resize-none rounded-xl border border-line bg-panel-2 px-3 py-2.5 text-sm outline-none focus:border-line-strong"
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted">{side === "buy" ? "Est. cost" : "Est. proceeds"}</dt>
        <dd className="tnum text-right font-medium">{usd(notional)}</dd>
        {side === "buy" && (
          <>
            <dt className="text-muted">Of your account</dt>
            <dd className="tnum text-right font-medium">{pct(notional / equity, 1, false)}</dd>
          </>
        )}
        {riskDollars != null && riskDollars > 0 && (
          <>
            <dt className="text-muted">Risk if stopped</dt>
            <dd className="tnum text-right font-medium">{usd(riskDollars)} · {pct(riskDollars / equity, 2, false)}</dd>
          </>
        )}
        {preview?.metrics.rewardRisk != null && (
          <>
            <dt className="flex items-center gap-1 text-muted"><Target className="size-3.5" /> Reward : risk</dt>
            <dd className="tnum text-right font-medium">{preview.metrics.rewardRisk.toFixed(1)} : 1</dd>
          </>
        )}
      </dl>

      {preview && touched && (
        <div className="mt-4 rounded-2xl bg-panel-2 p-3">
          <div className="mb-2 flex items-center gap-3">
            <ScoreRing score={preview.score} size={44} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Pre-trade check</div>
              <div className="text-sm font-semibold">{scoreLabel(preview.score)}</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {preview.flags.filter((f) => f.tone !== "good").slice(0, 3).map((f) => (
              <FlagRow key={f.id} tone={f.tone} title={f.title} />
            ))}
            {preview.flags.every((f) => f.tone === "good") && <FlagRow tone="good" title="This trade follows your risk rules." />}
          </div>
        </div>
      )}

      {error && <div className="mt-3 rounded-xl bg-risk-bg px-3 py-2 text-sm text-down" role="alert">{error}</div>}
      {okMsg && <div className="mt-3 rounded-xl bg-good-bg px-3 py-2 text-sm text-up" role="status">{okMsg}</div>}

      <button onClick={submit} className={cn("mt-4 h-12 w-full rounded-full text-sm font-semibold transition hover:brightness-95 active:scale-[0.99]", side === "buy" ? "bg-accent text-accent-ink" : "bg-ink text-bg")}>
        {type === "market" ? `${side === "buy" ? "Buy" : "Sell"} ${q || 0} ${symbol}` : `Place ${type} ${side}`}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted">Paper trading · simulated prices · no real money</p>
    </div>
  );
}
