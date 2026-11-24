import { usd } from "./format";

export type PreflightId = "reason" | "stop" | "risk" | "target" | "size";

export interface PreflightCheck {
  id: PreflightId;
  label: string;
  ok: boolean;
  applicable: boolean;
  fix?: string;
}

export interface PreflightInput {
  side: "buy" | "sell";
  qty: number;
  entry: number;
  stopLoss?: number;
  takeProfit?: number;
  thesis?: string;
  equity: number;
  existingQty?: number;
}

/** Thresholds mirror analyzeTrade(): risk ≤ 2%, reward ≥ 2× risk, position ≤ 25%, reason ≥ 40 chars. */
export function preflightChecks(i: PreflightInput): PreflightCheck[] {
  const buy = i.side === "buy";
  const equity = Math.max(1, i.equity);
  const qty = Math.max(0, Math.floor(i.qty));
  const stopOk = buy && !!i.stopLoss && i.stopLoss > 0 && i.stopLoss < i.entry;
  const perShare = stopOk ? i.entry - (i.stopLoss as number) : 0;
  const riskPct = stopOk ? (perShare * qty) / equity : undefined;
  const targetOk = stopOk && !!i.takeProfit && i.takeProfit > i.entry && (i.takeProfit - i.entry) / perShare >= 2;
  const positionPct = ((i.existingQty ?? 0) + qty) * i.entry / equity;
  const thesisLen = (i.thesis ?? "").trim().length;

  const maxByRisk = stopOk ? Math.floor((equity * 0.02) / perShare) : 0;
  const maxBySize = Math.max(0, Math.floor((equity * 0.25) / i.entry) - (i.existingQty ?? 0));

  return [
    {
      id: "reason",
      label: "Reason written",
      applicable: true,
      ok: thesisLen >= 40,
      fix: thesisLen >= 40 ? undefined : `Write at least 40 characters (${thesisLen} so far)`,
    },
    {
      id: "stop",
      label: "Stop-loss set",
      applicable: buy,
      ok: stopOk,
      fix: stopOk ? undefined : i.stopLoss && i.stopLoss >= i.entry ? `Move the stop below ${usd(i.entry)}` : `Add a stop-loss below ${usd(i.entry * 0.95)}`,
    },
    {
      id: "risk",
      label: "Risk under 2% of account",
      applicable: buy,
      ok: riskPct != null && riskPct <= 0.02,
      fix: riskPct == null ? "Set a stop-loss first" : riskPct <= 0.02 ? undefined : `Cut to ${Math.max(1, maxByRisk)} shares to risk 2%`,
    },
    {
      id: "target",
      label: "Target at least 2× the risk",
      applicable: buy,
      ok: targetOk,
      fix: targetOk ? undefined : !stopOk ? "Set a stop-loss first" : `Set a target above ${usd(i.entry + 2 * perShare)}`,
    },
    {
      id: "size",
      label: "Position under 25% of account",
      applicable: true,
      ok: !buy || positionPct <= 0.25,
      fix: !buy || positionPct <= 0.25 ? undefined : `Cut to ${maxBySize} shares to stay under 25%`,
    },
  ];
}
