"use client";

import Link from "next/link";
import { FlaskConical, Newspaper } from "lucide-react";
import { useMarket } from "@/store/market";
import { LESSON_MAP } from "@/lib/course";
import { timeAgo } from "@/lib/format";
import { Delta } from "./ui";

export function NewsFeed({ symbol, limit = 6 }: { symbol?: string; limit?: number }) {
  const news = useMarket((s) => s.news);
  const items = news.filter((n) => !symbol || n.symbol === symbol || n.symbol === null).slice(0, limit);
  if (!items.length)
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
        <Newspaper className="size-4" /> Simulated headlines appear here as the market moves. They are fictional scenarios for practice, not real news.
      </div>
    );
  return (
    <>
    <ul className="divide-y divide-line">
      {items.map((n) => (
        <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-0.5 rounded-md bg-panel-2 px-1.5 py-0.5 text-xs font-semibold text-ink-2">{n.symbol ?? "Macro"}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1"><span data-testid="sim-tag" className="inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2 py-0.5 text-xs font-semibold text-ink-2"><FlaskConical className="size-3" aria-hidden />Simulated</span></div>
            <div className="text-sm font-medium">{n.symbol ? <Link href={`/markets/${n.symbol}`} className="hover:underline">{n.headline}</Link> : n.headline}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>{timeAgo(n.at)}</span>
              <span className="capitalize">{n.kind}</span>
              <span className="flex items-center gap-1">
                Impact <Delta ratio={n.impact} size="xs" />
              </span>
              {n.lesson && LESSON_MAP[n.lesson] && (
                <Link href={`/learn/${n.lesson}`} className="font-medium text-series-1 hover:underline">
                  Why this moves stocks
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
    <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Fictional scenarios for practice. Not real news, and not about any company&apos;s actual business. Not affiliated with or endorsed by any company named.</p>
    </>
  );
}
