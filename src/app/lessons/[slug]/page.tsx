import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { ALL_LESSONS, LESSON_MAP, moduleOf } from "@/lib/course";
import { abs } from "@/lib/site";
import { MarkGlyph } from "@/components/marks";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";
import { PositionSizeWidget, RewardRiskWidget, TrendSpotterWidget } from "@/components/lesson-widgets";

export const dynamicParams = false;
export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ slug: l.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = LESSON_MAP[slug];
  if (!l) return {};
  const title = `${l.title} | ${BRAND.name} lessons`;
  const description = `${l.summary} A ${l.minutes}-minute lesson with key takeaways. Educational only, not investment advice.`;
  return {
    title,
    description,
    alternates: { canonical: `/lessons/${slug}` },
    openGraph: { type: "article", title, description, url: `/lessons/${slug}`, images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: `${BRAND.name}: ${BRAND.tagline}` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
  };
}

export default async function PublicLesson({ params }: Props) {
  const { slug } = await params;
  const lesson = LESSON_MAP[slug];
  const mod = moduleOf(slug);
  if (!lesson || !mod) notFound();
  const idx = ALL_LESSONS.findIndex((l) => l.slug === slug);
  const next = ALL_LESSONS[idx + 1];
  const prev = ALL_LESSONS[idx - 1];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url: abs(`/lessons/${slug}`),
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: "Beginner",
    learningResourceType: "Lesson",
    teaches: lesson.keyPoints,
    timeRequired: `PT${lesson.minutes}M`,
    isPartOf: { "@type": "Course", name: `${BRAND.name} course: ${mod.title}`, url: abs("/lessons") },
    publisher: { "@type": "Organization", name: BRAND.name, url: abs("/") },
  };

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main id="main" className="mx-auto max-w-[1264px] px-4 pb-20 pt-8 lg:px-8 lg:pt-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,760px)_minmax(0,1fr)]">
          <article className="min-w-0">
            <nav aria-label="Breadcrumb" className="t-small text-ink-2">
              <Link href="/lessons" className="link -my-3 inline-block py-3">
                Lessons
              </Link>
              <span> / {mod.title}</span>
            </nav>
            <header className="mt-4">
              <h1 className="t-title">{lesson.title}</h1>
              <p className="mt-3 t-lead">{lesson.summary}</p>
              <p className="tnum mt-3 flex flex-wrap gap-x-4 gap-y-1 t-small text-ink-2">
                <span>
                  Lesson {idx + 1} of {ALL_LESSONS.length}
                </span>
                <span>{lesson.minutes} min</span>
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

            {lesson.widget === "position-size" && <PositionSizeWidget />}
            {lesson.widget === "reward-risk" && <RewardRiskWidget />}
            {lesson.widget === "trend-spotter" && <TrendSpotterWidget />}

            <section className="mt-10" aria-labelledby="remember-h">
              <h2 id="remember-h" className="t-h3">
                Key takeaways
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
                <p className="mt-4 t-small text-ink-2">
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

            <nav aria-label="More lessons" className="mt-14 grid grid-cols-1 gap-x-8 border-t border-rule-strong sm:grid-cols-2">
              {prev ? (
                <Link href={`/lessons/${prev.slug}`} className="block min-h-11 border-b border-rule py-3 t-small hover:bg-well">
                  <span className="block text-ink-2">Previous</span>
                  <span className="link font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/lessons/${next.slug}`} className="block min-h-11 border-b border-rule py-3 t-small hover:bg-well sm:text-right">
                  <span className="block text-ink-2">Next</span>
                  <span className="link font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          </article>

          <aside aria-label="Practice this lesson" className="min-w-0 lg:pt-16">
            <div className="lg:sticky lg:top-8">
              <div className="border-t border-ink pt-4">
                <h2 className="t-h3">Practice this in {BRAND.name}</h2>
                <p className="mt-2 t-small text-ink-2">Try it with $100,000 in practice money. Nova checks every trade and links the lesson that fixes what&apos;s missing.</p>
                <Link href={`/learn/${slug}`} className="btn btn-primary mt-4 w-full sm:w-auto">
                  Practice this lesson
                </Link>
                {lesson.quiz.length > 0 && <p className="mt-3 t-micro text-ink-2">The quiz and your progress are in the app.</p>}
              </div>
              <p className="mt-8 t-micro text-ink-2">{BRAND.name} is an educational simulator. No real money, no real trades. Not investment advice.</p>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
