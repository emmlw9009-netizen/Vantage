"use client";

import Link from "next/link";
import { COURSE, ALL_LESSONS, MISSIONS, levelFor } from "@/lib/course";
import { useMemo } from "react";
import { useApp, usePlan } from "@/store/app";
import { cn } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import { CheckCell, NovaByline } from "@/components/marks";
import { can, canOpenLesson, isFreeModule } from "@/lib/plans";
import { learningPlan } from "@/lib/learning-plan";
import { Paywall, PlanTag } from "@/components/paywall";

/** Elite: lessons and missions ordered by the user's most frequent mistakes (lib/learning-plan.ts). */
function LearningPlanSection({ className }: { className?: string }) {
  const plan = usePlan();
  const trades = useApp((s) => s.trades);
  const completed = useApp((s) => s.completedLessons);
  const missions = useApp((s) => s.missions);
  const lp = useMemo(() => learningPlan(trades, completed, missions), [trades, completed, missions]);
  if (!can(plan, "learning-plan"))
    return (
      <div className={className}>
        <Paywall gate="learning-plan" compact as="h2" />
      </div>
    );
  const done = lp.steps.filter((x) => x.done).length;
  return (
    <section aria-labelledby="plan-h" className={className} data-testid="learning-plan">
      <SectionTitle id="plan-h" title="Your plan" action={<span className="tnum t-small text-ink-2">{done} of {lp.steps.length}</span>} />
      <div className="nova-note">
        <NovaByline />
        <p className="t-note mt-1">{lp.note}</p>
        <p className="mt-1 t-micro text-ink-2">Checked with the built-in playbook{lp.personal ? ", from your trades in this browser" : ""}.</p>
      </div>
      <ol className="mt-3 border-t border-rule">
        {lp.steps.map((x) => (
          <li key={`${x.kind}-${x.id}`}>
            <Link href={x.href} className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3 border-b border-rule py-2.5 hover:bg-well">
              <CheckCell state={x.done ? "done" : "todo"} size={24} />
              <span className="min-w-0">
                <span className="sr-only">{x.done ? "Done:" : "To do:"} </span>
                <span className={cn("block t-small font-medium", x.done && "text-ink-2")}>
                  {x.kind === "lesson" ? "Lesson: " : "Mission: "}
                  {x.title}
                </span>
                <span className="block t-micro text-ink-2">{x.why}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Learn() {
  const completed = useApp((s) => s.completedLessons);
  const missions = useApp((s) => s.missions);
  const xp = useApp((s) => s.xp);
  const activeDays = useApp((s) => s.activeDays);
  const plan = usePlan();
  const lvl = levelFor(xp);
  const doneCount = ALL_LESSONS.filter((l) => completed[l.slug]).length;
  const next = ALL_LESSONS.find((l) => !completed[l.slug]);
  const missionList = Object.values(MISSIONS);
  const missionsDone = missionList.filter((m) => missions[m.id]).length;

  return (
    <div>
      <h1 className="t-title">Course</h1>
      <p className="mt-2 max-w-[72ch] t-lead">{ALL_LESSONS.length} short lessons. Each one ends with something to try in the simulator, and Nova links your mistakes to the lesson that fixes them.</p>
      <p className="tnum mt-4 t-small text-ink-2">
        {doneCount} of {ALL_LESSONS.length} lessons done. {xp} XP. Level {lvl.level}, {lvl.name}. Active {activeDays.length} {activeDays.length === 1 ? "day" : "days"}.
      </p>
      {next && (
        <Link href={`/learn/${next.slug}`} className="btn btn-primary mt-5">
          {doneCount ? `Continue: ${next.title}` : "Start the first lesson"}
        </Link>
      )}

      {/* Phone: plan, course map, missions. Desktop: the map on the left; the plan and missions in the right margin. */}
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr]">
        <LearningPlanSection className="min-w-0 lg:col-start-2 lg:row-start-1" />
        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {COURSE.map((m, mi) => {
            const done = m.lessons.filter((l) => completed[l.slug]).length;
            return (
              <section key={m.id} aria-labelledby={`mod-${m.id}`} className="min-w-0">
                <div className="sec-head">
                  <h2 id={`mod-${m.id}`} className="t-h2 min-w-0">
                    <span className="tnum mr-3 text-ink-2">{mi + 1}</span>
                    {m.title}
                    {!isFreeModule(mi) && !can(plan, "all-lessons") && <PlanTag feature="all-lessons" className="ml-3 align-[4px]" />}
                  </h2>
                  <span className="tnum shrink-0 t-small text-ink-2">
                    {done} of {m.lessons.length}
                  </span>
                </div>
                <p className="mt-2 t-small text-ink-2">{m.description}</p>
                <ol className="mt-3 border-t border-rule">
                  {m.lessons.map((l) => {
                    const isDone = !!completed[l.slug];
                    const isNext = l.slug === next?.slug;
                    const locked = !canOpenLesson(plan, l.slug);
                    return (
                      <li key={l.slug}>
                        <Link href={`/learn/${l.slug}`} className={cn("grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-rule py-3 hover:bg-well", isNext && "-ml-3 border-l-2 border-l-ink pl-[10px]")}>
                          <CheckCell state={isDone ? "done" : "todo"} size={26} className="-mt-0.5" />
                          <span className="min-w-0">
                            <span className="sr-only">{isDone ? "Done:" : "To do:"} </span>
                            <span className="block font-medium">
                              {l.title}
                              {isNext && <span className="tag ml-2 align-[2px]">Up next</span>}
                              {locked && (
                                <>
                                  <span className="sr-only">. Part of Premium, opens a preview.</span>
                                  <PlanTag feature="all-lessons" className="ml-2 align-[2px]" />
                                </>
                              )}
                            </span>
                            <span className="block t-small text-ink-2">{l.summary}</span>
                          </span>
                          <span className="tnum pt-0.5 t-micro text-muted">
                            {l.minutes} min
                            {isDone && completed[l.slug].quiz === 1 && <span className="block text-ink-2">Perfect quiz</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className="min-w-0 lg:col-start-2 lg:row-start-2">
          <section aria-labelledby="missions-h" className="lg:sticky lg:top-[80px]">
            <SectionTitle id="missions-h" title="Missions" action={<span className="tnum t-small text-ink-2">{missionsDone} of {missionList.length}</span>} />
            <p className="t-small text-ink-2">Practice in the simulator. Nova ticks these off when your trades show the habit.</p>
            <ul className="mt-3 border-t border-rule">
              {missionList.map((mi) => (
                <li key={mi.id}>
                  <Link href={mi.href} className="grid grid-cols-[26px_minmax(0,1fr)_auto] gap-x-3 border-b border-rule py-2.5 hover:bg-well">
                    <CheckCell state={missions[mi.id] ? "done" : "todo"} size={24} />
                    <span className="min-w-0">
                      <span className="sr-only">{missions[mi.id] ? "Done:" : "To do:"} </span>
                      <span className={cn("block t-small font-medium", !!missions[mi.id] && "text-ink-2")}>{mi.title}</span>
                      <span className="block t-micro text-ink-2">{mi.detail}</span>
                    </span>
                    <span className="tnum t-micro text-muted">{mi.xp} XP</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
