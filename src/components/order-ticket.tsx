"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useApp, equityOf, OrderType } from "@/store/app";
import { useMarket } from "@/store/market";
import { analyzeTrade } from "@/lib/analysis";
import { preflightChecks } from "@/lib/preflight";
import { cn, pct, usd } from "@/lib/format";
import { Segmented, ScoreGauge } from "./ui";

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
  // `touched` hides the pre-flight check right after a fill until the user edits the next order
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

  const checks = preflightChecks({ side, qty: q, entry, stopLoss: stopN, takeProfit: targetN, thesis, equity, existingQty: held });
  const applicable = checks.filter((c) => c.applicable);
  const doneCount = applicable.filter((c) => c.ok).length;

  const input = "inset h-11 w-full border border-line px-3 text-sm outline-none tnum focus:border-line-strong";
  const label = "mb-1.5 block text-sm font-medium text-ink-2";
  const quick = "inline-flex h-10 items-center rounded-md border border-line px-2.5 text-xs font-medium text-ink-2 hover:bg-panel-2";
  const section = "border-t border-line px-4 py-4 sm:px-5";

  return (
    <div className="card">
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-panel-2 p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSide(s);
                if (s === "buy" && type === "stop") setType("market");
              }}
              className={cn("h-10 rounded-md text-sm font-semibold capitalize transition", side === s ? (s === "buy" ? "bg-accent text-accent-ink" : "bg-ink text-bg") : "text-muted hover:text-ink")}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Segmented
            value={type}
            onChange={setType}
            options={side === "buy" ? [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }] : [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }, { value: "stop", label: "Stop" }]}
          />
          <span className="text-sm text-muted">{side === "buy" ? `Cash ${usd(cash, 0)}` : `You hold ${held}`}</span>
        </div>
      </div>

      <div className={section}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="qty">Shares</label>
            <div className="relative">
              <input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} className={input} />
              <button onClick={() => setQty(String(side === "buy" ? Math.floor(cash / entry) : held))} className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md px-2 text-xs font-semibold text-muted hover:text-ink">MAX</button>
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
      </div>

      {side === "buy" && (
        <div className={section}>
          <h3 className="mb-3 font-display text-base font-semibold">Exit plan</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="stop">Stop-loss</label>
              <input id="stop" inputMode="decimal" placeholder="e.g. 5% below" value={stop} onChange={(e) => setStop(e.target.value)} className={input} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0.03, 0.05, 0.08].map((p) => (
                  <button key={p} onClick={() => setStop((entry * (1 - p)).toFixed(2))} className={quick}>−{p * 100}%</button>
                ))}
              </div>
            </div>
            <div>
              <label className={label} htmlFor="target">Take-profit</label>
              <input id="target" inputMode="decimal" placeholder="e.g. 10% above" value={target} onChange={(e) => setTarget(e.target.value)} className={input} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0.06, 0.1, 0.16].map((p) => (
                  <button key={p} onClick={() => setTarget((entry * (1 + p)).toFixed(2))} className={quick}>+{p * 100}%</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <span className="mb-2 block text-sm text-muted">Size by risk</span>
            <div className="flex flex-wrap gap-1.5">
              {[0.005, 0.01, 0.02].map((r) => (
                <button key={r} onClick={() => sizeByRisk(r)} className={quick}>{r * 100}% of account</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={section}>
        <label className={label} htmlFor="thesis">Why are you making this trade?</label>
        <textarea
          id="thesis"
          rows={3}
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder={side === "buy" ? "I expect … because … I'm wrong if …" : "I'm selling because …"}
          className="inset w-full resize-none border border-line px-3 py-2.5 text-sm outline-none focus:border-line-strong"
        />
      </div>

      {preview && touched && (
        <section className={section} aria-labelledby="preflight-h">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="preflight-h" className="font-display text-xl font-bold leading-tight">Pre-flight check</h3>
              <p className="tnum mt-0.5 text-sm text-ink-2" aria-live="polite">{doneCount} of {applicable.length} complete</p>
            </div>
            <ScoreGauge score={preview.score} size={76} />
          </div>
          <ul className="mt-3 space-y-1">
            {applicable.map((c) => (
              <li key={c.id} role="checkbox" aria-checked={c.ok} aria-label={c.label} data-ok={c.ok} data-check-id={c.id} className="flex items-start gap-3 py-1.5">
                <span aria-hidden className={cn("mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border-2 transition-all duration-200", c.ok ? "scale-100 border-up bg-up text-bg" : "scale-95 border-line-strong")}>
                  <Check className={cn("size-3.5 stroke-[3] transition-all duration-200", c.ok ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                </span>
                <span className="min-w-0 text-sm">
                  <span className={cn("font-medium", !c.ok && "text-ink-2")}>{c.label}</span>
                  {!c.ok && c.fix && <span className="block text-muted">{c.fix}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className={cn(section, "grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm")}>
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
            <dt className="text-muted">Reward : risk</dt>
            <dd className="tnum text-right font-medium">{preview.metrics.rewardRisk.toFixed(1)} : 1</dd>
          </>
        )}
      </dl>

      <div className={section}>
        {error && <div className="mb-3 rounded-lg bg-risk-bg px-3 py-2 text-sm text-down" role="alert">{error}</div>}
        {okMsg && <div className="mb-3 rounded-lg bg-good-bg px-3 py-2 text-sm text-up" role="status">{okMsg}</div>}
        <button onClick={submit} className={cn("h-12 w-full rounded-lg text-sm font-semibold transition hover:brightness-95 active:scale-[0.99]", side === "buy" ? "bg-accent text-accent-ink" : "bg-ink text-bg")}>
          {type === "market" ? `${side === "buy" ? "Buy" : "Sell"} ${q || 0} ${symbol}` : `Place ${type} ${side}`}
        </button>
        <p className="mt-2 text-xs text-muted">Paper trading, simulated prices, no real money.</p>
      </div>
    </div>
  );
}
