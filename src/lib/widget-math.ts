/**
 * Pure maths behind the lesson widgets (and, later, the public calculator pages). No React, no store.
 * Reward and risk are compared with money.ts so a widget agrees with the ticket, the review and the coach.
 */
import { hashString, mulberry32, round2 } from "./market-data";
import { rewardRiskOf, meetsRewardRisk, toCents } from "./money";

/** Parse a typed price or amount. Accepts "$1,000.50". Returns undefined for blanks and junk. */
export function parseAmount(raw: string): number | undefined {
  const s = raw.replace(/[$,\s]/g, "");
  if (!s || !/^\d*\.?\d*$/.test(s) || s === ".") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export interface SizeResult {
  ok: true;
  shares: number;
  perShare: number;
  riskBudget: number;
  dollarRisk: number;
  positionValue: number;
  pctOfAccount: number;
}
export interface SizeError {
  ok: false;
  /** What happened and how to fix it. */
  message: string;
}

/** Shares = floor((account x risk %) / (entry - stop)), computed in whole cents. */
export function sizePosition(account: number | undefined, riskPct: number, entry: number | undefined, stop: number | undefined): SizeResult | SizeError {
  if (!account || account <= 0) return { ok: false, message: "Enter your account size, for example 100,000." };
  if (!entry || entry <= 0) return { ok: false, message: "Enter an entry price above zero." };
  if (!stop || stop <= 0) return { ok: false, message: "Enter a stop price above zero." };
  const perCents = toCents(entry) - toCents(stop);
  if (perCents <= 0) return { ok: false, message: "Your stop must be below your entry. Move the stop to the price where your idea is wrong." };
  const perShare = perCents / 100;
  const riskBudget = (account * riskPct) / 100;
  const shares = Math.floor(riskBudget / perShare + 1e-9);
  return {
    ok: true,
    shares,
    perShare,
    riskBudget,
    dollarRisk: shares * perShare,
    positionValue: shares * entry,
    pctOfAccount: (shares * entry) / account,
  };
}

/** Reward to risk, its 2 to 1 verdict and the break-even win rate 1 / (1 + R). */
export function rewardRiskPlan(entry?: number, stop?: number, target?: number) {
  const r = rewardRiskOf(entry ?? 0, stop, target);
  if (r === undefined) return undefined;
  return { r, meets: meetsRewardRisk(r), breakEven: 1 / (1 + r) };
}

/* ---------------- trend spotter ---------------- */
export type TrendKind = "up" | "down" | "range";
export const TREND_LABEL: Record<TrendKind, string> = { up: "Uptrend", down: "Downtrend", range: "Range" };
export const TREND_WHY: Record<TrendKind, string> = {
  up: "Each swing low and each swing high is higher than the one before.",
  down: "Each swing low and each swing high is lower than the one before.",
  range: "The swings stop at about the same levels, so there is no steady direction.",
};

export interface TrendChart {
  kind: TrendKind;
  /** Daily closes. */
  prices: number[];
  /** Indexes into prices of the swing lows and highs, in time order. */
  lows: number[];
  highs: number[];
}

const PER_LEG = 6;
const SWINGS = 4;

/**
 * One chart whose swing structure is fixed first and the line drawn through it second, so the label is correct by
 * construction. Pivots alternate low, high, low, high... Between two pivots the line is eased and clamped inside the
 * pair, so the pivots are the true extremes. Up: both lows and highs strictly rise. Down: both strictly fall.
 * Range: lows and highs alternate above and below a flat level, so neither series is monotone.
 */
export function makeTrendChart(kind: TrendKind, seed: string): TrendChart {
  const rand = mulberry32(hashString(seed));
  const base = 60 + Math.floor(rand() * 140);
  const amp = base * (0.07 + rand() * 0.03);
  const step = amp * (0.35 + rand() * 0.2);
  const lowAt: number[] = [];
  const highAt: number[] = [];
  for (let k = 0; k < SWINGS; k++) {
    const drift = kind === "up" ? k * step : kind === "down" ? (SWINGS - 1 - k) * step : 0;
    const wob = kind === "range" ? (k % 2 === 0 ? 1 : -1) * amp * (0.06 + rand() * 0.08) : (rand() - 0.5) * step * 0.3;
    const wobH = kind === "range" ? (k % 2 === 0 ? -1 : 1) * amp * (0.06 + rand() * 0.08) : (rand() - 0.5) * step * 0.3;
    lowAt.push(base + drift + wob);
    highAt.push(base + amp + drift + wobH);
  }
  const pivots: { v: number; low: boolean }[] = [];
  for (let k = 0; k < SWINGS; k++) {
    pivots.push({ v: lowAt[k], low: true });
    pivots.push({ v: highAt[k], low: false });
  }
  const prices: number[] = [pivots[0].v];
  const lows: number[] = [0];
  const highs: number[] = [];
  for (let i = 1; i < pivots.length; i++) {
    const a = pivots[i - 1].v;
    const b = pivots[i].v;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let j = 1; j <= PER_LEG; j++) {
      const t = j / PER_LEG;
      const eased = a + (b - a) * ((1 - Math.cos(Math.PI * t)) / 2);
      const noise = j === PER_LEG ? 0 : (rand() - 0.5) * Math.abs(b - a) * 0.22 * Math.sin(Math.PI * t);
      prices.push(Math.min(hi, Math.max(lo, eased + noise)));
    }
    (pivots[i].low ? lows : highs).push(prices.length - 1);
  }
  return { kind, prices: prices.map(round2), lows, highs };
}

/** Three charts, one of each kind, in an order set by the round. Deterministic: the same round gives the same charts. */
export function trendRound(round: number): TrendChart[] {
  const rand = mulberry32(hashString(`trend-spotter:${round}`));
  const kinds: TrendKind[] = ["up", "down", "range"];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds.map((k, i) => makeTrendChart(k, `trend-spotter:${round}:${i}:${k}`));
}

/** Independent check used by verify and tests: derive the label from the swings alone. */
export function classifySwings(c: TrendChart): TrendKind {
  const lo = c.lows.map((i) => c.prices[i]);
  const hi = c.highs.map((i) => c.prices[i]);
  const rising = (a: number[]) => a.every((v, i) => i === 0 || v > a[i - 1]);
  const falling = (a: number[]) => a.every((v, i) => i === 0 || v < a[i - 1]);
  if (rising(lo) && rising(hi)) return "up";
  if (falling(lo) && falling(hi)) return "down";
  return "range";
}
