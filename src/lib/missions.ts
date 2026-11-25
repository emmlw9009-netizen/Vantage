import { TICKER_MAP } from "./market-data";
import type { MissionId } from "./course";
import { meetsRewardRisk } from "./money";

interface S {
  trades: { role: string; side: string; symbol: string; thesis?: string; stopLoss?: number; score: number; metrics: Record<string, number | undefined> }[];
  orders: { type: string; role: string }[];
  positions: Record<string, { symbol: string }>;
  chat: { role: string }[];
  posts: unknown[];
}

export function missionDone(id: MissionId, s: S): boolean {
  const entries = s.trades.filter((t) => t.role === "entry");
  switch (id) {
    case "first-trade":
      return entries.length > 0;
    case "use-stop":
      return entries.some((t) => !!t.stopLoss);
    case "write-thesis":
      return entries.some((t) => (t.thesis ?? "").trim().length >= 40);
    case "diversify":
      return new Set(Object.values(s.positions).map((p) => TICKER_MAP[p.symbol]?.sector)).size >= 3;
    case "rr-2":
      return entries.some((t) => meetsRewardRisk(t.metrics.rewardRisk));
    case "buy-etf":
      return entries.some((t) => t.symbol === "SPY" || t.symbol === "QQQ");
    case "ask-coach":
      return s.chat.some((c) => c.role === "user");
    case "post-community":
      return s.posts.length > 0;
    case "score-85":
      return entries.some((t) => t.score >= 85);
    case "limit-order":
      return s.orders.some((o) => o.type === "limit" && (o.role === "entry" || o.role === "exit"));
  }
}
