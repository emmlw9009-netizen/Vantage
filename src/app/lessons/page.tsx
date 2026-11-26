import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { COURSE, ALL_LESSONS } from "@/lib/course";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

export const metadata: Metadata = {
  title: `Free investing lessons for beginners | ${BRAND.name}`,
  description: `${ALL_LESSONS.length} short, free lessons on position sizing, stop-losses, reward to risk and the habits that keep beginners in the game. Educational only, not investment advice.`,
  alternates: { canonical: "/lessons" },
  openGraph: { type: "website", title: `Free investing lessons for beginners | ${BRAND.name}`, url: "/lessons", images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
};

export default function LessonsIndex() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main id="main" className="mx-auto max-w-[1264px] px-4 pb-20 pt-12 lg:px-8 lg:pt-20">
        <h1 className="t-title max-w-[18ch]">Learn the habits before you trade</h1>
        <p className="mt-5 max-w-[56ch] t-lead">
          {ALL_LESSONS.length} short lessons, free to read. Each one ends in something you can practice in the simulator, with Nova checking your work.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-2">
          {COURSE.map((m, mi) => (
            <section key={m.id} className="min-w-0" aria-labelledby={`m-${m.id}`}>
              <div className="sec-head">
                <h2 id={`m-${m.id}`} className="t-h3">
                  <span className="tnum mr-2 text-ink-2">{mi + 1}</span>
                  {m.title}
                </h2>
                <span className="tnum t-small text-ink-2">{m.lessons.length} lessons</span>
              </div>
              <ol>
                {m.lessons.map((l) => (
                  <li key={l.slug} className="border-b border-rule">
                    <Link href={`/lessons/${l.slug}`} className="flex min-h-11 items-baseline justify-between gap-3 py-2.5 t-small hover:bg-well">
                      <span className="min-w-0">
                        <span className="link block font-medium">{l.title}</span>
                        <span className="block text-ink-2">{l.summary}</span>
                      </span>
                      <span className="tnum shrink-0 t-micro text-muted">{l.minutes} min</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-rule-strong pt-8">
          <p className="max-w-[44ch] t-h3">Two of the habits have free calculators.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tools/position-size-calculator" className="btn btn-secondary">
              Position size calculator
            </Link>
            <Link href="/tools/reward-risk-calculator" className="btn btn-secondary">
              Reward to risk calculator
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
