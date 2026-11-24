"use client";

import Link from "next/link";
import { COURSE, ALL_LESSONS, MISSIONS, levelFor } from "@/lib/course";
import { useApp } from "@/store/app";
import { cn } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import { CheckCell } from "@/components/marks";

export default function Learn() {
  const completed = useApp((s) => s.completedLessons);
  const missions = useApp((s) => s.missions);
  const xp = useApp((s) => s.xp);
  const activeDays = useApp((s) => s.activeDays);
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

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {COURSE.map((m, mi) => {
            const done = m.lessons.filter((l) => completed[l.slug]).length;
            return (
              <section key={m.id} aria-labelledby={`mod-${m.id}`} className="min-w-0">
                <div className="sec-head">
                  <h2 id={`mod-${m.id}`} className="t-h2 min-w-0">
                    <span className="tnum mr-3 text-ink-2">{mi + 1}</span>
                    {m.title}
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
                    return (
                      <li key={l.slug}>
                        <Link href={`/learn/${l.slug}`} className={cn("grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-rule py-3 hover:bg-well", isNext && "-ml-3 border-l-2 border-l-ink pl-[10px]")}>
                          <CheckCell state={isDone ? "done" : "todo"} size={26} className="-mt-0.5" />
                          <span className="min-w-0">
                            <span className="sr-only">{isDone ? "Done:" : "To do:"} </span>
                            <span className="block font-medium">
                              {l.title}
                              {isNext && <span className="tag ml-2 align-[2px]">Up next</span>}
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

        <aside className="min-w-0">
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
