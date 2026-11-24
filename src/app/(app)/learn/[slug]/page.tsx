"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, MessageCircle, Target, XCircle } from "lucide-react";
import { ALL_LESSONS, LESSON_MAP, MISSIONS, moduleOf } from "@/lib/course";
import { useApp } from "@/store/app";
import { useToast } from "@/store/toast";
import { cn } from "@/lib/format";

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = LESSON_MAP[slug];
  const mod = moduleOf(slug);
  const completeLesson = useApp((s) => s.completeLesson);
  const completed = useApp((s) => s.completedLessons[slug]);
  const missions = useApp((s) => s.missions);
  const push = useToast((s) => s.push);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!lesson || !mod)
    return (
      <div className="card p-8 text-center">
        Lesson not found. <Link href="/learn" className="text-series-1 hover:underline">Back to the course</Link>
      </div>
    );

  const idx = ALL_LESSONS.findIndex((l) => l.slug === slug);
  const next = ALL_LESSONS[idx + 1];
  const prev = ALL_LESSONS[idx - 1];
  const correct = lesson.quiz.filter((q, i) => answers[i] === q.answer).length;
  const allAnswered = Object.keys(answers).length === lesson.quiz.length;
  const mission = lesson.mission ? MISSIONS[lesson.mission] : undefined;

  const submit = () => {
    setSubmitted(true);
    const score = correct / lesson.quiz.length;
    const first = !completed;
    completeLesson(slug, score);
    push({ title: score === 1 ? "Perfect score! 🎯" : "Lesson complete", body: `${first ? "+50 XP" : "Progress saved"}${score === 1 && (completed?.quiz ?? 0) < 1 ? " · +25 XP quiz bonus" : ""}`, tone: "good" });
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> {mod.title}
      </Link>

      <header>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>Lesson {idx + 1} of {ALL_LESSONS.length}</span>
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{lesson.minutes} min</span>
          {completed && <span className="flex items-center gap-1 text-up"><CheckCircle2 className="size-3.5" />Completed</span>}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-lg text-ink-2">{lesson.summary}</p>
      </header>

      <div className="card space-y-8 p-6 sm:p-8">
        {lesson.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 leading-7 text-ink-2">{p}</p>
            ))}
          </section>
        ))}
        {lesson.callout && (
          <div className="flex gap-3 rounded-2xl bg-accent-soft p-4">
            <Lightbulb className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-semibold">{lesson.callout.title}</div>
              <p className="mt-0.5 text-sm text-ink-2">{lesson.callout.body}</p>
            </div>
          </div>
        )}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Key takeaways</h2>
          <ul className="mt-3 space-y-2">
            {lesson.keyPoints.map((k) => (
              <li key={k} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" />{k}</li>
            ))}
          </ul>
        </section>
        {lesson.sources && lesson.sources.length > 0 && (
          <p className="border-t border-line pt-4 text-sm text-ink-2" data-testid="lesson-sources">
            <span className="font-semibold">Sources:</span>{" "}
            {lesson.sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 && "; "}
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-series-1 underline underline-offset-2">{src.label}</a>
              </span>
            ))}
            . General education, not investment advice.
          </p>
        )}
      </div>

      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Check your understanding</h2>
        <div className="mt-5 space-y-6">
          {lesson.quiz.map((q, qi) => (
            <fieldset key={qi}>
              <legend className="font-medium">{qi + 1}. {q.q}</legend>
              <div className="mt-3 grid gap-2">
                {q.options.map((o, oi) => {
                  const chosen = answers[qi] === oi;
                  const right = submitted && oi === q.answer;
                  const wrong = submitted && chosen && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [qi]: oi })}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                        right ? "border-transparent bg-good-bg ring-2 ring-[var(--up)]" : wrong ? "border-transparent bg-risk-bg ring-2 ring-[var(--down)]" : chosen ? "border-transparent bg-accent-soft ring-2 ring-accent" : "border-line hover:bg-panel-2",
                      )}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-xs font-semibold">{String.fromCharCode(65 + oi)}</span>
                      <span className="flex-1">{o}</span>
                      {right && <CheckCircle2 className="size-4 text-up" aria-label="Correct" />}
                      {wrong && <XCircle className="size-4 text-down" aria-label="Incorrect" />}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-2 text-sm text-ink-2"><span className="font-semibold">Why: </span>{q.why}</p>}
            </fieldset>
          ))}
        </div>
        {!submitted ? (
          <button disabled={!allAnswered} onClick={submit} className="mt-6 h-11 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition enabled:hover:brightness-95 disabled:opacity-40">
            Check answers
          </button>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="tnum font-semibold">{correct}/{lesson.quiz.length} correct</span>
            <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="text-sm text-muted hover:text-ink">Retry</button>
          </div>
        )}
      </section>

      {mission && (
        <section className="card flex flex-wrap items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-ink"><Target className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Practice mission · +{mission.xp} XP</div>
            <div className="font-semibold">{mission.title}</div>
            <div className="text-sm text-ink-2">{mission.detail}</div>
          </div>
          {missions[mission.id] ? (
            <span className="flex items-center gap-1 text-sm font-medium text-up"><CheckCircle2 className="size-4" />Done</span>
          ) : (
            <Link href={mission.href} className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-bg">Do it now</Link>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/coach?lesson=${slug}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:bg-panel-2">
          <MessageCircle className="size-4" /> Ask Nova about this lesson
        </Link>
        <div className="flex gap-2">
          {prev && <Link href={`/learn/${prev.slug}`} className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-sm hover:bg-panel-2"><ArrowLeft className="size-4" />Previous</Link>}
          {next && <Link href={`/learn/${next.slug}`} className="inline-flex h-10 items-center gap-1 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink hover:brightness-95">Next lesson<ArrowRight className="size-4" /></Link>}
        </div>
      </div>
    </article>
  );
}
