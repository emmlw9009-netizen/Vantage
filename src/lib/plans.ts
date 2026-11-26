/**
 * Membership plans and entitlements. This is the ONLY place plan logic lives: every gate in the app asks `can()` or one
 * of the helpers below, and no page compares plan names itself.
 *
 * Where the plan comes from: `profile.plan` in the app store, written only by `setPlan(plan, source)`. Today the source
 * is "test" (a free preview, because payments are not live). When Stripe arrives (Task 11) a signature-verified webhook
 * sets the plan on the server and the client calls `setPlan(serverPlan, "server")`; nothing in this file changes, and
 * `canPreviewInTestMode()` turns the test-mode switch off.
 *
 * Daily limits are counted from a log of what was used today (see `usedToday`), not from a counter that is reset by a
 * timer: the count is always "entries stamped with today's local date", so it resets at local midnight by itself and two
 * tabs merge their logs by id (store/merge.ts) without losing or double-counting anything.
 */
import { COURSE } from "./course";

export type PlanId = "free" | "premium" | "elite";
export const PLAN_IDS: readonly PlanId[] = ["free", "premium", "elite"];
/** Who set the current plan: a free test-mode preview today, the payment server later. */
export type PlanSource = "test" | "server";

export type Feature =
  | "unlimited-trades"
  | "all-lessons"
  | "lesson-tools"
  | "unlimited-coach"
  | "journal-insights"
  | "ma-overlay"
  | "challenges"
  | "csv-export"
  | "weekly-debrief"
  | "learning-plan"
  | "elite-badge";

/** Payments are not live: plans can only be previewed in test mode. Task 11 derives this from the Stripe configuration. */
export const PAYMENTS_LIVE = false;

export const FREE_TRADES_PER_DAY = 10;
export const FREE_COACH_PER_DAY = 10;
/** Modules 1 and 2 of the course are free. */
export const FREE_MODULES = 2;

export const RENEWAL_TEXT = "Billed monthly. Renews automatically until you cancel. Cancel anytime in Settings.";
export const TEST_MODE_TEXT = "Payments aren't live yet. You can preview this plan in test mode at no charge.";

const RANK: Record<PlanId, number> = { free: 0, premium: 1, elite: 2 };

/** The lowest plan that includes each feature. Premium includes everything in Free; Elite everything in Premium. */
const NEEDS: Record<Feature, PlanId> = {
  "unlimited-trades": "premium",
  "all-lessons": "premium",
  "lesson-tools": "premium",
  "unlimited-coach": "premium",
  "journal-insights": "premium",
  "ma-overlay": "premium",
  challenges: "premium",
  "csv-export": "premium",
  "weekly-debrief": "elite",
  "learning-plan": "elite",
  "elite-badge": "elite",
};

/** Anything that is not a known plan (missing, tampered, from an older build) is Free. */
export function planOf(x: unknown): PlanId {
  return x === "premium" || x === "elite" ? x : "free";
}

export function can(plan: unknown, feature: Feature): boolean {
  return RANK[planOf(plan)] >= RANK[NEEDS[feature]];
}

/** The plan a locked feature needs, for the paywall's tag and copy. */
export function requiredPlan(feature: Feature): PlanId {
  return NEEDS[feature];
}

export interface Plan {
  id: PlanId;
  name: string;
  /** US dollars per month. */
  price: number;
  tagline: string;
  /** Plain words, only features that exist today. */
  features: string[];
  /** One sentence for paywalls: what choosing this plan adds. */
  summary: string;
  popular?: boolean;
}

const FREE_LESSONS = COURSE.slice(0, FREE_MODULES).reduce((n, m) => n + m.lessons.length, 0);
const ALL_LESSON_COUNT = COURSE.reduce((n, m) => n + m.lessons.length, 0);

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Learn the basics and practice every day.",
    features: [
      `The simulator and every order type, ${FREE_TRADES_PER_DAY} trades a day`,
      `Lessons in modules 1 and 2 (${FREE_LESSONS} lessons)`,
      "A coach review of every trade",
      `${FREE_COACH_PER_DAY} messages to Nova a day`,
      "The community: read, post and comment",
      "Journal numbers and your full trade history",
    ],
    summary: "Free includes the simulator, the first two modules and a coach review of every trade.",
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 30,
    tagline: "Practice without daily limits.",
    popular: true,
    features: [
      "Unlimited trades",
      `All ${ALL_LESSON_COUNT} lessons in the app, with quizzes, missions and the interactive tools`,
      "Unlimited messages to Nova",
      "Journal: most common mistakes and the patterns Nova sees",
      "The 50-day average on price charts",
      "Join the weekly challenges",
      "Export your trades as a CSV file",
    ],
    summary: `Premium includes unlimited trades and coach messages, all ${ALL_LESSON_COUNT} lessons, the interactive tools and the journal's pattern analysis.`,
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 60,
    tagline: "A weekly review and a plan made from your own trades.",
    features: ["Everything in Premium", "A weekly debrief of your last 7 days", "A personal learning plan built from your most frequent mistakes", "The Elite badge on your posts and leaderboard row"],
    summary: "Elite includes everything in Premium, plus a weekly debrief of your trades and a personal learning plan built from your most frequent mistakes.",
  },
};

/** One row of the comparison ledger. `true` is included, `false` is not, a string is the amount. */
export interface ComparisonRow {
  label: string;
  note?: string;
  values: Record<PlanId, string | boolean>;
}

export const COMPARISON: { group: string; rows: ComparisonRow[] }[] = [
  {
    group: "Trading",
    rows: [
      { label: "Simulator and every order type", values: { free: true, premium: true, elite: true } },
      { label: "Trades per day", note: "Selling to close a position and automatic stop-loss and take-profit exits always work.", values: { free: String(FREE_TRADES_PER_DAY), premium: "Unlimited", elite: "Unlimited" } },
      { label: "A coach review of every trade", values: { free: true, premium: true, elite: true } },
      { label: "50-day average on price charts", values: { free: false, premium: true, elite: true } },
    ],
  },
  {
    group: "Learning",
    rows: [
      { label: "Lessons in the app, with quizzes and missions", note: "Every lesson's text is also free to read on our public lessons pages.", values: { free: `Modules 1 and 2 (${FREE_LESSONS})`, premium: `All ${ALL_LESSON_COUNT}`, elite: `All ${ALL_LESSON_COUNT}` } },
      { label: "Interactive tools in lessons", note: "The position size and reward to risk calculators are also free on our website.", values: { free: false, premium: true, elite: true } },
      { label: "Personal learning plan", values: { free: false, premium: false, elite: true } },
    ],
  },
  {
    group: "Coach",
    rows: [{ label: "Messages to Nova per day", values: { free: String(FREE_COACH_PER_DAY), premium: "Unlimited", elite: "Unlimited" } }],
  },
  {
    group: "Journal",
    rows: [
      { label: "Your numbers and trade history", values: { free: true, premium: true, elite: true } },
      { label: "Most common mistakes and patterns", values: { free: false, premium: true, elite: true } },
      { label: "Export trades as a CSV file", values: { free: false, premium: true, elite: true } },
      { label: "Weekly debrief", values: { free: false, premium: false, elite: true } },
    ],
  },
  {
    group: "Community",
    rows: [
      { label: "Read, post and comment", values: { free: true, premium: true, elite: true } },
      { label: "Join the weekly challenges", note: "Sample challenges until accounts launch.", values: { free: false, premium: true, elite: true } },
      { label: "Elite badge", note: "Shown in this browser until accounts launch.", values: { free: false, premium: false, elite: true } },
    ],
  },
];

/* ---------------- lessons ---------------- */

/** Lessons in the first FREE_MODULES modules are free; the rest need all-lessons. Unknown slugs are not locked (the page shows "not found"). */
export function canOpenLesson(plan: unknown, slug: string): boolean {
  const mi = COURSE.findIndex((m) => m.lessons.some((l) => l.slug === slug));
  return mi < 0 || mi < FREE_MODULES || can(plan, "all-lessons");
}

export function isFreeModule(moduleIndex: number): boolean {
  return moduleIndex < FREE_MODULES;
}

/* ---------------- daily limits ---------------- */

export interface UsageStamp {
  id: string;
  at: number;
}

/** Local calendar day, so limits reset at midnight where the user is. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function usedToday(log: readonly UsageStamp[] | undefined, now = Date.now()): number {
  if (!Array.isArray(log)) return 0;
  const today = dayKey(now);
  return log.filter((s) => s && Number.isFinite(s.at) && dayKey(s.at) === today).length;
}

/** Keeps only today's stamps (yesterday's no longer count) and adds a new one. */
export function stampToday(log: readonly UsageStamp[] | undefined, id: string, now = Date.now()): UsageStamp[] {
  const today = dayKey(now);
  return [...(Array.isArray(log) ? log : []).filter((s) => s && Number.isFinite(s.at) && dayKey(s.at) === today), { id, at: now }];
}

/** Trades left today on Free, or null when the plan has no limit. Never negative (sells at the limit still count). */
export function tradesLeft(plan: unknown, log: readonly UsageStamp[] | undefined, now = Date.now()): number | null {
  if (can(plan, "unlimited-trades")) return null;
  return Math.max(0, FREE_TRADES_PER_DAY - usedToday(log, now));
}

export function coachLeft(plan: unknown, log: readonly UsageStamp[] | undefined, now = Date.now()): number | null {
  if (can(plan, "unlimited-coach")) return null;
  return Math.max(0, FREE_COACH_PER_DAY - usedToday(log, now));
}

/**
 * The owner's daily trade rule. Every order the user places (market, limit or stop, buy or sell) counts. On Free, once 10
 * have been placed today, new buys (market or limit entries) are blocked. Selling to close or reduce a position is always
 * allowed, and still counts, so nobody is trapped in a position. Automatic bracket exits never come through here: they
 * are filled by the market clock, never count and always execute.
 */
export function orderGate(plan: unknown, side: "buy" | "sell", used: number): { allowed: boolean; counts: true } {
  if (side === "sell" || can(plan, "unlimited-trades")) return { allowed: true, counts: true };
  return { allowed: used < FREE_TRADES_PER_DAY, counts: true };
}

/** True when a Free user cannot place a new buy right now (the ticket shows the paywall instead of Buy). */
export function buysBlocked(plan: unknown, log: readonly UsageStamp[] | undefined, now = Date.now()): boolean {
  return !orderGate(plan, "buy", usedToday(log, now)).allowed;
}

export function coachGate(plan: unknown, used: number): { allowed: boolean } {
  return { allowed: can(plan, "unlimited-coach") || used < FREE_COACH_PER_DAY };
}

/* ---------------- plan changes ---------------- */

/** The free test-mode switch exists only while payments are not live, and never overrides a plan the server set. */
export function canPreviewInTestMode(source?: PlanSource): boolean {
  return !PAYMENTS_LIVE && source !== "server";
}

export function priceLabel(plan: PlanId): string {
  return PLANS[plan].price === 0 ? "$0" : `$${PLANS[plan].price}`;
}
