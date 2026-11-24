// Demo community content. Replace with a real backend (see README → "Going multi-user").
import type { Post } from "@/store/app";

export interface Member {
  id: string;
  name: string;
  handle: string;
  level: string;
  returnPct: number;
  winRate: number;
  disciplineScore: number;
  hue: number;
  badge?: string;
  bio: string;
}

export const MEMBERS: Member[] = [
  { id: "u1", name: "Maya Chen", handle: "mayatrades", level: "Strategist", returnPct: 0.142, winRate: 0.58, disciplineScore: 91, hue: 200, badge: "Risk Ranger", bio: "Swing trader. 1% risk, always." },
  { id: "u2", name: "Jordan Ellis", handle: "jordan_e", level: "Trader", returnPct: 0.087, winRate: 0.49, disciplineScore: 84, hue: 30, bio: "Learning fundamentals one 10-K at a time." },
  { id: "u3", name: "Priya Nair", handle: "priya.n", level: "Portfolio Pro", returnPct: 0.193, winRate: 0.62, disciplineScore: 88, hue: 330, badge: "Top 1%", bio: "Core SPY + a satellite of healthcare picks." },
  { id: "u4", name: "Sam Okafor", handle: "samokafor", level: "Apprentice", returnPct: -0.034, winRate: 0.41, disciplineScore: 67, hue: 140, bio: "Week 3. Learning stops the hard way." },
  { id: "u5", name: "Lena Brooks", handle: "lenab", level: "Trader", returnPct: 0.061, winRate: 0.55, disciplineScore: 79, hue: 260, bio: "Dividend stocks and patience." },
  { id: "u6", name: "Diego Ramos", handle: "diegor", level: "Strategist", returnPct: 0.118, winRate: 0.47, disciplineScore: 82, hue: 10, badge: "3:1 Club", bio: "Low win rate, big reward-to-risk." },
  { id: "u7", name: "Coach Nova", handle: "nova", level: "AI Coach", returnPct: 0, winRate: 0, disciplineScore: 100, hue: 80, badge: "Coach", bio: "Your AI trading coach. Ask me anything." },
];

export const MEMBER_MAP: Record<string, Member> = Object.fromEntries(MEMBERS.map((m) => [m.id, m]));

const H = 3_600_000;
export const SEED_POSTS: (Post & { seedLikes: number; seedComments: { authorId: string; body: string; ago: number }[] })[] = [
  {
    id: "p1", authorId: "u7", kind: "lesson", at: Date.now() - 1 * H, likes: 0, seedLikes: 214,
    body: "This week's challenge: Risk-Adjusted Week. Place at least 3 trades, each with a stop-loss and a 2 : 1 target. The leaderboard ranks discipline score, not raw P&L. Post your best setup below.",
    seedComments: [{ authorId: "u1", body: "In. Already have a bracket on JNJ.", ago: 0.5 * H }],
  },
  {
    id: "p2", authorId: "u4", kind: "lesson", at: Date.now() - 3 * H, likes: 0, seedLikes: 87, symbol: "TSLA",
    body: "Lesson learned: bought TSLA after a +7% day with no stop and 30% of my account. Down 9% in an hour. Coach gave me a 31. Fair. Rebuilding with 2% risk max from now on.",
    seedComments: [
      { authorId: "u6", body: "Respect for posting this. Everyone has this trade once.", ago: 2.5 * H },
      { authorId: "u7", body: "Great reflection. Next time try sizing from the stop: (account × 1%) ÷ (entry − stop). The ticket does the math for you.", ago: 2.4 * H },
    ],
  },
  {
    id: "p3", authorId: "u3", kind: "idea", at: Date.now() - 5 * H, likes: 0, seedLikes: 132, symbol: "LLY",
    body: "LLY pulled back toward its 50-day average after the run. Thesis: obesity drug demand still outpacing supply. Entry near support, stop 6% below, target +14%. That's about 2.3 : 1.",
    seedComments: [{ authorId: "u2", body: "How are you thinking about the P/E at 60+?", ago: 4 * H }, { authorId: "u3", body: "Expensive, so I sized it at half my usual. Growth has to show up.", ago: 3.8 * H }],
  },
  {
    id: "p4", authorId: "u2", kind: "question", at: Date.now() - 8 * H, likes: 0, seedLikes: 45,
    body: "Beginner question: why does my stock drop the moment I buy it with a market order? Is the sim rigged? 😅",
    seedComments: [{ authorId: "u5", body: "That's the bid/ask spread plus slippage. Lesson 2 in Foundations covers it.", ago: 7.5 * H }],
  },
  {
    id: "p5", authorId: "u6", kind: "win", at: Date.now() - 12 * H, likes: 0, seedLikes: 176, symbol: "AMD",
    body: "Take-profit hit on AMD: +$2,840. Lost 3 of my last 5 trades and I'm still up on the week because of 3 : 1 setups. The math works if you let it.",
    seedComments: [],
  },
  {
    id: "p6", authorId: "u5", kind: "idea", at: Date.now() - 20 * H, likes: 0, seedLikes: 64, symbol: "KO",
    body: "Boring is beautiful: KO at a 2.9% yield with a beta of 0.55. It's my anchor position while I learn swing trading with the rest.",
    seedComments: [],
  },
  {
    id: "p7", authorId: "u1", kind: "lesson", at: Date.now() - 26 * H, likes: 0, seedLikes: 98,
    body: "Journaling tip: write your thesis as \"I expect X because Y; I'm wrong if Z.\" The Z part becomes your stop. Changed everything for me.",
    seedComments: [{ authorId: "u4", body: "Stealing this.", ago: 25 * H }],
  },
];

export const CHALLENGES = [
  { id: "c1", title: "Risk-Adjusted Week", detail: "3+ trades, each with a stop and a 2 : 1 target. Ranked by discipline score.", endsInDays: 4, participants: 1284, xp: 200 },
  { id: "c2", title: "Beat the S&P", detail: "Outperform SPY over 10 trading days with no position above 15%.", endsInDays: 9, participants: 3410, xp: 300 },
  { id: "c3", title: "Diversification Sprint", detail: "Build a 5-sector portfolio and keep max drawdown under 5%.", endsInDays: 2, participants: 742, xp: 150 },
];
