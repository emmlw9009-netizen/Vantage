/**
 * The one place that compares money and ratios, so the ticket checklist, the trade review, the journal record and the
 * missions always agree. Prices are whole cents, so reward and risk are compared in integer cents, and every ratio
 * limit is epsilon-tolerant (a plan that is exactly 2 to 1 passes even when floating point says 1.9999999999999971).
 */
const EPS = 1e-9;

/** Integer cents of a dollar amount. */
export const toCents = (n: number) => Math.round(n * 100 + (n >= 0 ? 1e-7 : -1e-7));

/** Reward to risk of a long plan in cents, or undefined without a valid stop below entry or a target above entry. */
export function rewardRiskOf(entry: number, stop?: number, target?: number): number | undefined {
  if (!stop || !target || stop <= 0) return undefined;
  const e = toCents(entry);
  const risk = e - toCents(stop);
  const reward = toCents(target) - e;
  if (risk <= 0 || reward <= 0) return undefined;
  return reward / risk;
}

/** Reward at least 2 times the risk. */
export const meetsRewardRisk = (rr: number | undefined | null): boolean => rr != null && rr >= 2 - EPS;

/** value <= limit, tolerant of floating point (risk 2%, position 25%). */
export const atMost = (value: number, limit: number) => value <= limit + EPS;

/** The lowest target (in dollars, to the cent) that makes the plan 2 to 1. */
export function minTarget(entry: number, stop: number): number {
  const e = toCents(entry);
  return (e + 2 * (e - toCents(stop))) / 100;
}

/** Quick-button prices: stops round up and targets round up to the cent, so an exact 2 to 1 percent pair always passes. */
export const ceilCent = (n: number) => Math.ceil(n * 100 - 1e-7) / 100;
