"use client";

import Link from "next/link";
import { useMarket } from "@/store/market";
import { LESSON_MAP } from "@/lib/course";
import { timeAgo } from "@/lib/format";
import { Delta } from "./ui";

const KIND: Record<string, string> = { earnings: "Earnings", guidance: "Guidance", analyst: "Analyst note", macro: "Economy", product: "Product" };

/** Simulated headlines: every item carries the Simulated tag; the list ends with the not-real-news line. */
export function NewsFeed({ symbol, limit = 6 }: { symbol?: string; limit?: number }) {
  const news = useMarket((s) => s.news);
  const items = news.filter((n) => !symbol || n.symbol === symbol || n.symbol === null).slice(0, limit);
  if (!items.length)
    return <p className="t-small text-ink-2">Simulated headlines appear here as the market moves. They are fictional scenarios for practice, not real news.</p>;
  return (
    <>
      <ul className="border-t border-rule">
        {items.map((n) => (
          <li key={n.id} className="border-b border-rule py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="tag">{n.symbol ?? "Market"}</span>
              <span data-testid="sim-tag" className="tag">
                Simulated
              </span>
            </div>
            <p className="mt-1.5 t-small font-medium break-words">
              {n.symbol ? (
                <Link href={`/markets/${n.symbol}`} className="hover:underline">
                  {n.headline}
                </Link>
              ) : (
                n.headline
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 t-micro text-ink-2">
              <span>{timeAgo(n.at)}</span>
              <span>{KIND[n.kind] ?? n.kind}</span>
              <span className="inline-flex items-center gap-1">
                Impact <Delta ratio={n.impact} size="xs" />
              </span>
              {n.lesson && LESSON_MAP[n.lesson] && (
                <Link href={`/learn/${n.lesson}`} className="link inline-flex min-h-6 items-center">
                  How news moves prices
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 t-micro text-ink-2">Fictional scenarios for practice. Not real news, and not about any company&apos;s actual business. Not affiliated with or endorsed by any company named.</p>
    </>
  );
}
