import { TICKER_MAP } from "./market-data";
import { pct, usd } from "./format";

export type FlagTone = "good" | "warn" | "risk";

export interface Flag {
  id: string;
  tone: FlagTone;
  title: string;
  detail: string;
  lesson?: string;
}

export interface TradeInput {
  side: "buy" | "sell";
  symbol: string;
  qty: number;
  price: number;
  thesis?: string;
  stopLoss?: number;
  takeProfit?: number;
  role: "entry" | "stop-loss" | "take-profit" | "exit";
  realizedPnl?: number;
  heldMs?: number;
}

export interface PortfolioContext {
  equity: number;
  cash: number;
  positions: Record<string, { qty: number; avgCost: number }>;
  prices: Record<string, number>;
  prevClose: Record<string, number>;
  recentTradeCount: number; // trades in last 10 minutes
}

export interface Analysis {
  score: number;
  flags: Flag[];
  metrics: {
    positionPct?: number;
    riskPct?: number;
    rewardRisk?: number;
    dayMovePct?: number;
    sectorPct?: number;
  };
}

export function analyzeTrade(t: TradeInput, ctx: PortfolioContext): Analysis {
  const flags: Flag[] = [];
  let score = 70;
  const metrics: Analysis["metrics"] = {};
  const ticker = TICKER_MAP[t.symbol];
  const notional = t.qty * t.price;
  const prev = ctx.prevClose[t.symbol] ?? t.price;
  const dayMove = t.price / prev - 1;
  metrics.dayMovePct = dayMove;

  if (t.role === "stop-loss") {
    flags.push({
      id: "stop-hit",
      tone: "good",
      title: "Your stop-loss did its job",
      detail: `It sold at ${usd(t.price)} and capped the loss at ${usd(Math.abs(t.realizedPnl ?? 0))}. Small, planned losses are how traders stay in the game.`,
      lesson: "stop-losses",
    });
    return { score: 85, flags, metrics };
  }
  if (t.role === "take-profit") {
    flags.push({
      id: "tp-hit",
      tone: "good",
      title: "Target hit — you followed your plan",
      detail: `Your take-profit filled at ${usd(t.price)} for ${usd(t.realizedPnl ?? 0)}. Taking profits at a level you chose ahead of time beats deciding on the spot.`,
      lesson: "risk-reward",
    });
    return { score: 90, flags, metrics };
  }

  // ---- thesis / journaling ----
  const thesisLen = [...(t.thesis ?? "").trim()].length;
  if (thesisLen >= 40) {
    score += 8;
    flags.push({ id: "thesis", tone: "good", title: "You wrote down a thesis", detail: "Writing down why you're trading lets you grade your thinking later, not just the result.", lesson: "trading-journal" });
  } else if (thesisLen > 0) {
    score += 2;
    flags.push({ id: "thesis-thin", tone: "warn", title: "Your thesis is thin", detail: "Add what you expect to happen, why, and what would prove you wrong.", lesson: "trading-journal" });
  } else {
    score -= 10;
    flags.push({ id: "no-thesis", tone: "warn", title: "No reason recorded", detail: "Trades without a written reason are hard to learn from. Next time, write one sentence on why.", lesson: "trading-journal" });
  }

  if (t.side === "buy") {
    const existing = ctx.positions[t.symbol];
    const existingValue = existing ? existing.qty * t.price : 0;
    const positionPct = (existingValue + notional) / Math.max(1, ctx.equity);
    metrics.positionPct = positionPct;

    // ---- position size ----
    // When risk is defined by a stop at ≤ 2% of the account, a larger position is
    // the textbook result of sizing from the stop, so only flag true concentration.
    const definedRisk = !!t.stopLoss && t.stopLoss < t.price && ((t.price - t.stopLoss) * t.qty) / Math.max(1, ctx.equity) <= 0.02;
    if (definedRisk && positionPct > 0.12 && positionPct <= 0.25) {
      score += 4;
      flags.push({ id: "size-risk", tone: "good", title: `Sized from your stop: ${pct(positionPct, 0, false)} of your account`, detail: "Your stop caps the loss, so this size is fine. Just remember gaps (e.g. earnings) can jump past a stop.", lesson: "position-sizing" });
    } else if (positionPct > 0.25) {
      score -= 22;
      flags.push({ id: "size-big", tone: "risk", title: `Concentrated: ${pct(positionPct, 0, false)} of your account`, detail: `One position this large means a single bad headline can do real damage. Most pros keep one position to 5–10% of the account.`, lesson: "position-sizing" });
    } else if (positionPct > 0.12) {
      score -= 8;
      flags.push({ id: "size-med", tone: "warn", title: `Sizable position: ${pct(positionPct, 0, false)} of your account`, detail: "That's on the heavy side. Make sure your stop limits the damage if you're wrong.", lesson: "position-sizing" });
    } else {
      score += 6;
      flags.push({ id: "size-ok", tone: "good", title: `Sensible size: ${pct(positionPct, 1, false)} of your account`, detail: "No single trade can sink you at this size.", lesson: "position-sizing" });
    }

    // ---- stop loss / risk ----
    if (t.stopLoss && t.stopLoss < t.price) {
      const riskPerShare = t.price - t.stopLoss;
      const riskPct = (riskPerShare * t.qty) / Math.max(1, ctx.equity);
      metrics.riskPct = riskPct;
      if (riskPct <= 0.02) {
        score += 10;
        flags.push({ id: "risk-ok", tone: "good", title: `Defined risk: ${pct(riskPct, 2, false)} of your account`, detail: `If the stop at ${usd(t.stopLoss)} triggers, you lose about ${usd(riskPerShare * t.qty)}. That's inside the classic 1–2% rule.`, lesson: "stop-losses" });
      } else {
        score -= 6;
        flags.push({ id: "risk-high", tone: "warn", title: `Risking ${pct(riskPct, 1, false)} of your account`, detail: `A stop-out costs ${usd(riskPerShare * t.qty)}. Try a smaller size or a tighter stop to get under 2%.`, lesson: "position-sizing" });
      }
      if (t.takeProfit && t.takeProfit > t.price) {
        const rr = (t.takeProfit - t.price) / riskPerShare;
        metrics.rewardRisk = rr;
        if (rr >= 2) {
          score += 6;
          flags.push({ id: "rr-good", tone: "good", title: `Reward-to-risk ${rr.toFixed(1)} : 1`, detail: "At this ratio you can be wrong more than half the time and still come out ahead.", lesson: "risk-reward" });
        } else if (rr < 1.2) {
          score -= 5;
          flags.push({ id: "rr-bad", tone: "warn", title: `Reward-to-risk only ${rr.toFixed(1)} : 1`, detail: "You're risking about as much as you hope to make. Look for setups closer to 2 : 1.", lesson: "risk-reward" });
        }
      }
    } else {
      score -= 12;
      flags.push({ id: "no-stop", tone: "risk", title: "No stop-loss", detail: "Decide where you're wrong before you get in. Without a stop, a small loss can quietly become a big one.", lesson: "stop-losses" });
    }

    // ---- chasing ----
    if (dayMove > 0.04) {
      score -= 6;
      flags.push({ id: "chase", tone: "warn", title: `Buying after a ${pct(dayMove, 1)} jump today`, detail: "Buying right after a big move is often FOMO. Ask yourself whether you'd still want it at yesterday's price.", lesson: "fomo-and-greed" });
    }

    // ---- averaging down ----
    if (existing && t.price < existing.avgCost * 0.95) {
      score -= 5;
      flags.push({ id: "avg-down", tone: "warn", title: "Averaging down on a losing position", detail: `You already hold ${t.symbol} at ${usd(existing.avgCost)}. Adding to a loser only makes sense if your original thesis is still intact.`, lesson: "loss-aversion" });
    }

    // ---- sector concentration ----
    if (ticker) {
      let sectorValue = notional;
      for (const [sym, p] of Object.entries(ctx.positions)) {
        const v = p.qty * (ctx.prices[sym] ?? p.avgCost);
        if (TICKER_MAP[sym]?.sector === ticker.sector) sectorValue += v;
      }
      const sectorPct = sectorValue / Math.max(1, ctx.equity);
      metrics.sectorPct = sectorPct;
      if (sectorPct > 0.45 && ticker.sector !== "Index ETF") {
        score -= 6;
        flags.push({ id: "sector", tone: "warn", title: `${pct(sectorPct, 0, false)} of your account is in ${ticker.sector}`, detail: "Stocks in one sector tend to fall together. Spreading across sectors smooths the ride.", lesson: "diversification" });
      }
      if (ticker.sector === "Index ETF") {
        score += 4;
        flags.push({ id: "etf", tone: "good", title: "Diversified with one trade", detail: `${t.symbol} holds a whole basket of companies, so your risk from any single stock is low.`, lesson: "index-vs-picking" });
      }
    }
  } else {
    // ---- sells ----
    const pnl = t.realizedPnl ?? 0;
    if (pnl < 0) {
      flags.push({ id: "cut-loss", tone: "good", title: `Took a ${usd(Math.abs(pnl))} loss`, detail: "Cutting a loser is hard. That was the right call if your thesis broke — check whether it did.", lesson: "loss-aversion" });
      score += 4;
    } else if (pnl > 0) {
      flags.push({ id: "win", tone: "good", title: `Locked in ${usd(pnl)}`, detail: "Profit taken. Was this your plan, or did you get nervous? Compare it with your thesis.", lesson: "risk-reward" });
      score += 4;
      if ((t.heldMs ?? Infinity) < 3 * 60_000) {
        score -= 6;
        flags.push({ id: "quick-flip", tone: "warn", title: "Very short hold", detail: "Selling within minutes for a small gain can turn into overtrading. Fine if it was the plan.", lesson: "overtrading" });
      }
    }
  }

  // ---- overtrading ----
  if (ctx.recentTradeCount >= 5) {
    score -= 8;
    flags.push({ id: "overtrade", tone: "risk", title: `${ctx.recentTradeCount} trades in 10 minutes`, detail: "Fast-fire trading is usually emotion, not strategy. Step back and check your plan.", lesson: "overtrading" });
  }

  return { score: Math.max(5, Math.min(100, Math.round(score))), flags, metrics };
}

export function scoreLabel(score: number) {
  if (score >= 85) return "Disciplined";
  if (score >= 70) return "Solid";
  if (score >= 50) return "Needs work";
  return "High risk";
}
