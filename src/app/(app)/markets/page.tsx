"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TICKERS, Sector } from "@/lib/market-data";
import { useMarket } from "@/store/market";
import { useApp } from "@/store/app";
import { Sparkline } from "@/components/price-chart";
import { Delta, Segmented, SectionTitle, TabPanel } from "@/components/ui";
import { NewsFeed } from "@/components/news-feed";
import { cn, usd } from "@/lib/format";

const SECTORS: ("All" | "Watchlist" | Sector)[] = ["All", "Watchlist", "Index ETF", "Technology", "Communication", "Consumer", "Financials", "Healthcare", "Energy"];

export default function Markets() {
  const prices = useMarket((s) => s.prices);
  const prevClose = useMarket((s) => s.prevClose);
  const intraday = useMarket((s) => s.intraday);
  const watchlist = useApp((s) => s.watchlist);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof SECTORS)[number]>("All");
  const change = (sym: string) => (prices[sym] && prevClose[sym] ? prices[sym] / prevClose[sym] - 1 : 0);
  const list = TICKERS.filter((t) => (filter === "All" ? true : filter === "Watchlist" ? watchlist.includes(t.symbol) : t.sector === filter));
  const movers = [...TICKERS].sort((a, b) => Math.abs(change(b.symbol)) - Math.abs(change(a.symbol))).slice(0, 5);

  return (
    <div>
      <h1 className="t-title">Markets</h1>
      <p className="mt-2 max-w-[72ch] t-lead">Real companies, simulated prices. Prices update every 2 seconds, and the simulated news moves them.</p>

      {/* phones: movers as one line */}
      <p className="mt-4 t-small text-ink-2 lg:hidden">
        <span className="font-medium text-ink">Biggest moves today: </span>
        {movers.slice(0, 3).map((t, i) => (
          <span key={t.symbol} className="whitespace-nowrap">
            <Link href={`/markets/${t.symbol}`} className="link text-ink">
              {t.symbol}
            </Link>{" "}
            <Delta ratio={change(t.symbol)} size="xs" />
            {i < 2 ? ", " : ""}
          </span>
        ))}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Segmented kind="tabs" idBase="sector" label="Filter by sector" value={filter} onChange={setFilter} options={SECTORS.map((s) => ({ value: s, label: s === "Index ETF" ? "Index ETFs" : s }))} />
          <TabPanel idBase="sector" value={filter}>
          <table className="mt-2 w-full t-table">
            <caption className="sr-only">Stocks and ETFs, {filter === "All" ? "all sectors" : filter}</caption>
            <thead>
              <tr className="border-b border-rule-strong text-left t-micro text-ink-2">
                <th scope="col" className="py-2 pr-3 font-medium">Symbol</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">Sector</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">Today</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Price</th>
                <th scope="col" className="py-2 text-right font-medium sm:pr-3">Day change</th>
                <th scope="col" className="hidden py-2 text-right font-medium lg:table-cell">
                  <span className="sr-only">Watchlist</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const on = watchlist.includes(t.symbol);
                return (
                  <tr key={t.symbol} className="cursor-pointer border-b border-rule hover:bg-well" onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button")) router.push(`/markets/${t.symbol}`); }}>
                    <td className="max-w-0 py-2.5 pr-3 sm:max-w-none">
                      <Link href={`/markets/${t.symbol}`} className="block min-h-10 hover:underline">
                        <span className="block font-semibold text-[15px] t-wide">{t.symbol}</span>
                        <span className="block truncate t-micro text-ink-2">{t.name}</span>
                      </Link>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-ink-2 md:table-cell">{t.sector}</td>
                    <td className="hidden py-2.5 pr-3 sm:table-cell">
                      <Sparkline data={(intraday[t.symbol] ?? []).slice(-80).map((b) => b.c)} width={96} height={26} base={prevClose[t.symbol]} />
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium">{usd(prices[t.symbol] ?? t.basePrice)}</td>
                    <td className="py-2.5 text-right sm:pr-3">
                      <Delta ratio={change(t.symbol)} />
                    </td>
                    <td className="hidden py-2.5 text-right lg:table-cell">
                      <button onClick={() => toggleWatch(t.symbol)} aria-pressed={on} className={cn("btn min-h-10 px-2.5 t-small font-medium", on ? "btn-secondary" : "btn-quiet text-ink-2")}>
                        {on ? "Watching" : "Watch"}
                        <span className="sr-only"> {t.symbol}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="mt-4 t-small text-ink-2">Your watchlist is empty. Open a stock and press Watch to add it here.</p>}
          </TabPanel>
        </div>

        <aside className="min-w-0 space-y-12">
          <section className="hidden lg:block" aria-labelledby="movers-h">
            <SectionTitle id="movers-h" title="Biggest moves today" />
            <ol className="t-small">
              {movers.map((t) => (
                <li key={t.symbol} className="flex items-center justify-between gap-3 border-b border-rule py-2">
                  <Link href={`/markets/${t.symbol}`} className="min-w-0 truncate hover:underline">
                    <span className="font-semibold">{t.symbol}</span> <span className="text-ink-2">{t.name}</span>
                  </Link>
                  <Delta ratio={change(t.symbol)} />
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="headlines-h">
            <SectionTitle id="headlines-h" title="Simulated headlines" />
            <NewsFeed limit={8} />
          </section>
        </aside>
      </div>
    </div>
  );
}
