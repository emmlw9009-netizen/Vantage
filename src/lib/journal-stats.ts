// Pure journal analytics computed from local trades (no API). Used by /journal.
import type { Trade } from "@/store/app";
import { CHECKS, isAutoExit, tradeChecks, type CheckId } from "./trade-checks";

/** Plain names for the analysis flag ids that count as mistakes, with the lesson that fixes each. */
export const MISTAKE: Record<string, { name: string; lesson?: string }> = {
  "no-stop": { name: "No stop-loss", lesson: "stop-losses" },
  "no-thesis": { name: "No reason recorded", lesson: "trading-journal" },
  "thesis-thin": { name: "Thin reason", lesson: "trading-journal" },
  "size-big": { name: "Concentrated position", lesson: "position-sizing" },
  "size-med": { name: "Sizable position", lesson: "position-sizing" },
  "risk-high": { name: "Risk over 2%", lesson: "position-sizing" },
  "rr-bad": { name: "Low reward to risk", lesson: "risk-reward" },
  chase: { name: "Chasing a jump", lesson: "fomo-and-greed" },
  "avg-down": { name: "Averaging down", lesson: "loss-aversion" },
  sector: { name: "Sector concentration", lesson: "diversification" },
  "quick-flip": { name: "Very short hold", lesson: "overtrading" },
  overtrade: { name: "Overtrading", lesson: "overtrading" },
};

export function journalStats(trades: Trade[]) {
  const chron = [...trades].sort((a, b) => a.at - b.at);
  const planned = chron.filter((t) => !isAutoExit(t));
  const entries = chron.filter((t) => t.role === "entry");
  const closed = chron.filter((t) => t.realizedPnl != null);
  const wins = closed.filter((t) => (t.realizedPnl ?? 0) > 0).length;
  const realized = closed.reduce((a, t) => a + (t.realizedPnl ?? 0), 0);
  const avgScore = entries.length ? Math.round(entries.reduce((a, t) => a + t.score, 0) / entries.length) : null;

  // checks kept per column (done / applicable)
  const kept = Object.fromEntries(CHECKS.map((c) => [c.id, { done: 0, total: 0 }])) as Record<CheckId, { done: number; total: number }>;
  for (const t of planned) {
    const c = tradeChecks(t);
    if (!c) continue;
    for (const k of CHECKS) {
      if (c[k.id] === "na") continue;
      kept[k.id].total++;
      if (c[k.id] === "done") kept[k.id].done++;
    }
  }

  // most common mistakes
  const counts = new Map<string, number>();
  for (const t of chron) for (const f of t.flags) if (f.tone !== "good" && MISTAKE[f.id]) counts.set(f.id, (counts.get(f.id) ?? 0) + 1);
  const mistakes = [...counts.entries()].map(([id, n]) => ({ id, n, ...MISTAKE[id] })).sort((a, b) => b.n - a.n);

  // patterns Nova sees (plain sentences, each with a lesson)
  const patterns: { kind: "risk" | "warn"; text: string; lesson?: string }[] = [];
  const lastBuys = entries.slice(-5);
  const noStop = lastBuys.filter((t) => t.flags.some((f) => f.id === "no-stop")).length;
  if (lastBuys.length >= 2 && noStop >= 2) patterns.push({ kind: "risk", text: `${noStop} of your last ${lastBuys.length} buys had no stop-loss.`, lesson: "stop-losses" });
  for (const m of mistakes) {
    if (patterns.length >= 3) break;
    if (m.id === "no-stop" && noStop >= 2) continue;
    if (m.n >= 2) patterns.push({ kind: "warn", text: `${m.name} showed up in ${m.n} of your ${chron.length} trades.`, lesson: m.lesson });
  }

  return {
    total: chron.length,
    entries: entries.length,
    closed: closed.length,
    winRate: closed.length ? wins / closed.length : null,
    realized,
    avgScore,
    scoreSeries: entries.map((t) => ({ t: t.at, c: t.score })),
    kept,
    mistakes,
    patterns,
  };
}

/** What to work on next, for each mistake, in plain imperatives (used by the weekly debrief's three focus points). */
const FOCUS: Record<string, string> = {
  "no-stop": "Put a stop-loss on every buy, at the price where your reason stops being true.",
  "no-thesis": "Write one sentence before each trade: why you're buying and what would prove you wrong.",
  "thesis-thin": "Make your reason specific: what you expect, why, and the price that proves you wrong.",
  "size-big": "Keep any one stock under 25% of the account.",
  "size-med": "Size from your stop so a loss costs 1–2% of the account, not more.",
  "risk-high": "Size from your stop so a loss costs 1–2% of the account, not more.",
  "rr-bad": "Set a take-profit at least twice as far from your entry as your stop.",
  chase: "Wait for a pullback instead of buying right after a big jump.",
  "avg-down": "Don't add to a losing position. Let the stop decide.",
  sector: "Spread positions across at least three sectors.",
  "quick-flip": "Give a trade the time your plan said it needs before you sell.",
  overtrade: "Place fewer, planned trades. Skip the ones without a reason.",
};
const CHECK_FOCUS: Record<CheckId, string> = {
  reason: "Write your reason before every trade.",
  stop: "Attach a stop-loss to every buy.",
  risk: "Keep the risk on each trade at or under 2% of the account.",
  target: "Plan a target at least twice your risk.",
  size: "Keep any one position under 25% of the account.",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Elite weekly debrief: the last 7 days, computed with journalStats over that window (and the 7 days before, for the
 * trend). Best and worst decision are by process score, not profit: process over outcome.
 */
export function weeklyDebrief(trades: Trade[], now = Date.now()) {
  const from = now - WEEK_MS;
  const week = trades.filter((t) => t.at > from && t.at <= now);
  const before = trades.filter((t) => t.at > from - WEEK_MS && t.at <= from);
  const st = journalStats(week);
  const prev = journalStats(before);
  const planned = week.filter((t) => !isAutoExit(t)).sort((a, b) => b.score - a.score || a.at - b.at);
  const best = planned[0];
  const worst = planned.length > 1 ? planned[planned.length - 1] : undefined;

  // three focus points: the most frequent mistakes first, then the checks kept least often
  const focus: { text: string; lesson?: string; why: string }[] = [];
  const seenText = new Set<string>();
  for (const m of st.mistakes) {
    const text = FOCUS[m.id];
    if (!text || seenText.has(text) || focus.length >= 3) continue;
    seenText.add(text);
    focus.push({ text, lesson: m.lesson, why: `${m.name} in ${m.n} of ${st.total} trades this week.` });
  }
  const weakest = CHECKS.map((c) => ({ c, k: st.kept[c.id] })).filter((x) => x.k.total > 0 && x.k.done < x.k.total).sort((a, b) => a.k.done / a.k.total - b.k.done / b.k.total);
  for (const { c, k } of weakest) {
    if (focus.length >= 3) break;
    const text = CHECK_FOCUS[c.id];
    if (seenText.has(text)) continue;
    seenText.add(text);
    focus.push({ text, why: `${c.short} check kept on ${k.done} of ${k.total} trades.` });
  }

  return {
    from,
    to: now,
    stats: st,
    previousAvgScore: prev.avgScore,
    best,
    worst,
    focus,
  };
}
