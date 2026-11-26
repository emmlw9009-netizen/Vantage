"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { TICKER_MAP } from "@/lib/market-data";
import type { Bar } from "@/lib/market-data";
import { useMarket, getHistory } from "@/store/market";
import { useApp, usePlan } from "@/store/app";
import { can } from "@/lib/plans";
import { PaywallDialog, PlanTag } from "@/components/paywall";
import { PriceChart } from "@/components/price-chart";
import { OrderTicket } from "@/components/order-ticket";
import { ReviewCard } from "@/components/review-card";
import { NewsFeed } from "@/components/news-feed";
import { Delta, Segmented, SectionTitle } from "@/components/ui";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { usd } from "@/lib/format";

type Range = "1D" | "1M" | "3M" | "1Y";

function volWord(v: number) {
  if (v < 0.18) return "Low. It moves gently";
  if (v < 0.3) return "Moderate";
  if (v < 0.45) return "High. Expect big swings";
  return "Very high. It can move 5% or more in a day";
}

/** Rolling 50-close average over the full history; only points where 50 closes exist. */
function movingAverage(hist: Bar[], n = 50): Bar[] {
  const out: Bar[] = [];
  let sum = 0;
  for (let i = 0; i < hist.length; i++) {
    sum += hist[i].c;
    if (i >= n) sum -= hist[i - n].c;
    if (i >= n - 1) out.push({ t: hist[i].t, c: sum / n });
  }
  return out;
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
  const [showMa, setShowMa] = useState(false);
  const plan = usePlan();
  const maAllowed = can(plan, "ma-overlay");
  const [maPaywall, setMaPaywall] = useState(false);
  const [justFilled, setJustFilled] = useState<string | null>(null);

  const hist = useMemo(() => (t ? getHistory(symbol) : []), [t, symbol]);
  const data = useMemo(() => {
    if (!t) return [];
    if (range === "1D") return intraday ?? [];
    const n = range === "1M" ? 22 : range === "3M" ? 64 : hist.length;
    const slice = hist.slice(-n);
    return price ? [...slice.slice(0, -1), { t: Date.now(), c: price }] : slice;
  }, [t, range, intraday, hist, price]);
  const ma = useMemo(() => movingAverage(hist), [hist]);

  if (!t)
    return (
      <div className="max-w-xl">
        <h1 className="t-title">{symbol || "Unknown"}</h1>
        <p className="mt-3 t-lead">We don&apos;t have {symbol} in the simulator yet.</p>
        <Link href="/markets" className="btn btn-secondary mt-6">
          Back to markets
        </Link>
      </div>
    );

  const symTrades = trades.filter((x) => x.symbol === symbol);
  const shown = justFilled ? trades.find((x) => x.id === justFilled) : symTrades[0];
  const rangeStart = data[0]?.c ?? price;
  const ma50 = ma[ma.length - 1]?.c ?? 0;
  const maOn = maAllowed && showMa && range !== "1D";

  return (
    <div>
      <Link href="/markets" className="link inline-flex min-h-10 items-center t-small text-ink-2">
        Markets
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        {/* On phones the wrapper dissolves so the ticket sits right under the chart */}
        <div className="contents lg:block lg:min-w-0 lg:space-y-12">
          <section className="order-1 min-w-0" aria-labelledby="sym-h">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h1 id="sym-h" className="t-title">
                    {t.symbol}
                  </h1>
                  <span className="t-lead">{t.name}</span>
                </div>
                {price && (
                  <div className="mt-3">
                    <AnimatedNumber value={price} format={(n) => usd(n)} split className="t-readout block" />
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 t-small">
                      {prev && <Delta value={price - prev} />}
                      {rangeStart && <Delta ratio={price / rangeStart - 1} />}
                      <span className="text-ink-2">{range === "1D" ? "today" : `past ${range}`}</span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => toggleWatch(symbol)} aria-pressed={watch} className="btn btn-secondary">
                {watch ? "Watching" : "Watch"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Chart range" value={range} onChange={setRange} options={(["1D", "1M", "3M", "1Y"] as Range[]).map((r) => ({ value: r, label: r }))} />
              {range !== "1D" &&
                (maAllowed ? (
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 t-small text-ink">
                    <input type="checkbox" checked={showMa} onChange={(e) => setShowMa(e.target.checked)} className="size-5 accent-[var(--ink)]" />
                    Show 50-day average
                  </label>
                ) : (
                  <button onClick={() => setMaPaywall(true)} aria-haspopup="dialog" className="inline-flex min-h-10 items-center gap-2 rounded-md t-small text-ink">
                    <span aria-hidden className="block size-5 rounded-[4px] border border-edge" />
                    Show 50-day average
                    <PlanTag feature="ma-overlay" />
                  </button>
                ))}
              {maPaywall && <PaywallDialog gate="ma" onClose={() => setMaPaywall(false)} />}
            </div>
            <div className="mt-4">
              <PriceChart
                data={data}
                height={320}
                baseline={range === "1D" ? prev : undefined}
                baselineLabel={range === "1D" && prev ? `Previous close ${usd(prev)}` : undefined}
                label={`${symbol} price, ${range}`}
                seriesLabel={symbol}
                overlay={maOn ? { label: "50-day average", data: ma } : undefined}
                formatTime={range === "1D" ? (x) => new Date(x).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : undefined}
                markers={symTrades.map((x) => ({ t: x.at, side: x.side, note: `${x.side === "buy" ? "Bought" : "Sold"} ${x.qty} at ${usd(x.price)}. Score ${x.score}.` }))}
              />
            </div>
          </section>

          {shown && (
            <section className="order-3 min-w-0" aria-label={justFilled ? "Your coach review" : `Your last ${symbol} trade`}>
              <ReviewCard trade={shown} headingLevel="h2" />
            </section>
          )}

          <div className="order-4 grid min-w-0 grid-cols-1 gap-10 md:grid-cols-2">
            <section className="min-w-0" aria-labelledby="about-h">
              <SectionTitle id="about-h" title={`About ${t.name}`} />
              <p className="t-small text-ink-2">{t.blurb}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 t-small">
                <Stat k="Sector" v={t.sector} />
                {t.marketCapB && <Stat k="Market cap" v={t.marketCapB >= 1000 ? `$${(t.marketCapB / 1000).toFixed(2)}T` : `$${t.marketCapB}B`} />}
                {t.pe && <Stat k="P/E ratio" v={String(t.pe)} lesson="valuation-pe" />}
                <Stat k="Dividend yield" v={t.dividendYield ? `${t.dividendYield}%` : "None"} />
                <Stat k="Beta" v={t.beta.toFixed(2)} lesson="how-the-market-moves" />
                <Stat k="50-day average" v={usd(ma50)} lesson="moving-averages" />
              </dl>
              <p className="mt-3 t-micro text-ink-2">Approximate figures, for practice, as of late 2026. Not live data.</p>
              <p className="mt-4 border-t border-rule pt-3 t-small text-ink-2">
                <span className="font-medium text-ink">Volatility:</span> {volWord(t.vol)}. {price && price > ma50 ? "Trading above its 50-day average." : "Trading below its 50-day average."}
              </p>
            </section>
            <section className="min-w-0" aria-labelledby="pos-h">
              <SectionTitle id="pos-h" title="Your position" />
              {position ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 t-small">
                  <Stat k="Shares" v={String(position.qty)} />
                  <Stat k="Average cost" v={usd(position.avgCost)} />
                  <Stat k="Market value" v={usd(position.qty * (price ?? 0))} />
                  <div>
                    <dt className="t-micro text-ink-2">Unrealized P&amp;L</dt>
                    <dd className="mt-0.5">
                      <Delta value={position.qty * ((price ?? 0) - position.avgCost)} />
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="t-small text-ink-2">You don&apos;t own {symbol} yet.</p>
              )}
              <h3 className="mb-2 mt-8 t-h3">News</h3>
              <NewsFeed symbol={symbol} limit={4} />
            </section>
          </div>
        </div>

        <aside className="order-2 min-w-0 lg:sticky lg:top-[80px] lg:h-fit" aria-label="Order ticket">
          <OrderTicket symbol={symbol} onFilled={setJustFilled} />
        </aside>
      </div>
    </div>
  );
}

function Stat({ k, v, lesson }: { k: string; v: string; lesson?: string }) {
  return (
    <div className="min-w-0">
      <dt className="t-micro text-ink-2">
        {lesson ? (
          <Link href={`/learn/${lesson}`} className="link -my-3 inline-block py-3">
            {k}
          </Link>
        ) : (
          k
        )}
      </dt>
      <dd className="tnum mt-0.5 font-medium">{v}</dd>
    </div>
  );
}
