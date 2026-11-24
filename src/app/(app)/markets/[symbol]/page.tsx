"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Info, Star } from "lucide-react";
import { TICKER_MAP } from "@/lib/market-data";
import { useMarket, getHistory } from "@/store/market";
import { useApp } from "@/store/app";
import { PriceChart } from "@/components/price-chart";
import { OrderTicket } from "@/components/order-ticket";
import { ReviewCard } from "@/components/review-card";
import { NewsFeed } from "@/components/news-feed";
import { Delta, LivePrice, Segmented, SectionTitle } from "@/components/ui";
import { cn, usd } from "@/lib/format";

type Range = "1D" | "1M" | "3M" | "1Y";

function volWord(v: number) {
  if (v < 0.18) return "Low — moves gently";
  if (v < 0.3) return "Moderate";
  if (v < 0.45) return "High — expect big swings";
  return "Very high — can move 5%+ in a day";
}

export default function SymbolPage() {
  const { symbol: raw } = useParams<{ symbol: string }>();
  const symbol = (raw ?? "").toUpperCase();
  const t = TICKER_MAP[symbol];
  const price = useMarket((s) => s.prices[symbol]);
  const prev = useMarket((s) => s.prevClose[symbol]);
  const intraday = useMarket((s) => s.intraday[symbol]);
  const position = useApp((s) => s.positions[symbol]);
  const trades = useApp((s) => s.trades);
  const watch = useApp((s) => s.watchlist.includes(symbol));
  const toggleWatch = useApp((s) => s.toggleWatch);
  const [range, setRange] = useState<Range>("1D");
  const [justFilled, setJustFilled] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!t) return [];
    if (range === "1D") return intraday ?? [];
    const hist = getHistory(symbol);
    const n = range === "1M" ? 22 : range === "3M" ? 64 : hist.length;
    const slice = hist.slice(-n);
    return price ? [...slice.slice(0, -1), { t: Date.now(), c: price }] : slice;
  }, [t, range, intraday, symbol, price]);

  if (!t)
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">We don&apos;t have {symbol} in the simulator yet.</p>
        <Link href="/markets" className="mt-2 inline-block text-series-1 hover:underline">Back to markets</Link>
      </div>
    );

  const symTrades = trades.filter((x) => x.symbol === symbol);
  const shown = justFilled ? trades.find((x) => x.id === justFilled) : symTrades[0];
  const rangeStart = data[0]?.c ?? price;
  const ma50 = (() => {
    const h = getHistory(symbol).slice(-50);
    return h.reduce((a, b) => a + b.c, 0) / Math.max(1, h.length);
  })();

  return (
    <div className="space-y-6">
      <Link href="/markets" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Markets
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* On mobile the wrapper dissolves so the ticket can sit right under the chart */}
        <div className="contents min-w-0 space-y-4 lg:block">
          <section className="card order-1 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{t.symbol}</h1>
                  <span className="text-ink-2">{t.name}</span>
                  <button onClick={() => toggleWatch(symbol)} aria-label="Toggle watchlist" className="text-muted hover:text-ink">
                    <Star className={cn("size-4", watch && "fill-warn text-warn")} />
                  </button>
                </div>
                {price && <LivePrice value={price} format={(n) => usd(n)} className="mt-1 block text-4xl font-semibold tracking-tight" />}
                <div className="mt-1 flex items-center gap-3 text-sm">
                  {price && prev && <Delta value={price - prev} />}
                  {price && rangeStart && <Delta ratio={price / rangeStart - 1} />}
                  <span className="text-muted">{range === "1D" ? "today" : `past ${range}`}</span>
                </div>
              </div>
              <Segmented value={range} onChange={setRange} options={(["1D", "1M", "3M", "1Y"] as Range[]).map((r) => ({ value: r, label: r }))} />
            </div>
            <div className="mt-4">
              <PriceChart
                data={data}
                height={320}
                baseline={range === "1D" ? prev : undefined}
                baselineLabel={range === "1D" ? `Prev close ${usd(prev ?? 0)}` : undefined}
                label={`${symbol} price, ${range}`}
                formatTime={range === "1D" ? (x) => new Date(x).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : undefined}
                markers={symTrades.map((x) => ({ t: x.at, side: x.side }))}
              />
            </div>
          </section>

          {shown && (
            <section className="order-3">
              <SectionTitle title={justFilled ? "Your coach review" : `Your last ${symbol} trade`} />
              <ReviewCard trade={shown} />
            </section>
          )}

          <div className="order-4 grid gap-4 md:grid-cols-2">
            <section className="card p-5">
              <SectionTitle title={`About ${t.name}`} />
              <p className="text-sm text-ink-2">{t.blurb}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat k="Sector" v={t.sector} />
                {t.marketCapB && <Stat k="Market cap" v={t.marketCapB >= 1000 ? `$${(t.marketCapB / 1000).toFixed(2)}T` : `$${t.marketCapB}B`} />}
                {t.pe && <Stat k="P/E ratio" v={String(t.pe)} lesson="valuation-pe" />}
                <Stat k="Dividend yield" v={t.dividendYield ? `${t.dividendYield}%` : "None"} />
                <Stat k="Beta" v={t.beta.toFixed(2)} lesson="how-the-market-moves" />
                <Stat k="50-day avg" v={usd(ma50)} lesson="moving-averages" />
              </dl>
              <div className="mt-4 flex gap-2 rounded-2xl bg-panel-2 p-3 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-muted" />
                <span><span className="font-medium">Volatility:</span> {volWord(t.vol)}. {price && price > ma50 ? "Trading above its 50-day average." : "Trading below its 50-day average."}</span>
              </div>
            </section>
            <section className="card p-5">
              <SectionTitle title="Your position" />
              {position ? (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Stat k="Shares" v={String(position.qty)} />
                  <Stat k="Avg cost" v={usd(position.avgCost)} />
                  <Stat k="Market value" v={usd(position.qty * (price ?? 0))} />
                  <div>
                    <dt className="text-xs text-muted">Unrealized P&L</dt>
                    <dd className="mt-0.5"><Delta value={position.qty * ((price ?? 0) - position.avgCost)} /></dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted">You don&apos;t own {symbol} yet.</p>
              )}
              <h3 className="mb-2 mt-5 text-sm font-semibold">News</h3>
              <NewsFeed symbol={symbol} limit={4} />
            </section>
          </div>
        </div>

        <aside className="order-2 lg:sticky lg:top-20 lg:h-fit">
          <OrderTicket symbol={symbol} onFilled={setJustFilled} />
        </aside>
      </div>
    </div>
  );
}

function Stat({ k, v, lesson }: { k: string; v: string; lesson?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{lesson ? <Link href={`/learn/${lesson}`} className="underline decoration-dotted underline-offset-2 hover:text-ink">{k}</Link> : k}</dt>
      <dd className="tnum mt-0.5 font-medium">{v}</dd>
    </div>
  );
}
