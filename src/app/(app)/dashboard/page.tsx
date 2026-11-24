"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { useApp, useEquity, STARTING_CASH } from "@/store/app";
import { useMarket } from "@/store/market";
import { PriceChart, Sparkline } from "@/components/price-chart";
import { Delta, LivePrice, SectionTitle } from "@/components/ui";
import { ReviewCard } from "@/components/review-card";
import { NewsFeed } from "@/components/news-feed";
import { ALL_LESSONS, MISSIONS, levelFor } from "@/lib/course";
import { TICKER_MAP } from "@/lib/market-data";
import { pct, usd } from "@/lib/format";

function useCoachBrief() {
  const positions = useApp((s) => s.positions);
  const orders = useApp((s) => s.orders);
  const trades = useApp((s) => s.trades);
  const prices = useMarket((s) => s.prices);
  const equity = useEquity();
  return useMemo(() => {
    const tips: { title: string; body: string; href: string; cta: string }[] = [];
    const pos = Object.values(positions);
    if (!trades.length) tips.push({ title: "Make your first trade", body: "Pick a company you know, write one sentence on why, and set a stop. I'll review it the moment it fills.", href: "/markets/AAPL", cta: "Open AAPL" });
    const unprotected = pos.filter((p) => !orders.some((o) => o.status === "open" && o.symbol === p.symbol && o.role === "stop-loss"));
    if (unprotected.length) tips.push({ title: `${unprotected.map((p) => p.symbol).join(", ")} ${unprotected.length > 1 ? "have" : "has"} no stop-loss`, body: "Decide now where you'd admit you're wrong. Future-you will thank you.", href: `/markets/${unprotected[0].symbol}`, cta: "Add a plan" });
    const big = pos.map((p) => ({ p, w: (p.qty * (prices[p.symbol] ?? p.avgCost)) / equity })).filter((x) => x.w > 0.25);
    if (big.length) tips.push({ title: `${big[0].p.symbol} is ${pct(big[0].w, 0, false)} of your account`, body: "That's concentrated. Consider trimming so one headline can't sink your month.", href: "/learn/position-sizing", cta: "Position sizing" });
    const sectors = new Set(pos.map((p) => TICKER_MAP[p.symbol]?.sector));
    if (pos.length >= 2 && sectors.size === 1) tips.push({ title: "All your positions are in one sector", body: "They'll likely move together. Diversifying smooths the ride.", href: "/learn/diversification", cta: "Diversification" });
    const lowScores = trades.filter((t) => t.role === "entry").slice(0, 5);
    if (lowScores.length >= 3) {
      const avg = lowScores.reduce((a, t) => a + t.score, 0) / lowScores.length;
      if (avg < 65) tips.push({ title: `Your last ${lowScores.length} trades averaged ${Math.round(avg)}`, body: "The pattern is fixable. Ask me to walk through them with you.", href: "/coach", cta: "Talk to Nova" });
    }
    if (!tips.length) tips.push({ title: "Your process looks clean", body: "Keep sizing small, keep journaling, and let your plan work. Want a challenge? Try the Risk-Adjusted Week in Community.", href: "/community", cta: "See challenges" });
    return tips;
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
  const hour = new Date().getHours();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{profile.name ? `${profile.name}'s portfolio` : "Your portfolio"}</h1>
        </div>
        <Link href="/markets" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink hover:brightness-95">
          Trade <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">Total value</div>
              <LivePrice value={equity} format={(n) => usd(n)} className="text-4xl font-semibold tracking-tight sm:text-5xl" />
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Delta value={equity - STARTING_CASH} />
                <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} />
                <span className="text-muted">since you started</span>
              </div>
              <p className="mt-1 text-xs text-muted" data-testid="sim-results-note">Simulated results. Not real trades, and they don&apos;t include fees or slippage.</p>
            </div>
            <div className="rounded-2xl bg-panel-2 px-3 py-2 text-right text-xs">
              <div className="text-muted">S&P 500 (SPY) today</div>
              <Delta ratio={spyDay} />
            </div>
          </div>
          <div className="mt-4">
            {chartData.length >= 2 ? (
              <PriceChart data={chartData} height={240} baseline={STARTING_CASH} baselineLabel="Starting balance $100k" label="Account value over time" formatTime={(t) => new Date(t).toLocaleTimeString("en-US", chartData[chartData.length - 1].t - chartData[0].t < 30 * 60_000 ? { hour: "numeric", minute: "2-digit", second: "2-digit" } : { hour: "numeric", minute: "2-digit" })} formatValue={(v) => usd(v, 0)} />
            ) : (
              <div className="grid h-[240px] place-items-center rounded-2xl border border-dashed border-line text-sm text-muted">Your account chart builds as the market moves.</div>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Cash", v: usd(cash, 0) },
              { k: "Invested", v: usd(invested, 0) },
              { k: "Open P&L", node: <Delta value={openPnl} /> },
              { k: "Realized P&L", node: <Delta value={realized} /> },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-panel-2 px-3 py-2.5">
                <dt className="text-xs text-muted">{x.k}</dt>
                <dd className="tnum mt-0.5 font-semibold">{x.node ?? x.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-7 place-items-center rounded-full bg-coach text-coach-ink"><Sparkles className="size-3.5" /></span>
            Coach Nova&apos;s brief
          </div>
          <div className="flex-1 space-y-3">
            {brief.slice(0, 3).map((t, i) => (
              <div key={i} className="rounded-2xl border border-line bg-panel/70 p-3.5">
                <div className="font-medium">{t.title}</div>
                <p className="mt-0.5 text-sm text-ink-2">{t.body}</p>
                <Link href={t.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-series-1 hover:underline">
                  {t.cta} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-panel-2 px-3 py-2.5 text-sm">
            <span className="text-muted">Avg coach score</span>
            <span className="tnum font-semibold">{avgScore ?? "—"}</span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <SectionTitle title="Positions" action={<Link href="/markets" className="text-sm text-muted hover:text-ink">Browse markets</Link>} />
          {pos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
              No positions yet. <Link href="/markets/SPY" className="font-medium text-series-1 hover:underline">Start with SPY</Link>, the whole market in one trade.
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-2 pb-2 font-medium">Symbol</th>
                    <th className="px-2 pb-2 font-medium">Today</th>
                    <th className="px-2 pb-2 text-right font-medium">Shares</th>
                    <th className="px-2 pb-2 text-right font-medium">Avg cost</th>
                    <th className="px-2 pb-2 text-right font-medium">Price</th>
                    <th className="px-2 pb-2 text-right font-medium">Value</th>
                    <th className="px-2 pb-2 text-right font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {pos.map((p) => {
                    const px = prices[p.symbol] ?? p.avgCost;
                    return (
                      <tr key={p.symbol} className="border-t border-line">
                        <td className="px-2 py-2.5">
                          <Link href={`/markets/${p.symbol}`} className="font-semibold hover:underline">{p.symbol}</Link>
                          <div className="text-xs text-muted">{TICKER_MAP[p.symbol]?.name}</div>
                        </td>
                        <td className="px-2 py-2.5"><Sparkline data={(intraday[p.symbol] ?? []).slice(-60).map((b) => b.c)} width={80} height={28} /></td>
                        <td className="px-2 py-2.5 text-right">{p.qty}</td>
                        <td className="px-2 py-2.5 text-right">{usd(p.avgCost)}</td>
                        <td className="px-2 py-2.5 text-right"><LivePrice value={px} format={(n) => usd(n)} /></td>
                        <td className="px-2 py-2.5 text-right">{usd(p.qty * px, 0)}</td>
                        <td className="px-2 py-2.5 text-right">
                          <Delta value={p.qty * (px - p.avgCost)} />
                          <div><Delta ratio={px / p.avgCost - 1} size="xs" /></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {openOrders.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Open orders</h3>
              <ul className="space-y-2">
                {openOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-panel-2 px-3 py-2 text-sm">
                    <span>
                      <span className="font-semibold capitalize">{o.role === "entry" || o.role === "exit" ? `${o.type} ${o.side}` : o.role.replace("-", " ")}</span>{" "}
                      {o.qty} {o.symbol} @ <span className="tnum">{usd(o.limitPrice ?? o.stopPrice ?? 0)}</span>
                      <span className="ml-2 text-xs text-muted">now {usd(prices[o.symbol] ?? 0)}</span>
                    </span>
                    <button onClick={() => cancelOrder(o.id)} className="rounded-full p-1.5 text-muted hover:bg-panel hover:text-ink" aria-label="Cancel order"><X className="size-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="card p-5">
            <SectionTitle title="Your path" action={<span className="text-xs text-muted">Lv {lvl.level} · {xp} XP</span>} />
            <div className="h-2 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-valuenow={Math.round(lvl.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-accent" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted">{lvl.name} · {Math.max(0, lvl.next - xp)} XP to next level</div>
            {nextLesson && (
              <Link href={`/learn/${nextLesson.slug}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3 hover:bg-panel-2">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft"><BookOpen className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">Up next · {nextLesson.minutes} min</span>
                  <span className="block truncate font-medium">{nextLesson.title}</span>
                </span>
                <ArrowRight className="size-4 text-muted" />
              </Link>
            )}
            <ul className="mt-4 space-y-2 text-sm">
              {Object.values(MISSIONS).slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  {missions[m.id] ? <CheckCircle2 className="size-4 text-up" aria-label="Done" /> : <Circle className="size-4 text-muted" aria-label="Not done" />}
                  <Link href={m.href} className={missions[m.id] ? "text-muted line-through" : "hover:underline"}>{m.title}</Link>
                  <span className="ml-auto text-xs text-muted">+{m.xp}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {latest ? (
            <>
              <SectionTitle title="Latest trade review" />
              <ReviewCard trade={latest} />
            </>
          ) : (
            <div className="card p-6">
              <SectionTitle title="Trade reviews" />
              <p className="text-sm text-ink-2">Every trade you make gets a coach score and feedback on your process: sizing, risk, planning and emotional red flags. It shows up here.</p>
            </div>
          )}
          {trades.length > 1 && (
            <div className="card mt-4 p-5">
              <SectionTitle title="Trade journal" />
              <ul className="divide-y divide-line text-sm">
                {trades.slice(1, 12).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className="tnum w-8 text-center font-semibold">{t.score}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium capitalize">{t.side}</span> {t.qty} {t.symbol} @ {usd(t.price)}
                      {t.role !== "entry" && t.role !== "exit" && <span className="text-muted"> · {t.role}</span>}
                      {t.thesis && <span className="text-muted"> — {t.thesis}</span>}
                    </span>
                    {t.realizedPnl != null && <Delta value={t.realizedPnl} size="xs" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="card p-5">
          <SectionTitle title="Market news" />
          <NewsFeed limit={7} />
        </section>
      </div>
    </div>
  );
}
