// Elite: a personal learning plan. An ordered list of lessons and missions built from the user's most frequent mistakes,
// computed locally from the same numbers as the journal (journalStats), never a second copy of that logic.
import type { Trade } from "@/store/app";
import { LESSON_MAP, MISSIONS, type MissionId } from "./course";
import { journalStats } from "./journal-stats";

export interface PlanStep {
  kind: "lesson" | "mission";
  id: string;
  title: string;
  href: string;
  done: boolean;
  /** Why this step is in the plan, in plain words with the numbers. */
  why: string;
}

export interface LearningPlan {
  /** Nova's one-line note at the top of the plan. */
  note: string;
  steps: PlanStep[];
  /** True when the plan comes from the user's own trades (false: the starter plan for someone with no mistakes yet). */
  personal: boolean;
}

const MAX_STEPS = 6;
/** The starter plan, in course order: the risk habits every later lesson builds on. */
const STARTER: { lesson: string; why: string }[] = [
  { lesson: "position-sizing", why: "Sizing from your stop keeps any one loss small." },
  { lesson: "stop-losses", why: "A stop decides where you're wrong before you buy." },
  { lesson: "risk-reward", why: "A target at least twice the risk lets you be wrong more often than right." },
];

export function learningPlan(trades: Trade[], completedLessons: Record<string, unknown>, missions: Record<string, unknown>): LearningPlan {
  const st = journalStats(trades);
  const steps: PlanStep[] = [];
  const seen = new Set<string>();
  const add = (s: PlanStep) => {
    const key = `${s.kind}:${s.id}`;
    if (seen.has(key) || steps.length >= MAX_STEPS) return;
    seen.add(key);
    steps.push(s);
  };
  const addLesson = (slug: string, why: string) => {
    const l = LESSON_MAP[slug];
    if (!l) return;
    add({ kind: "lesson", id: slug, title: l.title, href: `/learn/${slug}`, done: !!completedLessons[slug], why });
    const mid = l.mission as MissionId | undefined;
    const m = mid ? MISSIONS[mid] : undefined;
    if (m) add({ kind: "mission", id: m.id, title: m.title, href: m.href, done: !!missions[m.id], why: m.detail });
  };

  for (const m of st.mistakes) if (m.lesson) addLesson(m.lesson, `${m.name} in ${m.n} of your ${st.total} trades.`);

  if (steps.length) {
    // the note names the same mistake that put the first open step first, so the two never disagree
    const first = steps.find((s) => !s.done) ?? steps[0];
    const top = st.mistakes.find((m) => m.lesson && (first.kind === "lesson" ? m.lesson === first.id : LESSON_MAP[m.lesson]?.mission === first.id)) ?? st.mistakes[0];
    return { note: `${top.name} showed up in ${top.n} of your ${st.total} trades. Start with ${first.kind === "lesson" ? "the lesson" : "the mission"} ${first.title}.`, steps, personal: true };
  }

  for (const s of STARTER) addLesson(s.lesson, s.why);
  if (!trades.length) add({ kind: "mission", id: "first-trade", title: MISSIONS["first-trade"].title, href: MISSIONS["first-trade"].href, done: !!missions["first-trade"], why: MISSIONS["first-trade"].detail });
  return {
    note: trades.length ? "No repeated mistakes yet. Keep these habits, and this plan will follow whatever you slip on next." : "Place a few trades and this plan will follow the mistakes you make most. Until then, start with the risk lessons.",
    steps,
    personal: false,
  };
}
