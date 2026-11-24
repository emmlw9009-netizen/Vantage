// Used when no Claude credentials are configured, so the app still coaches.
import type { CoachReview, Trade } from "@/store/app";
import { LESSON_MAP } from "./course";

function headlineFor(t: Trade): string {
  const what = `${t.symbol} ${t.side === "buy" ? "entry" : "exit"}`;
  if (t.score >= 85) return `Your ${what} went to plan`;
  if (t.score >= 70) return `A solid ${what}, with one thing to tighten`;
  if (t.score >= 50) return `Your ${what} needs one habit fixed`;
  return `Your ${what} took on too much risk`;
}

export function rulesReview(t: Trade): CoachReview {
  const bad = t.flags.filter((f) => f.tone !== "good");
  const worst = bad.find((f) => f.tone === "risk") ?? bad[0];
  const lesson = worst?.lesson ? LESSON_MAP[worst.lesson] : undefined;
  return {
    headline: headlineFor(t),
    summary: worst
      ? `${worst.title}. ${worst.detail}`
      : "Clean process. You sized sensibly, defined your risk and wrote down your reasoning. Keep repeating this.",
    // the flag list renders right below, so the rules review stays short
    didWell: [],
    improve: [],
    nextStep: lesson ? `Review the “${lesson.title}” lesson before your next trade.` : "Repeat this process on your next trade and compare the results in your journal.",
    source: "rules",
  };
}

const TOPICS: { match: RegExp; answer: string }[] = [
  { match: /size|how (much|many)|position/i, answer: "Size from your stop, not your gut: **shares = (account × 1%) ÷ (entry − stop)**. On a $100k account with a $5 stop distance, that's 200 shares. The order ticket shows your account risk live as you type. More here: [Position sizing](/learn/position-sizing)." },
  { match: /stop|loss/i, answer: "Put your stop where your idea is clearly wrong: just below support or a key moving average, not at a random round number. Volatile stocks need wider stops and smaller size. Never move a stop further away to dodge a loss. See [Stop-losses](/learn/stop-losses)." },
  { match: /p\/?e|valuation|expensive|cheap/i, answer: "P/E = price ÷ yearly earnings. A high P/E means the market expects fast growth, and it's only expensive if that growth doesn't show up. Compare P/Es within an industry. See [Valuation](/learn/valuation-pe)." },
  { match: /etf|index|spy|qqq/i, answer: "Index ETFs like SPY give you the whole market in one trade. Most pros fail to beat the index over time, so a common approach is a core of index funds plus a small satellite of your own picks. See [Index vs. picking](/learn/index-vs-picking)." },
  { match: /fomo|chase|jump|miss/i, answer: "That urge to jump in after a big move is FOMO, and it tends to peak near short-term tops. Missing a trade costs $0. Write the plan first; if the price has already left your entry zone, let it go. See [FOMO & greed](/learn/fomo-and-greed)." },
  { match: /earn|eps|report/i, answer: "Stocks react to earnings *versus expectations*, and to guidance about the next quarter. Holding a big position into earnings is a coin flip, so size down. See [Earnings & EPS](/learn/earnings-and-eps)." },
];

/**
 * The built-in playbook answer. User-facing only: no setup text, no debug context.
 * `context` is accepted for signature compatibility with the AI path; the playbook doesn't need it.
 */
export function offlineAnswer(question: string, context = ""): string {
  void context;
  const hit = TOPICS.find((t) => t.match.test(question));
  return (
    hit?.answer ??
    "Here's the core playbook: **risk 1–2% of your account per trade**, **set a stop before you buy**, **aim for at least 2 : 1 reward to risk**, **spread across sectors** and **write down why you're buying**. Tell me which one you want to dig into, or open your latest trade review on Home."
  );
}
