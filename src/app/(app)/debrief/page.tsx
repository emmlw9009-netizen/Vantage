"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp, usePlan, type Trade } from "@/store/app";
import { can } from "@/lib/plans";
import { weeklyDebrief } from "@/lib/journal-stats";
import { CHECKS, tradeChecks } from "@/lib/trade-checks";
import { LESSON_MAP } from "@/lib/course";
import { timeAgo, usd } from "@/lib/format";
import { PriceChart } from "@/components/price-chart";
import { Delta, SectionTitle } from "@/components/ui";
import { CheckStrip, NovaByline, ScoreLoop } from "@/components/marks";
import { EmptyLedger } from "@/components/empty-ledger";
import { Paywall, PlanTag } from "@/components/paywall";

const day = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function trend(now: number | null, before: number | null) {
  if (now == null) return "No buys this week, so no average yet.";
  if (before == null) return "No buys in the 7 days before, so there is nothing to compare with yet.";
  const d = now - before;
  if (d === 0) return "The same as the 7 days before.";
  return `${d > 0 ? "Up" : "Down"} ${Math.abs(d)} from ${before} in the 7 days before.`;
}

function Decision({ label, t }: { label: string; t: Trade }) {
  const c = tradeChecks(t);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 border-b border-rule py-3">
      <div className="min-w-0">
        <p className="t-micro text-ink-2">{label}</p>
        <p className="t-small">
          <span className="font-medium">{t.side === "buy" ? "Bought" : "Sold"}</span> {t.qty} {t.symbol} <span className="tnum text-ink-2">at {usd(t.price)}</span>
          <span className="ml-2 t-micro text-muted">{timeAgo(t.at)}</span>
        </p>
        {c && <CheckStrip checks={c} className="mt-1.5" />}
        {t.thesis && <p className="mt-1 break-words t-small text-ink-2 [overflow-wrap:anywhere]">{t.thesis}</p>}
      </div>
      <ScoreLoop score={t.score} size="s" />
    </li>
  );
}

export default function DebriefPage() {
  const plan = usePlan();
  const trades = useApp((s) => s.trades);
  const d = useMemo(() => weeklyDebrief(trades), [trades]);
  const st = d.stats;
  const allowed = can(plan, "weekly-debrief");

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="t-title">Weekly debrief</h1>
        <PlanTag feature="weekly-debrief" />
      </div>
      <p className="mt-2 max-w-[72ch] t-lead">
        Your last 7 days, {day(d.from)} to {day(d.to)}. Worked out in this browser from your journal.
      </p>

      {!allowed ? (
        <div className="mt-10 max-w-[760px]">
          <Paywall gate="debrief" as="h2" secondary={{ label: "Back to the journal", href: "/journal" }} />
        </div>
      ) : st.total === 0 ? (
        <div className="mt-10 max-w-[760px]">
          <EmptyLedger
            cols={["Trade", ...CHECKS.map((c) => c.short), "Score"]}
            text="No trades in the last 7 days. Your debrief fills in as you trade."
            action={
              <Link href="/markets" className="btn btn-primary">
                Place a trade
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-5" data-testid="debrief-stats">
            {[
              { k: "Trades", v: <span data-testid="debrief-trade-count">{st.total}</span> },
              { k: "Buys", v: st.entries },
              { k: "Closed", v: st.closed },
              { k: "Realized P&L", v: <Delta value={st.realized} className="text-[18px]" /> },
              { k: "Average process score", v: st.avgScore != null ? <ScoreLoop score={st.avgScore} size="s" /> : "None yet" },
            ].map((x, i) => (
              <div key={x.k} className={`min-w-0 bg-paper py-3 pr-3 ${i % 2 === 1 ? "pl-3" : ""} sm:pl-3 sm:first:pl-0 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
                <dt className="t-micro text-ink-2">{x.k}</dt>
                <dd className="tnum t-wide mt-1 min-h-6 text-[18px] font-medium leading-6">{x.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 t-micro text-ink-2" data-testid="sim-results-note">
            Simulated results. Not real trades, and they include a small simulated slippage but no fees or taxes.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-12">
              <section aria-labelledby="trend-h" className="min-w-0">
                <SectionTitle id="trend-h" title="Process score this week" />
                <p className="mb-3 t-small text-ink-2" data-testid="debrief-trend">
                  {trend(st.avgScore, d.previousAvgScore)}
                </p>
                <PriceChart data={st.scoreSeries} height={200} yDomain={[0, 100]} baseline={70} baselineLabel="Solid (70)" label="Process score of each buy this week, oldest to newest" seriesLabel="Process score" formatValue={(v) => String(Math.round(v))} formatTime={(t) => new Date(t).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })} />
              </section>

              <section aria-labelledby="top-h" className="min-w-0" data-testid="debrief-mistakes">
                <SectionTitle id="top-h" title="Top mistakes" />
                {st.mistakes.length === 0 ? (
                  <p className="t-small text-ink-2">No mistakes flagged this week.</p>
                ) : (
                  <ul className="border-t border-rule">
                    {st.mistakes.slice(0, 3).map((m) => (
                      <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-rule py-3 t-small">
                        <span className="min-w-0">
                          <span className="font-medium">{m.name}</span>
                          {m.lesson && LESSON_MAP[m.lesson] && (
                            <Link href={`/learn/${m.lesson}`} className="link ml-3">
                              Lesson: {LESSON_MAP[m.lesson].title}
                            </Link>
                          )}
                        </span>
                        <span className="tnum text-ink-2">
                          {m.n} of {st.total} trades
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="dec-h" className="min-w-0">
                <SectionTitle id="dec-h" title="Best and worst decision" />
                <p className="mb-2 t-small text-ink-2">Judged by process score, not by profit: a good decision can still lose money.</p>
                {d.best ? (
                  <ul className="border-t border-rule">
                    <Decision label="Best decision" t={d.best} />
                    {d.worst && <Decision label="Worst decision" t={d.worst} />}
                  </ul>
                ) : (
                  <p className="t-small text-ink-2">Only automatic exits this week, so there is no decision to compare.</p>
                )}
              </section>
            </div>

            <aside className="min-w-0" aria-labelledby="focus-h">
              <h2 id="focus-h" className="t-h2 mb-3">
                Three things to work on
              </h2>
              <div className="nova-note" data-testid="debrief-focus">
                <NovaByline disclaimer />
                {d.focus.length ? (
                  <ol className="mt-2 space-y-3">
                    {d.focus.map((f, i) => (
                      <li key={f.text} className="flex gap-2.5">
                        <span className="tnum t-small font-semibold text-ink-2">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="t-note">{f.text}</p>
                          <p className="t-micro text-ink-2">{f.why}</p>
                          {f.lesson && LESSON_MAP[f.lesson] && (
                            <Link href={`/learn/${f.lesson}`} className="link t-small">
                              Lesson: {LESSON_MAP[f.lesson].title}
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="t-note mt-2">You kept every check this week. Keep doing exactly that.</p>
                )}
                <p className="mt-3 t-micro text-ink-2">Checked with the built-in playbook.</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
