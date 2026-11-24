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
