"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { TICKERS, Sector } from "@/lib/market-data";
import { useMarket } from "@/store/market";
import { useApp } from "@/store/app";
import { Sparkline } from "@/components/price-chart";
import { Delta, LivePrice, SectionTitle } from "@/components/ui";
import { NewsFeed } from "@/components/news-feed";
import { cn, usd } from "@/lib/format";

const SECTORS: ("All" | "Watchlist" | Sector)[] = ["All", "Watchlist", "Index ETF", "Technology", "Communication", "Consumer", "Financials", "Healthcare", "Energy"];

export default function Markets() {
  const prices = useMarket((s) => s.prices);
  const prevClose = useMarket((s) => s.prevClose);
  const intraday = useMarket((s) => s.intraday);
  const watchlist = useApp((s) => s.watchlist);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const [filter, setFilter] = useState<(typeof SECTORS)[number]>("All");

  const change = (sym: string) => (prices[sym] && prevClose[sym] ? prices[sym] / prevClose[sym] - 1 : 0);
  const list = TICKERS.filter((t) => (filter === "All" ? true : filter === "Watchlist" ? watchlist.includes(t.symbol) : t.sector === filter));
  const movers = [...TICKERS].sort((a, b) => Math.abs(change(b.symbol)) - Math.abs(change(a.symbol))).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Markets</h1>
        <p className="mt-1 text-sm text-ink-2">Real companies, simulated prices. Prices update every two seconds, and the news moves them.</p>
      </div>

      <section>
        <SectionTitle title="Biggest movers today" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {movers.map((t) => (
            <Link key={t.symbol} href={`/markets/${t.symbol}`} className="card p-4 transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.symbol}</span>
                <Delta ratio={change(t.symbol)} size="xs" />
              </div>
              <div className="mt-1 truncate text-xs text-muted">{t.name}</div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <LivePrice value={prices[t.symbol] ?? t.basePrice} format={(n) => usd(n)} className="font-semibold" />
                <Sparkline data={(intraday[t.symbol] ?? []).slice(-60).map((b) => b.c)} width={72} height={28} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-2 sm:p-4 lg:col-span-2">
          <div className="flex gap-1.5 overflow-x-auto px-2 pb-3 pt-1 sm:px-0">
            {SECTORS.map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition", filter === s ? "bg-ink text-bg" : "bg-panel-2 text-ink-2 hover:text-ink")}>
                {s}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-line">
            {list.map((t) => (
              <li key={t.symbol} className="flex items-center gap-3 px-2 py-3">
                <button onClick={() => toggleWatch(t.symbol)} aria-label={watchlist.includes(t.symbol) ? `Remove ${t.symbol} from watchlist` : `Add ${t.symbol} to watchlist`} className="text-muted hover:text-ink">
                  <Star className={cn("size-4", watchlist.includes(t.symbol) && "fill-warn text-warn")} />
                </button>
                <Link href={`/markets/${t.symbol}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-panel-2 text-[11px] font-bold">{t.symbol.slice(0, 4)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t.symbol}</span>
                    <span className="block truncate text-xs text-muted">{t.name} · {t.sector}</span>
                  </span>
                  <span className="hidden sm:block">
                    <Sparkline data={(intraday[t.symbol] ?? []).slice(-80).map((b) => b.c)} width={110} height={32} />
                  </span>
                  <span className="w-24 text-right">
                    <LivePrice value={prices[t.symbol] ?? t.basePrice} format={(n) => usd(n)} className="block text-sm font-semibold" />
                    <Delta ratio={change(t.symbol)} size="xs" />
                  </span>
                </Link>
              </li>
            ))}
            {list.length === 0 && <li className="p-6 text-center text-sm text-muted">Star stocks to build your watchlist.</li>}
          </ul>
        </section>
        <section className="card h-fit p-5">
          <SectionTitle title="Live headlines" />
          <NewsFeed limit={8} />
        </section>
      </div>
    </div>
  );
}
