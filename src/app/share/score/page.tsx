import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";
import { ScoreLoop } from "@/components/marks";
import { SHARE_DISCLAIMER, parseShareScore } from "@/lib/share-score";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const c = parseShareScore(sp);
  const title = `A process score of ${c.score}, ${c.label} | ${BRAND.name}`;
  const description = `${c.side === "buy" ? "Bought" : "Sold"} ${c.symbol} in the ${BRAND.name} simulator and earned a process score of ${c.score} (${c.label}). ${SHARE_DISCLAIMER}`;
  const q = new URLSearchParams({ s: String(c.score), sym: c.symbol, side: c.side });
  const image = `/share/score/card?${q.toString()}`;
  return {
    title,
    description,
    alternates: { canonical: "/share/score" },
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description, images: [{ url: image, width: 1200, height: 630, alt: `Process score ${c.score}, ${c.label}, for a simulated ${c.side} of ${c.symbol}` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ShareScorePage({ searchParams }: Props) {
  const c = parseShareScore(await searchParams);
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main id="main" className="mx-auto max-w-[1264px] px-4 pb-20 pt-10 lg:px-8 lg:pt-16">
        <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <section className="sheet min-w-0 px-5 pb-5 pt-5 sm:px-7 sm:pt-7" aria-label="Score card" data-testid="share-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="t-h3">
                {c.side === "buy" ? "Bought" : "Sold"} {c.symbol}
              </span>
              <span className="tag">Simulated trade</span>
            </div>
            <div className="mt-8 flex justify-center">
              <ScoreLoop score={c.score} size="l" label={false} />
            </div>
            <p className="mt-3 text-center t-h2" data-testid="share-label">
              {c.label}
            </p>
            <p className="mt-1 text-center t-small text-ink-2">Process score out of 100. It grades the plan, not the result.</p>
            <p className="mt-8 border-t border-ink pt-3 t-micro text-ink-2">{SHARE_DISCLAIMER}</p>
          </section>

          <div className="min-w-0 lg:pt-4">
            <h1 className="t-title max-w-[16ch]">Process score {c.score}</h1>
            <p className="mt-4 max-w-[52ch] t-lead">
              Every trade in {BRAND.name} gets five checks: a written reason, a stop, the risk, a target and the size. The score is how many of them the trade passed.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/dashboard" className="btn btn-primary btn-lg w-full sm:w-auto">
                Get your own score
              </Link>
              <Link href="/lessons" className="btn btn-quiet">
                Read the free lessons
              </Link>
            </div>
            <p className="mt-6 max-w-[56ch] t-small text-ink-2">{BRAND.name} is an educational simulator. No real money, no real trades. This card shows a process score only, never profit or returns. Not investment advice.</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
