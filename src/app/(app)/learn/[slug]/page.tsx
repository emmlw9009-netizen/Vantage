"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ALL_LESSONS, LESSON_MAP, MISSIONS, moduleOf } from "@/lib/course";
import { useApp } from "@/store/app";
import { useToast } from "@/store/toast";
import { cn } from "@/lib/format";
import { CheckCell, MarkGlyph } from "@/components/marks";
import { track } from "@/lib/track";
import { LessonWidget } from "@/components/lesson-widgets";

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
      <div className="max-w-xl">
        <h1 className="t-title">Lesson not found</h1>
        <Link href="/learn" className="btn btn-secondary mt-6">
          Back to the course
        </Link>
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
    if (first) track("LessonComplete", { lesson: slug });
    const bonus = score === 1 && (completed?.quiz ?? 0) < 1;
    push({ title: score === 1 ? "Perfect quiz" : "Lesson complete", body: first ? `${50 + (bonus ? 25 : 0)} XP added.` : bonus ? "25 XP quiz bonus added." : "Progress saved.", tone: "good" });
  };

  return (
    <article className="max-w-[760px]">
      <Link href="/learn" className="link -my-3 inline-block py-3 t-small text-ink-2">
        Course
      </Link>
      <span className="t-small text-ink-2"> / {mod.title}</span>

      <header className="mt-4">
        <h1 className="t-title">{lesson.title}</h1>
        <p className="mt-3 t-lead">{lesson.summary}</p>
        <p className="tnum mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 t-small text-ink-2">
          <span>
            Lesson {idx + 1} of {ALL_LESSONS.length}
          </span>
          <span>{lesson.minutes} min</span>
          {completed && (
            <span className="inline-flex items-center gap-1.5 text-ink">
              <MarkGlyph kind="good" size={16} /> Completed
            </span>
          )}
        </p>
      </header>

      <div className="prose-lesson mt-10 space-y-10">
        {lesson.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="t-h2 font-sans">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {lesson.callout && (
        <div className="well mt-8 px-5 py-4">
          <div className="t-small font-semibold">{lesson.callout.title}</div>
          <p className="tnum mt-1 t-wide text-[17px] leading-7">{lesson.callout.body}</p>
        </div>
      )}

      {lesson.widget && <LessonWidget kind={lesson.widget} />}

      <section className="mt-10" aria-labelledby="remember-h">
        <h2 id="remember-h" className="t-h3">
          What to remember
        </h2>
        <ul className="mt-3 border-t border-rule">
          {lesson.keyPoints.map((k) => (
            <li key={k} className="flex gap-3 border-b border-rule py-2.5">
              <MarkGlyph kind="good" className="mt-0.5" />
              <span className="min-w-0">{k}</span>
            </li>
          ))}
        </ul>
        {lesson.sources && lesson.sources.length > 0 && (
          <p className="mt-4 t-small text-ink-2" data-testid="lesson-sources">
            <span className="font-semibold text-ink">Sources:</span>{" "}
            {lesson.sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 && "; "}
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="link">
                  {src.label}
                </a>
              </span>
            ))}
            . General education, not investment advice.
          </p>
        )}
      </section>

      <section className="mt-14" aria-labelledby="quiz-h">
        <div className="sec-head">
          <h2 id="quiz-h" className="t-h2">
            Check your understanding
          </h2>
        </div>
        <div className="mt-6 space-y-8">
          {lesson.quiz.map((q, qi) => (
            <fieldset key={qi} className="min-w-0">
              <legend className="font-medium">
                <span className="tnum mr-2 text-ink-2">{qi + 1}.</span>
                {q.q}
              </legend>
              <div className="mt-3 grid gap-2">
                {q.options.map((o, oi) => {
                  const chosen = answers[qi] === oi;
                  const right = submitted && oi === q.answer;
                  const wrong = submitted && chosen && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      aria-pressed={chosen}
                      onClick={() => setAnswers({ ...answers, [qi]: oi })}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-left t-small transition-colors",
                        chosen && !submitted ? "border-ink" : "border-edge",
                        !submitted && "hover:bg-well",
                        wrong && "border-red",
                        right && "border-pencil",
                      )}
                    >
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-[4px] border t-micro font-semibold", chosen ? "border-ink bg-ink text-on-ink" : "border-edge")}>{String.fromCharCode(65 + oi)}</span>
                      <span className="min-w-0 flex-1 text-[15px] text-ink">{o}</span>
                      {right && (
                        <span className="inline-flex items-center gap-1 t-small text-ink">
                          <MarkGlyph kind="good" size={16} /> Correct
                        </span>
                      )}
                      {wrong && (
                        <span className="inline-flex items-center gap-1 t-small text-red">
                          <MarkGlyph kind="risk" size={16} /> Not quite
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 t-small text-ink-2">
                  <span className="font-semibold text-ink">Why: </span>
                  {q.why}
                </p>
              )}
            </fieldset>
          ))}
        </div>
        <p className="sr-only" role="status">
          {submitted ? `${correct} of ${lesson.quiz.length} correct.` : ""}
        </p>
        {!submitted ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button disabled={!allAnswered} onClick={submit} className="btn btn-primary">
              Check answers
            </button>
            {!allAnswered && <span className="t-small text-ink-2">Answer {lesson.quiz.length === 2 ? "both questions" : "every question"} to check.</span>}
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="tnum font-semibold">
              {correct} of {lesson.quiz.length} correct
            </span>
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="btn btn-quiet"
            >
              Try again
            </button>
          </div>
        )}
      </section>

      {mission && (
        <section className="mt-14 border-y border-rule-strong py-4" aria-labelledby="mission-h">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="mission-h" className="t-h3">
              Practice this in the simulator
            </h2>
            <span className="tnum t-micro text-muted">{mission.xp} XP</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <CheckCell state={missions[mission.id] ? "done" : "todo"} size={28} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{mission.title}</div>
              <div className="t-small text-ink-2">{mission.detail}</div>
            </div>
            {missions[mission.id] ? (
              <span className="t-small font-medium">Done</span>
            ) : (
              <Link href={mission.href} className="btn btn-secondary">
                Try it now
              </Link>
            )}
          </div>
        </section>
      )}

      <nav className="mt-10 flex flex-wrap items-center justify-between gap-3" aria-label="Lesson navigation">
        <Link href={`/coach?lesson=${slug}`} className="btn btn-secondary">
          Ask Nova about this lesson
        </Link>
        <div className="flex gap-2">
          {prev && (
            <Link href={`/learn/${prev.slug}`} className="btn btn-quiet">
              Previous lesson
            </Link>
          )}
          {next && (
            <Link href={`/learn/${next.slug}`} className="btn btn-primary">
              Next lesson
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
