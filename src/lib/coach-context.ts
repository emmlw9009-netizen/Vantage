import { useApp, equityOf, STARTING_CASH } from "@/store/app";
import { useMarket } from "@/store/market";
import { levelFor } from "./course";
import { TICKER_MAP } from "./market-data";

/** Plain-text snapshot of the user's state for the coach. */
export function buildCoachContext(): string {
  const s = useApp.getState();
  const m = useMarket.getState();
  const equity = equityOf(s.cash, s.positions, m.prices);
  const lvl = levelFor(s.xp);
  const lines: string[] = [];
  lines.push(`User: ${s.profile.name || "Trader"} · experience: ${s.profile.experience} · goal: ${s.profile.goal} · level ${lvl.level} ${lvl.name} (${s.xp} XP)`);
  lines.push(`Account: equity $${equity.toFixed(2)} (${(((equity - STARTING_CASH) / STARTING_CASH) * 100).toFixed(2)}% since start), cash $${s.cash.toFixed(2)}`);
  const pos = Object.values(s.positions);
  if (pos.length) {
    lines.push("Positions:");
    for (const p of pos) {
      const px = m.prices[p.symbol] ?? p.avgCost;
      lines.push(`  ${p.symbol} (${TICKER_MAP[p.symbol]?.sector}) ${p.qty} sh @ $${p.avgCost.toFixed(2)} → $${px.toFixed(2)}, P&L ${(((px - p.avgCost) / p.avgCost) * 100).toFixed(1)}%, ${((p.qty * px) / equity * 100).toFixed(1)}% of account`);
    }
  } else lines.push("Positions: none");
  const open = s.orders.filter((o) => o.status === "open");
  if (open.length) lines.push(`Open orders: ${open.map((o) => `${o.role} ${o.side} ${o.qty} ${o.symbol} @ ${o.limitPrice ?? o.stopPrice}`).join("; ")}`);
  const recent = s.trades.slice(0, 6);
  if (recent.length) {
    lines.push("Recent trades (newest first):");
    for (const t of recent) {
      lines.push(`  ${t.side.toUpperCase()} ${t.qty} ${t.symbol} @ $${t.price.toFixed(2)} [${t.role}] score ${t.score}${t.realizedPnl != null ? ` realized $${t.realizedPnl.toFixed(2)}` : ""}; flags: ${t.flags.map((f) => f.title).join(" | ")}${t.thesis ? `; thesis: "${t.thesis.slice(0, 200)}"` : ""}`);
    }
  }
  const done = Object.keys(s.completedLessons);
  lines.push(`Lessons completed: ${done.length ? done.join(", ") : "none"}`);
  const news = m.news.slice(0, 3);
  if (news.length) lines.push(`Latest simulated headlines: ${news.map((n) => n.headline).join(" | ")}`);
  return lines.join("\n");
}
