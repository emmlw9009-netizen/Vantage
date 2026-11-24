"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useApp, equityOf, OrderType } from "@/store/app";
import { useMarket } from "@/store/market";
import { analyzeTrade } from "@/lib/analysis";
import { preflightChecks, type PreflightCheck } from "@/lib/preflight";
import { cn, pct, usd } from "@/lib/format";
import { Segmented } from "./ui";
import { CheckCell, CheckStrip, ScoreLoop, MarkGlyph } from "./marks";
import { AnimatedNumber } from "./motion/animated-number";
import { Reveal } from "./motion/transition-panel";
import type { CheckId, CheckState } from "@/lib/trade-checks";

/** Strict money parsing: digits, one optional decimal point, thousands separators allowed. "5abc" and "1e3" are rejected. */
const num = (s: string) => {
  const t = s.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
/** Fills happen a hair above the quote, so size and Max leave room for it. */
const SLIP = 1.0005;

/** One ticket row: Nova's check cell in the left margin, the field on the right. */
function Row({ check, show, children, className }: { check?: PreflightCheck; show: boolean; children: React.ReactNode; className?: string }) {
  const fixId = useId();
  return (
    <div className={cn("grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-rule px-4 py-4 sm:px-5", className)}>
      <div className="pt-[22px]">
        {check && show && (
          <span
            role="checkbox"
            aria-readonly="true"
            aria-checked={check.ok}
            aria-label={check.label}
            aria-describedby={!check.ok && check.fix ? fixId : undefined}
            data-check-id={check.id}
            data-ok={check.ok}
            className="block"
          >
            <CheckCell state={check.ok ? "done" : "todo"} size={28} draw className="-ml-1" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        {children}
        {check && show && !check.ok && check.fix && (
          <p id={fixId} className="mt-2 t-small text-ink-2">
            {check.fix}
          </p>
        )}
      </div>
    </div>
  );
}

export function OrderTicket({ symbol, onFilled }: { symbol: string; onFilled?: (tradeId: string) => void }) {
  const price = useMarket((s) => s.prices[symbol]);
  const prices = useMarket((s) => s.prices);
  const prevClose = useMarket((s) => s.prevClose);
  const cash = useApp((s) => s.cash);
  const positions = useApp((s) => s.positions);
  const trades = useApp((s) => s.trades);
  const placeOrder = useApp((s) => s.placeOrder);
  const held = positions[symbol]?.qty ?? 0;

  const [side, _setSide] = useState<"buy" | "sell">("buy");
  const [type, _setType] = useState<OrderType>("market");
  // `touched` is false right after a successful order: the checks hide and the submit button locks
  // until the next edit, so a double click or a second Enter can never place a second order.
  const [touched, setTouched] = useState(true);
  const [qty, _setQty] = useState("10");
  const [trigger, _setTrigger] = useState("");
  const [stop, _setStop] = useState("");
  const [target, _setTarget] = useState("");
  const [thesis, _setThesis] = useState("");
  const [qtyNote, setQtyNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const busy = useRef(false);

  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    setTouched(true);
    setOkMsg(null);
    fn(v);
  };
  const setQty = touch(_setQty);
  const setTrigger = touch(_setTrigger);
  const setStop = touch(_setStop);
  const setTarget = touch(_setTarget);
  const setThesis = touch(_setThesis);
  const setSide = touch((s: "buy" | "sell") => {
    _setSide(s);
    _setTrigger(""); // a buy-limit price must never become a sell-stop price
    if (s === "buy" && type === "stop") _setType("market");
  });
  const setType = touch((t: OrderType) => {
    _setType(t);
    _setTrigger("");
  });

  const equity = equityOf(cash, positions, prices);
  const entry = type === "market" ? price : num(trigger) ?? price;
  const q = Math.floor(Number(qty) || 0);
  const stopN = num(stop);
  const targetN = num(target);
  const buy = side === "buy";

  const preview = useMemo(() => {
    if (!price || q <= 0) return null;
    return analyzeTrade(
      { side, symbol, qty: q, price: entry, thesis, stopLoss: buy ? stopN : undefined, takeProfit: buy ? targetN : undefined, role: buy ? "entry" : "exit", realizedPnl: !buy && positions[symbol] ? (entry - positions[symbol].avgCost) * q : undefined },
      { equity, cash, positions, prices, prevClose, recentTradeCount: trades.filter((t) => Date.now() - t.at < 600_000 && t.role === "entry").length + 1 },
    );
  }, [price, q, side, buy, symbol, entry, thesis, stopN, targetN, equity, cash, positions, prices, prevClose, trades]);

  if (!price) return null;

  const notional = q * entry;
  const riskDollars = buy && stopN && stopN < entry ? (entry - stopN) * q : undefined;

  const sizeByRisk = (riskPct: number) => {
    if (!stopN || stopN >= entry) {
      setError("Set a stop-loss below the entry first. The share count is worked out from it.");
      return;
    }
    const shares = Math.floor((equity * riskPct) / (entry * SLIP - stopN));
    setQty(String(Math.max(1, Math.min(shares, Math.floor(cash / (entry * SLIP))))));
    setError(null);
  };

  const onQty = (v: string) => {
    if (v !== "" && !/^\d+$/.test(v)) {
      setQtyNote("Whole shares only. Use digits, like 25.");
      return;
    }
    setQtyNote(null);
    setQty(v);
  };

  const submit = () => {
    if (busy.current || !touched) return;
    busy.current = true;
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
      stopLoss: buy ? stopN : undefined,
      takeProfit: buy ? targetN : undefined,
    });
    if (!res.ok) {
      busy.current = false;
      return setError(res.error ?? "The order wasn't placed. Check the fields above and try again.");
    }
    if (res.tradeId) {
      setOkMsg(`${buy ? "Bought" : "Sold"} ${q} ${symbol}. Nova is reviewing it.`);
      onFilled?.(res.tradeId);
    } else setOkMsg(`${type === "limit" ? "Limit" : "Stop"} order placed. It fills when ${symbol} reaches ${usd(entry)}.`);
    _setThesis("");
    _setStop("");
    _setTarget("");
    setTouched(false);
    // release the in-flight guard on the next frame; the button stays locked until the next edit
    requestAnimationFrame(() => {
      busy.current = false;
    });
  };

  const checks = preflightChecks({ side, qty: q, entry, stopLoss: stopN, takeProfit: targetN, thesis, equity, existingQty: held });
  const byId = Object.fromEntries(checks.map((c) => [c.id, c])) as Record<CheckId, PreflightCheck>;
  const applicable = checks.filter((c) => c.applicable);
  const doneCount = applicable.filter((c) => c.ok).length;
  const showChecks = !!preview && touched;
  const stripState = Object.fromEntries(checks.map((c) => [c.id, !c.applicable ? "na" : c.ok ? "done" : "todo"])) as Record<CheckId, CheckState>;

  const label = "mb-1.5 flex items-baseline justify-between gap-2 t-small font-medium text-ink-2";
  const quick = "btn btn-secondary min-h-10 min-w-11 px-2 t-table font-medium";
  const submitLabel = type === "market" ? `${buy ? "Buy" : "Sell"} ${q || 0} ${symbol}` : `Place ${type} ${side}`;

  return (
    <div className="sheet flex flex-col lg:max-h-[calc(100dvh-120px)]">
      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        {/* header */}
        <div className="space-y-3 px-4 pb-4 pt-4 sm:px-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="t-h3">
              {type === "market" ? "" : type === "limit" ? "Limit " : "Stop "}
              {buy ? (type === "market" ? "Buy" : "buy") : type === "market" ? "Sell" : "sell"} {symbol}
            </h2>
            <span className="tnum t-wide text-base font-medium">{usd(price)}</span>
          </div>
          <Segmented label="Side" value={side} onChange={setSide} options={[{ value: "buy", label: "Buy" }, { value: "sell", label: "Sell" }]} stretch />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              label="Order type"
              value={type}
              onChange={setType}
              options={buy ? [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }] : [{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }, { value: "stop", label: "Stop" }]}
            />
            <span className="tnum t-small text-ink-2">{buy ? `Cash ${usd(cash, 0)}` : `You hold ${held} ${symbol}`}</span>
          </div>
          <Reveal show={type !== "market"}>
            <div className="pt-1">
              <label className={label} htmlFor="trigger">
                {type === "limit" ? "Limit price" : "Stop price"}
                <span className="t-micro text-muted">{type === "limit" ? (buy ? "Fills at this price or lower" : "Fills at this price or higher") : "Sells if the price falls to this"}</span>
              </label>
              <input id="trigger" inputMode="decimal" autoComplete="off" placeholder={price.toFixed(2)} value={trigger} onChange={(e) => setTrigger(e.target.value)} className="field tnum" maxLength={12} />
            </div>
          </Reveal>
        </div>

        {/* Reason */}
        <Row check={byId.reason} show={showChecks}>
          <label className={label} htmlFor="thesis">
            Why are you making this trade?
            <span className="tnum t-micro text-muted">{thesis.trim().length}/500</span>
          </label>
          <textarea
            id="thesis"
            rows={2}
            maxLength={500}
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder={buy ? "I expect … because … I'm wrong if …" : "I'm selling because …"}
            className="field resize-y break-words"
          />
        </Row>

        {/* Stop-loss */}
        {buy && (
          <Row check={byId.stop} show={showChecks}>
            <label className={label} htmlFor="stop">
              Stop-loss
              <span className="t-micro text-muted">Where your reason stops being true</span>
            </label>
            <div className="flex gap-1.5">
              <input id="stop" inputMode="decimal" autoComplete="off" placeholder="e.g. 5% below" value={stop} onChange={(e) => setStop(e.target.value)} className="field tnum min-w-0 flex-1" maxLength={12} />
              {[0.03, 0.05, 0.08].map((p) => (
                <button key={p} onClick={() => setStop((entry * (1 - p)).toFixed(2))} className={quick}>
                  −{p * 100}%
                </button>
              ))}
            </div>
          </Row>
        )}

        {/* Shares (risk) */}
        <Row check={buy ? byId.risk : undefined} show={showChecks}>
          <label className={label} htmlFor="qty">
            Shares
            {riskDollars != null && (
              <span className="tnum t-micro text-ink-2">
                Risk if stopped {usd(riskDollars)}, {pct(riskDollars / equity, 2, false)}
              </span>
            )}
          </label>
          <div className="flex gap-1.5">
            <input id="qty" inputMode="numeric" autoComplete="off" maxLength={7} value={qty} onChange={(e) => onQty(e.target.value)} className="field tnum min-w-0 flex-1" aria-describedby={qtyNote ? "qty-note" : undefined} />
            <button onClick={() => setQty(String(buy ? Math.floor(cash / (entry * SLIP)) : held))} className={quick}>
              Max
            </button>
          </div>
          {qtyNote && (
            <p id="qty-note" className="mt-2 t-small text-ink-2">
              {qtyNote}
            </p>
          )}
          {buy && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 t-small text-ink-2">Size by risk</span>
              {[0.005, 0.01, 0.02].map((r) => (
                <button key={r} onClick={() => sizeByRisk(r)} className={quick}>
                  {r * 100}% of account
                </button>
              ))}
            </div>
          )}
        </Row>

        {/* Take-profit */}
        {buy && (
          <Row check={byId.target} show={showChecks}>
            <label className={label} htmlFor="target">
              Take-profit
              {preview?.metrics.rewardRisk != null && <span className="tnum t-micro text-ink-2">Reward to risk {preview.metrics.rewardRisk.toFixed(1)} : 1</span>}
            </label>
            <div className="flex gap-1.5">
              <input id="target" inputMode="decimal" autoComplete="off" placeholder="e.g. 10% above" value={target} onChange={(e) => setTarget(e.target.value)} className="field tnum min-w-0 flex-1" maxLength={12} />
              {[0.06, 0.1, 0.16].map((p) => (
                <button key={p} onClick={() => setTarget((entry * (1 + p)).toFixed(2))} className={quick}>
                  +{p * 100}%
                </button>
              ))}
            </div>
          </Row>
        )}

        {/* Order value (size) */}
        <Row check={byId.size} show={showChecks} className="py-3">
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 t-small">
            <dt className="text-ink-2">{buy ? "Order value" : "Proceeds"}</dt>
            <dd className="tnum text-right font-medium">{usd(notional)}</dd>
            {buy && (
              <>
                <dt className="text-ink-2">Of your account</dt>
                <dd className="tnum text-right font-medium">{pct(notional / equity, 1, false)}</dd>
              </>
            )}
          </dl>
        </Row>
      </div>

      {/* Summary and submit: pinned to the bottom of the ticket on desktop, so Buy is always visible. */}
      <div className="border-t border-ink px-4 pb-4 pt-4 sm:px-5">
        {showChecks && (
          <section aria-labelledby="preflight-h" className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 id="preflight-h" className="t-h3">
                Pre-flight check
              </h3>
              <p className="tnum t-small text-ink-2" aria-live="polite">
                {doneCount} of {applicable.length} complete
              </p>
              <CheckStrip checks={stripState} labeled size={24} hideFromAT className="mt-2" />
            </div>
            <ScoreLoop score={preview!.score} size="m" label={false}>
              <AnimatedNumber value={preview!.score} format={(n) => String(Math.round(n))} />
            </ScoreLoop>
          </section>
        )}
        {error && (
          <div className="mb-3 flex gap-2 t-small text-red" role="alert">
            <MarkGlyph kind="risk" className="mt-0.5" />
            <span className="min-w-0">{error}</span>
          </div>
        )}
        {okMsg && (
          <div className="mb-3 flex gap-2 t-small text-ink" role="status">
            <MarkGlyph kind="good" className="mt-0.5" />
            <span className="min-w-0">
              {okMsg} <span className="text-ink-2">Change any field to place another order.</span>
            </span>
          </div>
        )}
        <button
          onClick={submit}
          onDoubleClick={(e) => e.preventDefault()}
          aria-disabled={!touched}
          className={cn("btn btn-primary btn-lg w-full", !touched && "cursor-not-allowed opacity-60")}
        >
          {submitLabel}
        </button>
        <p className="mt-2 t-micro text-ink-2">Simulated trade. Prices are generated and are not real market prices. No real money.</p>
      </div>
    </div>
  );
}
