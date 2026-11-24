import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL_PAGES } from "@/lib/legal";
import { COURSE } from "@/lib/course";
import { BOX, LOOP_D, TICK_D } from "@/lib/marks-geometry";
import { HeroMotion } from "@/components/landing/hero-motion";
import { RecordExample } from "@/components/landing/record-example";
import { MotionProvider } from "@/components/motion/provider";
import { Tilt } from "@/components/motion/tilt";

const CHECKS = [
  { name: "Reason", line: "Write why you're buying and what would prove you wrong." },
  { name: "Stop", line: "Decide where you get out before you get in." },
  { name: "Risk", line: "Lose no more than 2% of the account if the stop hits." },
  { name: "Target", line: "Aim to win at least twice what you risk." },
  { name: "Size", line: "Keep any one stock under 25% of the account." },
];

const EXAMPLE_ROWS = [
  { label: "Why", value: "AI data-center demand keeps rising. I'm wrong below $177." },
  { label: "Stop-loss", value: "$177.20" },
  { label: "Shares", value: "107. Risk if stopped $995 (0.99%)" },
  { label: "Take-profit", value: "$208.90. Reward to risk 2.4 : 1" },
  { label: "Order value", value: "$19,958, 19.9% of the account" },
];

/** A check cell drawn on the server; the hero's GSAP timeline draws the tick (data-hero-tick). */
function HeroCell({ i, size = 26 }: { i?: number; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0 overflow-visible" aria-hidden>
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} fill="none" stroke="var(--edge)" strokeWidth={1.5} />
      <path d={TICK_D} pathLength={1} data-hero-tick={i} fill="none" stroke="var(--pencil)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pendingScript = `(function(){try{if(matchMedia("(prefers-reduced-motion: no-preference)").matches){var d=document.documentElement;d.dataset.hero="pending";window.__heroSafety=setTimeout(function(){if(d.dataset.hero==="pending"){delete d.dataset.hero}},1500)}}catch(e){}})();`;

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-[1264px] items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center rounded-md">
            <span className="t-xwide text-[19px] font-semibold leading-none tracking-[-0.01em] lg:text-[21px]">{BRAND.name}</span>
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1">
            <Link href="/learn" className="hidden min-h-10 items-center px-3 text-[15px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
              Course
            </Link>
            <Link href="/community" className="hidden min-h-10 items-center px-3 text-[15px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
              Community
            </Link>
            <Link href="/dashboard" className="btn btn-primary ml-2">
              Open the app
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <script dangerouslySetInnerHTML={{ __html: pendingScript }} />
        <HeroMotion />

        {/* hero */}
        <section className="mx-auto grid max-w-[1264px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20" aria-labelledby="hero-h">
          <div className="min-w-0">
            <h1 id="hero-h" data-hero-line className="t-hero max-w-[12ch]">
              {BRAND.tagline}
            </h1>
            <p data-hero-fade className="mt-6 max-w-[52ch] t-lead text-ink">
              Trade a simulated market with $100,000 in practice money. Nova, an AI coach, checks every trade for the five habits that keep beginners in the game.
            </p>
            <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Start with $100,000 in practice money
              </Link>
              <Link href="/learn" className="btn btn-quiet">
                See the course
              </Link>
            </div>
            <p className="mt-5 max-w-[60ch] t-small text-ink-2">{BRAND.name} is an educational simulator. No real money, no real trades. Not investment advice.</p>
          </div>

          <MotionProvider>
            <Tilt className="min-w-0">
              <div className="sheet" aria-label="Example order ticket, checked by Nova" role="group">
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
                  <span className="t-h3">Buy NVDA</span>
                  <span className="tnum t-wide font-medium">$186.52</span>
                </div>
                <div className="px-5 pt-1">
                  <span className="tag">Example, simulated price</span>
                </div>
                <ul className="mt-4">
                  {EXAMPLE_ROWS.map((r, i) => (
                    <li key={r.label} className="grid grid-cols-[26px_minmax(0,1fr)] items-start gap-x-3 border-t border-rule px-5 py-3">
                      <HeroCell i={i + 1} />
                      <span className="min-w-0 t-small">
                        <span className="block t-micro text-ink-2">{r.label}</span>
                        <span className="tnum block text-ink">{r.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink px-5 pb-5 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="t-h3">Pre-flight check</div>
                      <div className="t-small text-ink-2">5 of 5 complete</div>
                    </div>
                    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: 96, height: 64 }} role="img" aria-label="Process score 92 out of 100, Disciplined">
                      <svg viewBox="0 0 72 48" width={96} height={64} className="absolute inset-0 overflow-visible" aria-hidden>
                        <path d={LOOP_D} pathLength={1} data-hero-loop fill="none" stroke="var(--pencil)" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                      <span className="tnum t-wide relative text-[30px] font-semibold leading-none text-pencil" aria-hidden>
                        92
                      </span>
                    </span>
                  </div>
                  <div data-hero-note className="nova-note mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="t-small font-semibold">Nova</span>
                      <span className="tag tag-nova">AI coach</span>
                    </div>
                    <p className="t-note mt-1">Risk is under 1% and the target is 2.4 times the risk. That&apos;s a plan.</p>
                  </div>
                  <p className="mt-4 t-micro text-ink-2">Example screen with made-up numbers. Not a real quote.</p>
                </div>
              </div>
            </Tilt>
          </MotionProvider>
        </section>

        {/* the five checks */}
        <section className="border-t border-rule" aria-labelledby="checks-h">
          <div className="mx-auto max-w-[1264px] px-4 py-16 lg:px-8 lg:py-24">
            <h2 id="checks-h" className="t-h2 lg:text-[36px] lg:leading-[40px]">
              Every trade gets the same five checks
            </h2>
            <p className="mt-3 max-w-[60ch] t-lead">They&apos;re the habits that separate people who improve from people who quit. Nova ticks each one in blue pencil, or tells you exactly what&apos;s missing.</p>
            <ul className="mt-10 grid grid-cols-1 border-t border-rule-strong sm:grid-cols-2 lg:grid-cols-5">
              {CHECKS.map((c) => (
                <li key={c.name} className="flex gap-4 border-b border-rule py-5 pr-6 lg:flex-col lg:gap-3 lg:border-b-0 lg:border-r lg:pl-5 lg:first:pl-0 lg:last:border-r-0">
                  <svg viewBox="0 0 24 24" width={40} height={40} className="shrink-0 overflow-visible" aria-hidden>
                    <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} fill="none" stroke="var(--edge)" strokeWidth={1.5} />
                    <path d={TICK_D} fill="none" stroke="var(--pencil)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="min-w-0">
                    <h3 className="t-h3">{c.name}</h3>
                    <p className="mt-1 t-small text-ink-2">{c.line}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Nova + the record */}
        <section className="border-t border-rule" aria-label="How coaching works">
          <div className="mx-auto grid max-w-[1264px] grid-cols-1 gap-16 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="min-w-0">
              <h2 className="t-h2 lg:text-[36px] lg:leading-[40px]">Nova writes back</h2>
              <p className="mt-3 max-w-[52ch] t-lead">After every trade you get a process score and plain notes on sizing, risk, planning and emotional red flags, with the lesson that fixes each one.</p>
              <div className="nova-note mt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="t-small font-semibold">Nova</span>
                  <span className="tag tag-nova">AI coach</span>
                  <span className="tag">Example</span>
                </div>
                <p className="t-note mt-2 max-w-[52ch]">You bought TSLA after a 7% jump, with no stop and 30% of your account in it. That&apos;s three risks at once. Next time, set the stop first and size from it.</p>
                <p className="mt-2 t-small">
                  <span className="text-ink-2">Lesson: </span>
                  <span className="underline decoration-rule-strong underline-offset-4">Stop-losses: decide where you&apos;re wrong</span>
                </p>
              </div>
              <p className="mt-6 t-micro text-ink-2">Example, not a real user review. Sample score from a simulated trade. Simulated results are not real trades.</p>
            </div>
            <div className="min-w-0">
              <h2 className="t-h2 lg:text-[36px] lg:leading-[40px]">Your record shows the pattern</h2>
              <p className="mt-3 max-w-[52ch] t-lead">Every trade is filed with its five checks, so the habit you skip shows up as an empty column.</p>
              <div className="mt-8">
                <RecordExample />
              </div>
              <p className="mt-3 t-micro text-ink-2">Example with made-up trades.</p>
            </div>
          </div>
        </section>

        {/* course slice */}
        <section className="border-t border-rule" aria-labelledby="course-h">
          <div className="mx-auto max-w-[1264px] px-4 py-16 lg:px-8 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="course-h" className="t-h2 lg:text-[36px] lg:leading-[40px]">
                  A course that follows your mistakes
                </h2>
                <p className="mt-3 max-w-[60ch] t-lead">Short lessons with quizzes and something to try in the simulator. When Nova flags a mistake, it links the lesson that fixes it.</p>
              </div>
              <Link href="/learn" className="btn btn-secondary">
                See the course
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
              {COURSE.slice(0, 2).map((m, mi) => (
                <div key={m.id} className="min-w-0">
                  <div className="sec-head">
                    <h3 className="t-h3">
                      <span className="tnum mr-2 text-ink-2">{mi + 1}</span>
                      {m.title}
                    </h3>
                    <span className="tnum t-small text-ink-2">{m.lessons.length} lessons</span>
                  </div>
                  <ol>
                    {m.lessons.map((l) => (
                      <li key={l.slug} className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5 t-small">
                        <span className="min-w-0">{l.title}</span>
                        <span className="tnum shrink-0 t-micro text-muted">{l.minutes} min</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-rule" aria-labelledby="start-h">
          <div className="mx-auto flex max-w-[1264px] flex-wrap items-center justify-between gap-6 px-4 py-16 lg:px-8">
            <h2 id="start-h" className="t-h2 max-w-[24ch] lg:text-[36px] lg:leading-[40px]">
              Make your first trade with a plan.
            </h2>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Start with $100,000 in practice money
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1264px] px-4 py-10 lg:px-8">
          <span className="t-xwide text-[19px] font-semibold">{BRAND.name}</span>
          <p className="mt-3 max-w-[72ch] t-small text-ink-2">{BRAND.name} is an educational simulator. No real money, no real trades. Prices and news are generated. Not investment advice. Not affiliated with or endorsed by any company named.</p>
          <ul className="mt-3 flex flex-wrap gap-x-5" aria-label="Legal">
            {LEGAL_PAGES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link inline-flex min-h-10 items-center t-small">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
