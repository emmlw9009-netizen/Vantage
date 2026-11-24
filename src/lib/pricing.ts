import { round2 } from "./market-data";

/** Market orders fill 0.02% away from the quote (see store/app.ts placeOrder). */
export const SLIPPAGE = 0.0002;

export const marketFillPrice = (side: "buy" | "sell", price: number) => round2(price * (side === "buy" ? 1 + SLIPPAGE : 1 - SLIPPAGE));

/**
 * The price an order is expected to fill at, used by the ticket, the checklist and placeOrder so they all agree.
 * Market: the slipped quote. Limit buy: never above the limit, and a limit above the market fills at the market on the next tick.
 */
export function expectedFill(side: "buy" | "sell", type: "market" | "limit" | "stop", market: number, trigger?: number): number {
  if (type === "market" || !trigger) return marketFillPrice(side, market);
  if (side === "buy") return Math.min(trigger, market);
  return type === "limit" ? Math.max(trigger, market) : Math.min(trigger, market);
}

/**
 * Strict price parser for the stop and target fields.
 * Accepts "5", "5.25", ".5", "1,100.50" (proper thousands groups). Rejects "5abc", "1e3", "-5", "Infinity", "1,10", values under 0.01.
 */
export function parsePrice(raw: string): { value?: number; error?: string } {
  const s = raw.trim().replace(/^\$/, "");
  if (!s) return {};
  const plain = /^(\d+(\.\d+)?|\.\d+)$/.test(s);
  const grouped = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s);
  if (!plain && !grouped) return { error: "Enter a plain number, like 150.25" };
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0.01) return { error: "Enter a price of at least $0.01" };
  if (n > 10_000_000) return { error: "That price is too large" };
  return { value: n };
}
