/** Share cards carry the process score only: no P&L, no returns. Query values are validated before anything renders. */
export interface ShareScore {
  score: number;
  label: string;
  symbol: string;
  side: "buy" | "sell";
}

export const SHARE_LABELS = ["Disciplined", "Solid", "Needs work", "High risk"] as const;
export const SHARE_DISCLAIMER = "Simulated trade. Educational only, not investment advice.";

export function shareScorePath(s: ShareScore) {
  const q = new URLSearchParams({ s: String(Math.round(s.score)), l: s.label, sym: s.symbol, side: s.side });
  return `/share/score?${q.toString()}`;
}

type Param = string | string[] | undefined;
const one = (v: Param) => (Array.isArray(v) ? v[0] : v);

/** Defaults are safe examples; the label is always derived from the score so a crafted link cannot show a mismatch. */
export function parseShareScore(sp: Record<string, Param>): ShareScore & { valid: boolean } {
  const n = Number(one(sp.s));
  const valid = Number.isFinite(n) && n >= 0 && n <= 100;
  const score = valid ? Math.round(n) : 88;
  const label = score >= 85 ? "Disciplined" : score >= 70 ? "Solid" : score >= 50 ? "Needs work" : "High risk";
  const sym = (one(sp.sym) ?? "").toUpperCase();
  const symbol = /^[A-Z.]{1,6}$/.test(sym) ? sym : "SPY";
  const side = one(sp.side) === "sell" ? "sell" : "buy";
  return { score, label, symbol, side, valid };
}
