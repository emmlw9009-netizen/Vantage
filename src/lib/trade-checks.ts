import { atMost, meetsRewardRisk } from "./money";
// The five pre-flight checks as they apply to a *recorded* trade (journal, review, community, share).
// Mirrors lib/preflight.ts thresholds: reason ≥ 40 chars, stop below entry, risk ≤ 2%, reward ≥ 2× risk, position ≤ 25%.
import type { Trade } from "@/store/app";

export type CheckId = "reason" | "stop" | "risk" | "target" | "size";
export type CheckState = "done" | "todo" | "na";

/** Canonical order, everywhere: why, where I'm wrong, how much I can lose, what I can win, how big. */
export const CHECKS: { id: CheckId; short: string; label: string }[] = [
  { id: "reason", short: "Reason", label: "Reason written" },
  { id: "stop", short: "Stop", label: "Stop-loss set" },
  { id: "risk", short: "Risk", label: "Risk under 2% of account" },
  { id: "target", short: "Target", label: "Target at least 2× the risk" },
  { id: "size", short: "Size", label: "Position under 25% of account" },
];

export function isAutoExit(t: Trade) {
  return t.role === "stop-loss" || t.role === "take-profit";
}

/** null for automatic bracket exits, which have no plan of their own. */
export function tradeChecks(t: Trade): Record<CheckId, CheckState> | null {
  if (isAutoExit(t)) return null;
  const reason: CheckState = (t.thesis ?? "").trim().length >= 40 ? "done" : "todo";
  if (t.side === "sell") return { reason, stop: "na", risk: "na", target: "na", size: "done" };
  const risk = t.metrics.riskPct;
  const rr = t.metrics.rewardRisk;
  const pos = t.metrics.positionPct;
  return {
    reason,
    stop: t.stopLoss != null && t.stopLoss > 0 && t.stopLoss < t.price ? "done" : "todo",
    risk: risk != null && atMost(risk, 0.02) ? "done" : "todo",
    target: meetsRewardRisk(rr) ? "done" : "todo",
    size: pos == null || atMost(pos, 0.25) ? "done" : "todo",
  };
}

export function checkSummary(c: Record<CheckId, CheckState>) {
  const applicable = CHECKS.filter((k) => c[k.id] !== "na");
  const done = applicable.filter((k) => c[k.id] === "done");
  const missing = applicable.filter((k) => c[k.id] === "todo").map((k) => k.short);
  return { done: done.length, total: applicable.length, missing };
}
