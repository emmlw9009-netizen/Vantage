"use client";

/**
 * Interactive lesson widgets (docs/design/direction.md section 8.6 inputs, section 12.6 lesson).
 * PositionSizeWidget, RewardRiskWidget and TrendSpotterWidget take plain props and read no store, so the public
 * calculator pages can reuse them. LessonWidget is the store-aware wrapper the lesson page renders.
 */
import { useId, useMemo, useState } from "react";
import { useApp, equityOf } from "@/store/app";
import { useMarket } from "@/store/market";
import { usd, num, cn } from "@/lib/format";
import { minTarget } from "@/lib/money";
import { MarkGlyph } from "@/components/marks";
import { classifySwings, parseAmount, rewardRiskPlan, sizePosition, trendRound, TREND_LABEL, TREND_WHY, type TrendChart, type TrendKind } from "@/lib/widget-math";
import type { WidgetId } from "@/lib/course";

/* ---------------- shared pieces ---------------- */
function WidgetShell({ id, title, intro, children }: { id: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-y border-rule-strong py-5" aria-labelledby={`${id}-h`} data-testid={`widget-${id}`}>
      <h2 id={`${id}-h`} className="t-h3">
        {title}
      </h2>
      <p className="mt-1 t-small text-ink-2">{intro}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Label above, field with a muted prefix or suffix, fix text below (inputs, section 8.6). */
function NumberField({ label, value, onChange, prefix, suffix, error, hint, testId }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; error?: string; hint?: string; testId?: string }) {
  const id = useId();
  const help = error || hint ? `${id}-help` : undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block t-small font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          data-testid={testId}
          inputMode="decimal"
          autoComplete="off"
          maxLength={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={help}
          className={cn("field tnum", prefix && "pl-7", suffix && "pr-16")}
        />
        {suffix && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center t-small text-muted">
            {suffix}
          </span>
        )}
      </div>
      {(error || hint) && (
        <p id={help} className={cn("mt-1.5 flex items-start gap-1.5 t-small", error ? "text-red" : "text-ink-2")}>
          {error && <MarkGlyph kind="risk" size={16} className="mt-0.5" />}
          <span>{error || hint}</span>
        </p>
      )}
    </div>
  );
}

function Readout({ label, value, testId, strong }: { label: string; value: string; testId?: string; strong?: boolean }) {
  return (
    <div className="min-w-0 border-t border-rule py-2.5">
      <dt className="t-small text-ink-2">{label}</dt>
      <dd data-testid={testId} className={cn("tnum", strong ? "t-readout" : "t-h3")}>
        {value}
      </dd>
    </div>
  );
}

/* ---------------- position size ---------------- */
export function PositionSizeWidget({ defaultAccount = 100000 }: { defaultAccount?: number }) {
  const [account, setAccount] = useState(String(Math.round(defaultAccount)));
  const [risk, setRisk] = useState(1);
  const [entry, setEntry] = useState("100");
  const [stop, setStop] = useState("95");
  const riskId = useId();
  const a = parseAmount(account);
  const e = parseAmount(entry);
  const s = parseAmount(stop);
  const res = sizePosition(a, risk, e, s);
  const stopError = !res.ok && /stop/i.test(res.message) ? res.message : undefined;
  const otherError = !res.ok && !stopError ? res.message : undefined;

  return (
    <WidgetShell id="position-size" title="Size a position yourself" intro="Change any number. The share count updates as you type. Simulated figures, not advice.">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Account size" value={account} onChange={setAccount} prefix="$" error={otherError && /account/i.test(otherError) ? otherError : undefined} testId="ps-account" />
        <div className="min-w-0">
          <label htmlFor={riskId} className="mb-1.5 flex items-baseline justify-between gap-2 t-small font-medium text-ink-2">
            <span>Risk per trade</span>
            <span className="tnum text-ink">{risk.toFixed(1)}%</span>
          </label>
          <input id={riskId} type="range" min={0.5} max={3} step={0.1} value={risk} onChange={(ev) => setRisk(Number(ev.target.value))} data-testid="ps-risk" className="block h-11 w-full cursor-pointer" style={{ accentColor: "var(--ink)" }} aria-valuetext={`${risk.toFixed(1)} percent of the account`} />
          <p className="t-small text-ink-2">Most traders stay between 1% and 2%.</p>
        </div>
        <NumberField label="Entry price" value={entry} onChange={setEntry} prefix="$" error={otherError && /entry/i.test(otherError) ? otherError : undefined} testId="ps-entry" />
        <NumberField label="Stop price" value={stop} onChange={setStop} prefix="$" error={stopError ?? (otherError && /stop/i.test(otherError) ? otherError : undefined)} hint="Where your idea is wrong." testId="ps-stop" />
      </div>
      {res.ok ? (
        <>
          <dl className="mt-6 grid gap-x-6 sm:grid-cols-2" aria-live="polite">
            <Readout label="Shares to buy" value={num(res.shares)} testId="ps-shares" strong />
            <Readout label="Dollars at risk" value={usd(res.dollarRisk)} testId="ps-risk-usd" strong />
            <Readout label="Position value" value={usd(res.positionValue)} testId="ps-value" />
            <Readout label="Share of your account" value={`${(res.pctOfAccount * 100).toFixed(1)}%`} testId="ps-pct" />
          </dl>
          <p className="tnum mt-3 t-small text-ink-2">
            {usd(res.riskBudget)} budget ÷ {usd(res.perShare)} risk per share = {num(res.shares)} shares.
            {res.shares === 0 && " The stop is too far away for this budget. Tighten it or accept a bigger risk."}
            {res.pctOfAccount > 0.25 && " That is more than 25% of your account in one stock. The stop keeps the loss small, but think about concentration."}
          </p>
        </>
      ) : (
        <p className="mt-6 t-small text-ink-2" aria-live="polite">
          Fix the highlighted field to see your share count.
        </p>
      )}
    </WidgetShell>
  );
}

/* ---------------- reward to risk ---------------- */
const RR = { W: 340, H: 150, L: 44, R: 296 };

export function RewardRiskWidget() {
  const [entry, setEntry] = useState("100");
  const [stop, setStop] = useState("95");
  const [target, setTarget] = useState("110");
  const [hover, setHover] = useState<number | null>(null);
  const e = parseAmount(entry);
  const s = parseAmount(stop);
  const t = parseAmount(target);
  const plan = rewardRiskPlan(e, s, t);
  const stopErr = s !== undefined && e !== undefined && s >= e ? "Put the stop below your entry. It marks where you are wrong." : undefined;
  const targetErr = t !== undefined && e !== undefined && t <= e ? "Put the target above your entry. It marks where you take profit." : undefined;

  const diagram = useMemo(() => {
    if (!plan || e === undefined || s === undefined || t === undefined) return null;
    const x = (p: number) => RR.L + ((p - s) / (t - s)) * (RR.R - RR.L);
    return { x, xe: x(e), lo: s, hi: t };
  }, [plan, e, s, t]);

  const onMove = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!diagram) return;
    const box = ev.currentTarget.getBoundingClientRect();
    const vx = ((ev.clientX - box.left) / box.width) * RR.W;
    const p = diagram.lo + ((vx - RR.L) / (RR.R - RR.L)) * (diagram.hi - diagram.lo);
    setHover(Math.min(diagram.hi, Math.max(diagram.lo, p)));
  };

  let readout = "Move over the bar to read any price.";
  if (hover !== null && plan && e !== undefined && s !== undefined) {
    const diff = hover - e;
    const mult = Math.abs(diff) / (e - s);
    readout = `At ${usd(hover)} you are ${diff >= 0 ? "up" : "down"} ${usd(Math.abs(diff))}, which is ${mult.toFixed(1)} times your risk.`;
  }
  const need = e !== undefined && s !== undefined && e > s ? minTarget(e, s) : undefined;

  return (
    <WidgetShell id="reward-risk" title="Test a trade plan" intro="Enter your entry, stop and target. The bars are drawn to scale.">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Entry price" value={entry} onChange={setEntry} prefix="$" testId="rr-entry" />
        <NumberField label="Stop price" value={stop} onChange={setStop} prefix="$" error={stopErr} testId="rr-stop" />
        <NumberField label="Target price" value={target} onChange={setTarget} prefix="$" error={targetErr} testId="rr-target" />
      </div>
      {plan && diagram && e !== undefined && s !== undefined && t !== undefined ? (
        <>
          <svg
            viewBox={`0 0 ${RR.W} ${RR.H}`}
            role="img"
            aria-label={`Plan to scale. Risk ${usd(e - s)} per share from the stop at ${usd(s)} up to the entry at ${usd(e)}. Reward ${usd(t - e)} per share from the entry up to the target at ${usd(t)}.`}
            className="mt-6 block w-full max-w-[520px] touch-none"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            data-testid="rr-diagram"
          >
            <text x={Math.min(Math.max(diagram.xe, 56), 284)} y={22} textAnchor="middle" fontSize={12} fill="var(--ink-2)">
              Entry {usd(e)}
            </text>
            <line x1={diagram.xe} x2={diagram.xe} y1={28} y2={80} stroke="var(--ink)" strokeWidth={2} />
            <rect x={RR.L} y={42} width={Math.max(1, diagram.xe - RR.L)} height={28} fill="var(--red)" data-testid="rr-risk-bar" />
            <rect x={diagram.xe} y={42} width={Math.max(1, RR.R - diagram.xe)} height={28} fill="var(--ink)" data-testid="rr-reward-bar" />
            <text x={(RR.L + diagram.xe) / 2} y={96} textAnchor="middle" fontSize={12} fill="var(--red)" fontWeight={600}>
              {diagram.xe - RR.L > 60 ? `Risk ${usd(e - s)}` : "Risk"}
            </text>
            <text x={(RR.R + diagram.xe) / 2} y={96} textAnchor="middle" fontSize={12} fill="var(--ink)" fontWeight={600}>
              {RR.R - diagram.xe > 70 ? `Reward ${usd(t - e)}` : "Reward"}
            </text>
            <text x={RR.L} y={128} textAnchor="middle" fontSize={12} fill="var(--ink-2)">
              Stop {usd(s)}
            </text>
            <text x={RR.R} y={128} textAnchor="middle" fontSize={12} fill="var(--ink-2)">
              Target {usd(t)}
            </text>
            <line x1={RR.L} x2={RR.R} y1={76} y2={76} stroke="var(--rule-strong)" strokeWidth={1} />
            {hover !== null && <line x1={diagram.x(hover)} x2={diagram.x(hover)} y1={36} y2={76} stroke="var(--pencil)" strokeWidth={2} />}
          </svg>
          <p className="mt-1 min-h-10 t-small text-ink-2" aria-hidden>
            {readout}
          </p>
          <dl className="mt-3 grid gap-x-6 sm:grid-cols-2" aria-live="polite">
            <div className="min-w-0 border-t border-rule py-2.5">
              <dt className="t-small text-ink-2">Reward to risk</dt>
              <dd className="tnum t-readout">
                <span data-testid="rr-value">{plan.r.toFixed(1)}</span>
                <span className="t-h3"> to 1</span>
              </dd>
            </div>
            <Readout label="Win rate you need to break even" value={`${(plan.breakEven * 100).toFixed(0)}%`} testId="rr-breakeven" strong />
          </dl>
          <p className="mt-3 flex items-start gap-2 t-small" data-testid="rr-verdict">
            {plan.meets ? <MarkGlyph kind="good" size={16} className="mt-0.5" /> : <MarkGlyph kind="warn" size={16} className="mt-0.5" />}
            <span>{plan.meets ? "This plan meets the 2 to 1 minimum the order ticket checks for." : `This plan is below 2 to 1.${need ? ` Move the target to ${usd(need)} or higher, or tighten the stop.` : ""}`}</span>
          </p>
        </>
      ) : (
        <p className="mt-6 t-small text-ink-2" aria-live="polite">
          Enter a stop below your entry and a target above it to see the plan.
        </p>
      )}
    </WidgetShell>
  );
}

/* ---------------- trend spotter ---------------- */
const TS = { W: 300, H: 150, P: 10 };

function TrendPlot({ chart, n, revealed }: { chart: TrendChart; n: number; revealed: boolean }) {
  const [at, setAt] = useState<number | null>(null);
  const { prices } = chart;
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = (hi - lo) * 0.12;
  const x = (i: number) => TS.P + (i / (prices.length - 1)) * (TS.W - 2 * TS.P);
  const y = (v: number) => TS.H - TS.P - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (TS.H - 2 * TS.P);
  const line = prices.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const through = (idx: number[]) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(prices[i]).toFixed(1)}`).join(" ");
  const fmt = (idx: number[]) => idx.map((i) => usd(prices[i], 0)).join(", ");
  const label = `Chart ${n}. ${prices.length} days of closing prices from ${usd(lo, 0)} to ${usd(hi, 0)}. Swing lows: ${fmt(chart.lows)}. Swing highs: ${fmt(chart.highs)}.`;
  return (
    <div>
      <svg
        viewBox={`0 0 ${TS.W} ${TS.H}`}
        role="img"
        aria-label={label}
        className="block w-full touch-none rounded-md border border-rule bg-field"
        onPointerMove={(ev) => {
          const box = ev.currentTarget.getBoundingClientRect();
          const vx = ((ev.clientX - box.left) / box.width) * TS.W;
          setAt(Math.min(prices.length - 1, Math.max(0, Math.round(((vx - TS.P) / (TS.W - 2 * TS.P)) * (prices.length - 1)))));
        }}
        onPointerLeave={() => setAt(null)}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={TS.W} y1={TS.H * f} y2={TS.H * f} stroke="var(--grid)" strokeWidth={1} />
        ))}
        <path d={line} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {revealed && (
          <g fill="none" stroke="var(--pencil)" strokeWidth={1.5}>
            <path d={through(chart.lows)} strokeDasharray="5 4" />
            <path d={through(chart.highs)} strokeDasharray="5 4" />
            {[...chart.lows, ...chart.highs].map((i) => (
              <circle key={i} cx={x(i)} cy={y(prices[i])} r={4} />
            ))}
          </g>
        )}
        {at !== null && (
          <g>
            <line x1={x(at)} x2={x(at)} y1={0} y2={TS.H} stroke="var(--ink-2)" strokeWidth={1} />
            <circle cx={x(at)} cy={y(prices[at])} r={3.5} fill="var(--series-1)" />
          </g>
        )}
      </svg>
      <p className="tnum mt-1.5 min-h-5 t-small text-ink-2" aria-hidden>
        {at !== null ? `Day ${at + 1}: ${usd(prices[at])}` : `${usd(lo, 0)} to ${usd(hi, 0)}`}
      </p>
    </div>
  );
}

const KINDS: TrendKind[] = ["up", "down", "range"];

export function TrendSpotterWidget() {
  const [round, setRound] = useState(1);
  const [answers, setAnswers] = useState<(TrendKind | undefined)[]>([]);
  const [revealed, setRevealed] = useState(false);
  const charts = useMemo(() => trendRound(round), [round]);
  const gid = useId();
  const answered = charts.every((_, i) => answers[i]);
  const correct = charts.filter((c, i) => answers[i] === classifySwings(c)).length;

  return (
    <WidgetShell id="trend-spotter" title="Spot the trend" intro="Label each chart as an uptrend, a downtrend or a range. Look at the swing lows and the swing highs.">
      <div className="grid gap-6 sm:grid-cols-3">
        {charts.map((c, i) => {
          const truth = classifySwings(c);
          const mine = answers[i];
          return (
            <fieldset key={`${round}-${i}`} className="min-w-0" disabled={revealed}>
              <legend className="mb-2 t-small font-semibold">Chart {i + 1}</legend>
              <TrendPlot chart={c} n={i + 1} revealed={revealed} />
              <div className="mt-2 grid gap-1.5">
                {KINDS.map((k) => (
                  <label key={k} className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 t-small has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", mine === k ? "border-ink bg-ink text-on-ink" : "border-edge hover:bg-well")}>
                    <input type="radio" name={`${gid}-${i}`} value={k} checked={mine === k} onChange={() => setAnswers((a) => Object.assign([...a], { [i]: k }))} className="sr-only" />
                    {TREND_LABEL[k]}
                  </label>
                ))}
              </div>
              {revealed && (
                <p className="mt-2 flex items-start gap-1.5 t-small" data-testid={`ts-result-${i}`}>
                  <MarkGlyph kind={mine === truth ? "good" : "risk"} size={16} className="mt-0.5" />
                  <span>
                    <span className="font-semibold">{mine === truth ? "Correct." : `Not quite. This is a ${TREND_LABEL[truth].toLowerCase()}.`}</span> {TREND_WHY[truth]}
                  </span>
                </p>
              )}
            </fieldset>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!revealed ? (
          <>
            <button type="button" disabled={!answered} onClick={() => setRevealed(true)} className="btn btn-primary" data-testid="ts-check">
              Check my answers
            </button>
            {!answered && <span className="t-small text-ink-2">Label all three charts to check.</span>}
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setRound((r) => r + 1);
                setAnswers([]);
                setRevealed(false);
              }}
            >
              Try three new charts
            </button>
          </>
        )}
        <p className="tnum font-semibold" role="status" data-testid="ts-score">
          {revealed ? `${correct} of 3 correct` : ""}
        </p>
      </div>
    </WidgetShell>
  );
}

/* ---------------- lesson wrapper ---------------- */
export function LessonWidget({ kind }: { kind: WidgetId }) {
  const cash = useApp((s) => s.cash);
  const positions = useApp((s) => s.positions);
  const prices = useMarket((s) => s.prices);
  if (kind === "position-size") return <PositionSizeWidget defaultAccount={equityOf(cash, positions, prices)} />;
  if (kind === "reward-risk") return <RewardRiskWidget />;
  return <TrendSpotterWidget />;
}
