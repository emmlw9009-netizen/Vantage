"use client";

import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, Trophy, Zap } from "lucide-react";
import { COURSE, ALL_LESSONS, MISSIONS, levelFor } from "@/lib/course";
import { useApp } from "@/store/app";
import { cn } from "@/lib/format";
import { SectionTitle } from "@/components/ui";

export default function Learn() {
  const completed = useApp((s) => s.completedLessons);
  const missions = useApp((s) => s.missions);
  const xp = useApp((s) => s.xp);
  const activeDays = useApp((s) => s.activeDays);
  const lvl = levelFor(xp);
  const doneCount = ALL_LESSONS.filter((l) => completed[l.slug]).length;
  const nextSlug = ALL_LESSONS.find((l) => !completed[l.slug])?.slug;

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-accent">The {BRAND.name} course</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">From zero to a real trading plan.</h1>
            <p className="mt-2 max-w-xl text-ink-2">Short lessons, quick quizzes and missions you complete in the simulator. Nova connects every lesson to your own trades.</p>
            {nextSlug && (
              <Link href={`/learn/${nextSlug}`} className="mt-5 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:brightness-95">
                {doneCount ? "Continue learning" : "Start lesson 1"}
              </Link>
            )}
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Lessons", v: `${doneCount}/${ALL_LESSONS.length}` },
              { k: `Level ${lvl.level}`, v: `${xp} XP` },
              { k: "Active days", v: String(activeDays.length) },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
                <dd className="tnum text-xl font-semibold">{x.v}</dd>
                <dt className="text-xs text-muted">{x.k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {COURSE.map((m, mi) => {
            const done = m.lessons.filter((l) => completed[l.slug]).length;
            const prevModuleDone = mi === 0 || COURSE[mi - 1].lessons.some((l) => completed[l.slug]);
            return (
              <section key={m.id} className="card p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted">Module {mi + 1}</div>
                    <h2 className="text-lg font-semibold tracking-tight">{m.title}</h2>
                    <p className="text-sm text-ink-2">{m.description}</p>
                  </div>
                  <span className="tnum shrink-0 rounded-full bg-panel-2 px-2.5 py-1 text-xs font-medium">{done}/{m.lessons.length}</span>
                </div>
                <ol className="space-y-2">
                  {m.lessons.map((l, li) => {
                    const isDone = !!completed[l.slug];
                    const isNext = l.slug === nextSlug;
                    return (
                      <li key={l.slug}>
                        <Link
                          href={`/learn/${l.slug}`}
                          className={cn("flex items-center gap-3 rounded-2xl border p-3 transition hover:bg-panel-2", isNext ? "border-transparent ring-2 ring-accent" : "border-line", !prevModuleDone && !isDone && "opacity-70")}
                        >
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold", isDone ? "bg-good-bg text-up" : "bg-panel-2 text-ink-2")}>
                            {isDone ? <CheckCircle2 className="size-5" aria-label="Completed" /> : li + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{l.title}</span>
                            <span className="block truncate text-sm text-muted">{l.summary}</span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex"><Clock className="size-3.5" />{l.minutes}m</span>
                          {isDone && completed[l.slug].quiz === 1 && <Trophy className="size-4 shrink-0 text-warn" aria-label="Perfect quiz" />}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4">
          <section className="card p-5 lg:sticky lg:top-20">
            <SectionTitle title="Missions" action={<span className="flex items-center gap-1 text-xs text-muted"><Zap className="size-3.5" />Earn XP in the simulator</span>} />
            <ul className="space-y-3">
              {Object.values(MISSIONS).map((m) => (
                <li key={m.id}>
                  <Link href={m.href} className="flex gap-3">
                    {missions[m.id] ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" aria-label="Done" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted" aria-label="Not done" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", !!missions[m.id] && "text-muted line-through")}>{m.title}</span>
                      <span className="block text-xs text-muted">{m.detail}</span>
                    </span>
                    <span className="tnum text-xs font-semibold text-accent">+{m.xp}</span>
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
