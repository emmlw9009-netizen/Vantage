"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp, useEquity, STARTING_CASH } from "@/store/app";
import { useMarket } from "@/store/market";
import { PriceChart, Sparkline } from "@/components/price-chart";
import { Delta, SectionTitle } from "@/components/ui";
import { ReviewCard } from "@/components/review-card";
import { NewsFeed } from "@/components/news-feed";
import { CheckCell, CheckStrip, NovaByline, ScoreLoop } from "@/components/marks";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { ALL_LESSONS, MISSIONS, levelFor } from "@/lib/course";
import { TICKER_MAP } from "@/lib/market-data";
import { tradeChecks } from "@/lib/trade-checks";
import { pct, timeAgo, usd } from "@/lib/format";
import { EmptyLedger } from "@/components/empty-ledger";

const listJoin = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

function useCoachBrief() {
  const positions = useApp((s) => s.positions);
  const orders = useApp((s) => s.orders);
  const trades = useApp((s) => s.trades);
  const prices = useMarket((s) => s.prices);
  const equity = useEquity();
  return useMemo(() => {
    const tips: { body: string; href: string; cta: string }[] = [];
    const pos = Object.values(positions);
    if (!trades.length) tips.push({ body: "Start with SPY, the whole market in one trade. Write one sentence on why you'd buy it, and set a stop-loss. I'll review the trade the moment it fills.", href: "/markets/SPY", cta: "Open SPY" });
    const unprotected = pos.filter((p) => !orders.some((o) => o.status === "open" && o.symbol === p.symbol && o.role === "stop-loss"));
    if (unprotected.length)
      tips.push({
        body: `${listJoin(unprotected.map((p) => p.symbol))} ${unprotected.length > 1 ? "have" : "has"} no stop-loss. Pick the price where your reason stops being true and put the stop there.`,
        href: `/markets/${unprotected[0].symbol}`,
        cta: `Set a stop on ${unprotected[0].symbol}`,
      });
    const big = pos.map((p) => ({ p, w: (p.qty * (prices[p.symbol] ?? p.avgCost)) / equity })).filter((x) => x.w > 0.25);
    if (big.length) tips.push({ body: `${big[0].p.symbol} is ${pct(big[0].w, 0, false)} of your account. One headline could sink the month. Trimming it brings the risk back under control.`, href: "/learn/position-sizing", cta: "Lesson: Position sizing" });
    const sectors = new Set(pos.map((p) => TICKER_MAP[p.symbol]?.sector));
    if (pos.length >= 2 && sectors.size === 1) tips.push({ body: "All your positions are in one sector, so they'll likely move together. Spreading across sectors smooths the ride.", href: "/learn/diversification", cta: "Lesson: Diversification" });
    const recent = trades.filter((t) => t.role === "entry").slice(0, 5);
    if (recent.length >= 3) {
      const avg = recent.reduce((a, t) => a + t.score, 0) / recent.length;
      if (avg < 65) tips.push({ body: `Your last ${recent.length} trades averaged ${Math.round(avg)}. The pattern is fixable. Ask me to walk through them with you.`, href: "/coach", cta: "Talk to Nova" });
    }
    if (!tips.length) tips.push({ body: "Your process looks clean. Keep sizing small, keep writing your reasons down, and let your plan work.", href: "/community", cta: "Try this week's challenge" });
    return tips.slice(0, 3);
  }, [positions, orders, trades, prices, equity]);
}

export default function Dashboard() {
  const profile = useApp((s) => s.profile);
  const cash = useApp((s) => s.cash);
  const positions = useApp((s) => s.positions);
  const orders = useApp((s) => s.orders);
  const trades = useApp((s) => s.trades);
  const equityHistory = useApp((s) => s.equityHistory);
  const cancelOrder = useApp((s) => s.cancelOrder);
  const xp = useApp((s) => s.xp);
  const completed = useApp((s) => s.completedLessons);
  const missions = useApp((s) => s.missions);
  const prices = useMarket((s) => s.prices);
  const intraday = useMarket((s) => s.intraday);
  const prevClose = useMarket((s) => s.prevClose);
  const equity = useEquity();
  const brief = useCoachBrief();
  const lvl = levelFor(xp);

  const pos = Object.values(positions);
  const invested = pos.reduce((a, p) => a + p.qty * (prices[p.symbol] ?? p.avgCost), 0);
  const openPnl = pos.reduce((a, p) => a + p.qty * ((prices[p.symbol] ?? p.avgCost) - p.avgCost), 0);
  const realized = trades.reduce((a, t) => a + (t.realizedPnl ?? 0), 0);
  const entries = trades.filter((t) => t.role === "entry");
  const avgScore = entries.length ? Math.round(entries.reduce((a, t) => a + t.score, 0) / entries.length) : null;
  const openOrders = orders.filter((o) => o.status === "open");
  const latest = trades[0];
  const nextLesson = ALL_LESSONS.find((l) => !completed[l.slug]);
  const spyDay = prices.SPY && prevClose.SPY ? prices.SPY / prevClose.SPY - 1 : 0;
  const chartData = equityHistory.length >= 2 ? [...equityHistory.map((e) => ({ t: e.t, c: e.v })), { t: Date.now(), c: equity }] : [];
  const active = trades.length > 0 || pos.length > 0 || openOrders.length > 0;
  const startSteps = [
    { done: !!missions["first-trade"] || active, label: "Pick a stock", detail: "Any company you know. Open SPY to start with the whole market." },
    { done: !!missions["use-stop"], label: "Set a stop-loss with the quick buttons", detail: "The −3%, −5% and −8% buttons fill the price for you." },
    { done: !!missions["write-thesis"], label: "Write one sentence about why", detail: "Say what you expect and what would prove you wrong." },
  ];
  const showStart = !missions["use-stop"];
  const short = chartData.length >= 2 && chartData[chartData.length - 1].t - chartData[0].t < 5 * 60_000;

  return (
    <div>
      <h1 className="t-title">{profile.name ? `${profile.name}'s practice account` : "Your practice account"}</h1>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {/* account */}
          <section aria-label="Account" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <div className="t-small text-ink-2">Account value</div>
                <AnimatedNumber value={equity} format={(n) => usd(n)} split className="t-readout-xl mt-1 block" />
                {active ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 t-small">
                    <Delta value={equity - STARTING_CASH} />
                    <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} />
                    <span className="text-ink-2">since you started with $100,000</span>
                  </div>
                ) : (
                  <p className="mt-2 t-small text-ink-2">Practice money to start with. Nothing has happened yet.</p>
                )}
              </div>
              <div className="text-right">
                <div className="t-micro text-ink-2">S&amp;P 500 (SPY) today</div>
                <Delta ratio={spyDay} />
              </div>
            </div>
            <p className="mt-2 t-micro text-ink-2" data-testid="sim-results-note">
              Simulated results. Not real trades, and they include a small simulated slippage but no fees or taxes.
            </p>
            {showStart && (
              <section aria-labelledby="start-h" className="mt-6 border-t border-rule-strong pt-4" data-testid="start-here">
                <h2 id="start-h" className="t-h2">Start here</h2>
                <ol className="mt-3 border-t border-rule">
                  {startSteps.map((st, i) => (
                    <li key={st.label} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-x-3 border-b border-rule py-3" data-done={st.done}>
                      <CheckCell state={st.done ? "done" : "todo"} size={24} draw />
                      <div className="min-w-0">
                        <p className={st.done ? "t-small font-medium text-ink-2" : "t-small font-medium"}>
                          <span className="sr-only">{st.done ? "Done: " : `Step ${i + 1}: `}</span>
                          {st.label}
                        </p>
                        <p className="t-micro text-ink-2">{st.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link href="/markets/SPY" className="btn btn-primary mt-4 w-full sm:w-auto">
                  Open SPY
                </Link>
              </section>
            )}
            {active && (
              <>
            <div className="mt-6">
              <PriceChart
                data={chartData}
                height={220}
                baseline={STARTING_CASH}
                baselineLabel="Starting balance $100,000"
                label="Account value over time"
                formatTime={(t) => new Date(t).toLocaleTimeString("en-US", short ? { hour: "numeric", minute: "2-digit", second: "2-digit" } : { hour: "numeric", minute: "2-digit" })}
                formatValue={(v) => usd(v, 0)}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-5">
              {[
                { k: "Cash", node: <span className="tnum">{usd(cash, 0)}</span> },
                { k: "Invested", node: <span className="tnum">{usd(invested, 0)}</span> },
                { k: "Open P&L", node: <Delta value={openPnl} className="text-[18px]" /> },
                { k: "Realized P&L", node: <Delta value={realized} className="text-[18px]" /> },
                { k: "Average score", node: avgScore != null ? <ScoreLoop score={avgScore} size="s" /> : <span className="t-small text-ink-2">None yet</span> },
              ].map((x, i) => (
                <div key={x.k} className={`min-w-0 bg-paper py-3 pr-3 ${i % 2 === 1 ? "pl-3" : ""} sm:pl-3 sm:first:pl-0 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
                  <dt className="t-micro text-ink-2">{x.k}</dt>
                  <dd className="t-wide mt-1 min-h-6 text-[18px] font-medium leading-6">{x.node}</dd>
                </div>
              ))}
            </dl>
              </>
            )}
          </section>

          {/* Nova's notes on phones come right after the account, before the ledger */}
          <section className="lg:hidden" aria-labelledby="notes-h-phone">
            <h2 id="notes-h-phone" className="sr-only">
              Nova&apos;s notes
            </h2>
            <Notes brief={brief} />
          </section>

          {/* positions */}
          <section aria-labelledby="pos-h" className="min-w-0">
            <SectionTitle
              id="pos-h"
              title="Positions"
              action={
                <Link href="/markets" className={showStart ? "btn btn-secondary" : "btn btn-primary"}>
                  Trade
                </Link>
              }
            />
            {pos.length === 0 ? (
              <EmptyLedger cols={["Symbol", "Shares", "Value", "P&L"]} text="No positions yet. Your first buy will be recorded here." action={showStart ? undefined : <Link href="/markets" className="btn btn-secondary">Find a stock</Link>} />
            ) : (
              <table className="w-full t-table">
                <caption className="sr-only">Your open positions</caption>
                <thead>
                  <tr className="border-b border-rule-strong text-left t-micro text-ink-2">
                    <th scope="col" className="py-2 pr-2 font-medium">Symbol</th>
                    <th scope="col" className="hidden py-2 pr-2 font-medium md:table-cell">Today</th>
                    <th scope="col" className="hidden py-2 pr-2 text-right font-medium sm:table-cell">Shares</th>
                    <th scope="col" className="hidden py-2 pr-2 text-right font-medium md:table-cell">Average cost</th>
                    <th scope="col" className="hidden py-2 pr-2 text-right font-medium sm:table-cell">Price</th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">Value</th>
                    <th scope="col" className="py-2 text-right font-medium">P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((p) => {
                    const px = prices[p.symbol] ?? p.avgCost;
                    return (
                      <tr key={p.symbol} className="border-b border-rule align-top hover:bg-well">
                        <td className="py-3 pr-2">
                          <Link href={`/markets/${p.symbol}`} className="font-semibold hover:underline">
                            {p.symbol}
                          </Link>
                          <div className="truncate t-micro text-ink-2">{TICKER_MAP[p.symbol]?.name}</div>
                          <div className="t-micro text-ink-2 sm:hidden">
                            {p.qty} at {usd(p.avgCost)}
                          </div>
                        </td>
                        <td className="hidden py-3 pr-2 md:table-cell">
                          <Sparkline data={(intraday[p.symbol] ?? []).slice(-60).map((b) => b.c)} width={80} height={24} base={prevClose[p.symbol]} />
                        </td>
                        <td className="hidden py-3 pr-2 text-right sm:table-cell">{p.qty}</td>
                        <td className="hidden py-3 pr-2 text-right md:table-cell">{usd(p.avgCost)}</td>
                        <td className="hidden py-3 pr-2 text-right sm:table-cell">{usd(px)}</td>
                        <td className="py-3 pr-2 text-right">{usd(p.qty * px, 0)}</td>
                        <td className="py-3 text-right">
                          <Delta value={p.qty * (px - p.avgCost)} />
                          <div>
                            <Delta ratio={px / p.avgCost - 1} size="xs" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="ledger-total">
                  <tr className="font-semibold">
                    <th scope="row" className="py-2.5 pr-2 text-left">Total</th>
                    <td className="hidden md:table-cell" />
                    <td className="hidden sm:table-cell" />
                    <td className="hidden md:table-cell" />
                    <td className="hidden sm:table-cell" />
                    <td className="py-2.5 pr-2 text-right">{usd(invested, 0)}</td>
                    <td className="py-2.5 text-right">
                      <Delta value={openPnl} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {openOrders.length > 0 && (
              <div className="mt-8">
                <h3 className="t-h3">Open orders</h3>
                <ul className="mt-2 border-t border-rule-strong">
                  {openOrders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule py-2 t-small">
                      <span className="min-w-0">
                        <span className="font-semibold">{o.role === "entry" || o.role === "exit" ? `${o.type === "limit" ? "Limit" : "Stop"} ${o.side}` : o.role === "stop-loss" ? "Stop-loss" : "Take-profit"}</span>{" "}
                        <span className="tnum">
                          {o.side === "buy" ? "Buy" : "Sell"} {o.qty} {o.symbol} at {usd(o.limitPrice ?? o.stopPrice ?? 0)}
                        </span>
                        <span className="tnum ml-3 t-micro text-ink-2">now {usd(prices[o.symbol] ?? 0)}</span>
                      </span>
                      <button onClick={() => cancelOrder(o.id)} className="btn btn-quiet min-h-10 t-small" aria-label={`Cancel ${o.side} order for ${o.qty} ${o.symbol}`}>
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* latest review */}
          <section aria-labelledby="review-h" className="min-w-0">
            <SectionTitle id="review-h" title="Latest review" action={trades.length > 0 ? <Link href="/journal" className="link inline-flex min-h-10 items-center t-small">See journal</Link> : undefined} />
            {latest ? (
              <ReviewCard trade={latest} compact />
            ) : (
              <p className="t-small text-ink-2">Every trade you place gets a process score and notes from Nova on sizing, risk, planning and emotional red flags. Your first review will appear here.</p>
            )}
            {trades.length > 1 && (
              <div className="mt-10">
                <h3 className="t-h3">Recent trades</h3>
                <ul className="mt-2 border-t border-rule-strong">
                  {trades.slice(1, 8).map((t) => {
                    const c = tradeChecks(t);
                    return (
                      <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-rule py-2.5 t-small sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                        <span className="min-w-0 truncate">
                          <span className="font-medium">{t.side === "buy" ? "Buy" : "Sell"}</span> {t.qty} {t.symbol} at <span className="tnum">{usd(t.price)}</span>
                          <span className="ml-2 t-micro text-muted">{timeAgo(t.at)}</span>
                        </span>
                        <span className="hidden sm:block">{c ? <CheckStrip checks={c} size={18} /> : <span className="t-micro text-ink-2">Automatic exit</span>}</span>
                        <span className="hidden sm:block">{t.realizedPnl != null ? <Delta value={t.realizedPnl} size="xs" /> : null}</span>
                        <ScoreLoop score={t.score} size="s" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Nova's margin (desktop) and the quiet right column */}
        <aside className="min-w-0 space-y-12" aria-label="Notes, next lesson and news">
          <section className="hidden lg:block" aria-labelledby="notes-h">
            <h2 id="notes-h" className="t-h2 mb-3">
              Nova&apos;s notes
            </h2>
            <Notes brief={brief} />
          </section>

          <section aria-labelledby="path-h">
            <SectionTitle id="path-h" title="Your course" as="h2" />
            <p className="t-small text-ink-2">
              Level {lvl.level}, {lvl.name}. {Math.max(0, lvl.next - xp)} XP to Level {lvl.level + 1}.
            </p>
            <div className="mt-2 h-0.5 bg-rule" role="progressbar" aria-label="Progress to the next level" aria-valuenow={Math.round(lvl.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-ink" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
            {nextLesson && (
              <Link href={`/learn/${nextLesson.slug}`} className="mt-4 block border-l-2 border-ink py-1 pl-3 hover:bg-well">
                <span className="flex items-baseline justify-between gap-2 t-micro text-ink-2">
                  Up next <span>{nextLesson.minutes} min</span>
                </span>
                <span className="block font-medium">{nextLesson.title}</span>
              </Link>
            )}
            <ul className="mt-4 border-t border-rule">
              {Object.values(MISSIONS)
                .slice(0, 5)
                .map((mi) => (
                  <li key={mi.id} className="flex items-center gap-2 border-b border-rule py-1.5 t-small">
                    <CheckCell state={missions[mi.id] ? "done" : "todo"} size={22} />
                    <span className="sr-only">{missions[mi.id] ? "Done:" : "To do:"}</span>
                    <Link href={mi.href} className={missions[mi.id] ? "flex min-h-10 min-w-0 flex-1 items-center text-ink-2 hover:underline" : "flex min-h-10 min-w-0 flex-1 items-center hover:underline"}>
                      <span className="truncate">{mi.title}</span>
                    </Link>
                    <span className="tnum t-micro text-muted">{mi.xp} XP</span>
                  </li>
                ))}
            </ul>
          </section>

          <section aria-labelledby="news-h">
            <SectionTitle id="news-h" title="Market news" />
            <NewsFeed limit={5} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Notes({ brief }: { brief: { body: string; href: string; cta: string }[] }) {
  return (
    <div className="nova-note">
      <NovaByline disclaimer />
      <ul className="mt-2 space-y-4">
        {brief.map((t, i) => (
          <li key={i}>
            <p className="t-note">{t.body}</p>
            <Link href={t.href} className="link mt-1 inline-flex min-h-10 items-center t-small font-medium">
              {t.cta}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
