"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp, usePlan } from "@/store/app";
import { can } from "@/lib/plans";
import { downloadTradesCsv } from "@/lib/data-controls";
import { useToast } from "@/store/toast";
import { Paywall, PaywallDialog, PlanTag } from "@/components/paywall";
import { journalStats } from "@/lib/journal-stats";
import { CHECKS, isAutoExit, tradeChecks } from "@/lib/trade-checks";
import { LESSON_MAP } from "@/lib/course";
import { pct, timeAgo, usd } from "@/lib/format";
import { PriceChart } from "@/components/price-chart";
import { Delta, Segmented, SectionTitle, TabPanel } from "@/components/ui";
import { CheckCell, CheckStrip, MarkGlyph, NovaByline, ScoreLoop } from "@/components/marks";
import { EmptyLedger } from "@/components/empty-ledger";

type Filter = "all" | "buys" | "sells" | "auto";

export default function JournalPage() {
  const trades = useApp((s) => s.trades);
  const st = useMemo(() => journalStats(trades), [trades]);
  const [filter, setFilter] = useState<Filter>("all");
  const plan = usePlan();
  const insights = can(plan, "journal-insights");
  const [csvPaywall, setCsvPaywall] = useState(false);
  const exportCsv = () => {
    if (!can(plan, "csv-export")) return setCsvPaywall(true);
    downloadTradesCsv(trades);
    useToast.getState().push({ title: "Trades exported", body: `A CSV file with ${trades.length} simulated ${trades.length === 1 ? "trade" : "trades"} was downloaded.`, tone: "good" });
  };
  const record = trades.filter((t) => !isAutoExit(t)).slice(0, 30);
  const history = trades.filter((t) => (filter === "all" ? true : filter === "buys" ? t.side === "buy" && !isAutoExit(t) : filter === "sells" ? t.side === "sell" && !isAutoExit(t) : isAutoExit(t)));
  const maxMistake = st.mistakes[0]?.n ?? 1;

  return (
    <div>
      <h1 className="t-title">Journal</h1>
      <p className="mt-2 max-w-[72ch] t-lead">Every trade you place, checked and filed. The empty columns show the habit to work on.</p>
      <p className="mt-3 flex flex-wrap items-center gap-2 t-small">
        <Link href="/debrief" className="link inline-flex min-h-10 items-center">
          Weekly debrief
        </Link>
        {!can(plan, "weekly-debrief") && <PlanTag feature="weekly-debrief" />}
      </p>

      {trades.length === 0 ? (
        <div className="mt-10 max-w-[760px]">
          <EmptyLedger
            cols={["Trade", ...CHECKS.map((c) => c.short), "Score"]}
            text="Your record starts with your first trade. Every trade you place is checked and filed here."
            action={
              <Link href="/markets" className="btn btn-primary">
                Place your first trade
              </Link>
            }
          />
          <p className="sr-only">
            Trades: <span data-testid="journal-trade-count">0</span>
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-5">
            {[
              { k: "Trades", v: <span data-testid="journal-trade-count">{st.total}</span> },
              { k: "Closed", v: st.closed },
              { k: "Win rate", v: st.winRate != null ? pct(st.winRate, 0, false) : "None yet" },
              { k: "Realized P&L", v: <Delta value={st.realized} className="text-[18px]" /> },
              { k: "Average process score", v: st.avgScore != null ? <ScoreLoop score={st.avgScore} size="s" /> : "None yet" },
            ].map((x, i) => (
              <div key={x.k} className={`min-w-0 bg-paper py-3 pr-3 ${i % 2 === 1 ? "pl-3" : ""} sm:pl-3 sm:first:pl-0 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
                <dt className="t-micro text-ink-2">{x.k}</dt>
                <dd className="tnum t-wide mt-1 min-h-6 text-[18px] font-medium leading-6">{x.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 t-micro text-ink-2">Simulated results. Not real trades, and they include a small simulated slippage but no fees or taxes.</p>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-labelledby="record-h" className="min-w-0">
              <SectionTitle id="record-h" title="Check record" action={<span className="t-small text-ink-2">Latest {record.length}</span>} />
              {/* relative: makes the scroller the containing block, so the cells' sr-only text is clipped with the table */}
              {/* phones: one block per trade, no horizontal scrolling (spec 8.2, 12.9) */}
              <div className="sm:hidden" data-testid="record-phone">
                <ul className="border-t border-rule-strong">
                  {record.map((t) => {
                    const c = tradeChecks(t)!;
                    return (
                      <li key={t.id} className="border-b border-rule py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="t-small">
                              <span className="font-medium">{t.side === "buy" ? "Buy" : "Sell"}</span> {t.qty} {t.symbol} <span className="tnum text-ink-2">at {usd(t.price)}</span>
                            </p>
                            <p className="t-micro text-muted">{timeAgo(t.at)}</p>
                          </div>
                          <ScoreLoop score={t.score} size="s" />
                        </div>
                        <CheckStrip checks={c} labeled size={24} className="mt-2" />
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3">
                  <p className="t-micro font-semibold">Checks kept</p>
                  <div className="mt-1 flex gap-2">
                    {CHECKS.map((k) => (
                      <span key={k.id} className="flex min-w-0 flex-col items-center">
                        <span className="tnum t-micro font-semibold">{st.kept[k.id].done}/{st.kept[k.id].total}</span>
                        <span className="t-micro text-ink-2">{k.short}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[520px] t-table">
                  <caption className="sr-only">The five pre-flight checks for each of your trades, newest first</caption>
                  <thead>
                    <tr className="border-b border-rule-strong t-micro text-ink-2">
                      <th scope="col" className="py-2 pr-3 text-left font-medium">Trade</th>
                      {CHECKS.map((c) => (
                        <th key={c.id} scope="col" className="w-12 py-2 text-center font-medium">
                          {c.short}
                        </th>
                      ))}
                      <th scope="col" className="w-16 py-2 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.map((t) => {
                      const c = tradeChecks(t)!;
                      return (
                        <tr key={t.id} className="border-b border-rule hover:bg-well">
                          <th scope="row" className="py-2 pr-3 text-left font-normal">
                            <span className="font-medium">{t.side === "buy" ? "Buy" : "Sell"}</span> {t.qty} {t.symbol} <span className="tnum text-ink-2">at {usd(t.price)}</span>
                            <span className="block t-micro text-muted">{timeAgo(t.at)}</span>
                          </th>
                          {CHECKS.map((k) => (
                            <td key={k.id} className="py-2 text-center">
                              <span className="inline-flex justify-center" data-cell={c[k.id]}>
                                <CheckCell state={c[k.id]} size={24} />
                              </span>
                              <span className="sr-only">
                                {k.label}: {c[k.id] === "done" ? "kept" : c[k.id] === "na" ? "not needed" : "missed"}
                              </span>
                            </td>
                          ))}
                          <td className="py-2 text-right">
                            <ScoreLoop score={t.score} size="s" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="ledger-total">
                    <tr>
                      <th scope="row" className="py-2.5 pr-3 text-left font-semibold">
                        Checks kept
                      </th>
                      {CHECKS.map((k) => (
                        <td key={k.id} className="tnum py-2.5 text-center font-semibold">
                          {st.kept[k.id].done}/{st.kept[k.id].total}
                        </td>
                      ))}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <aside className="min-w-0" aria-labelledby="patterns-h">
              <h2 id="patterns-h" className="t-h2 mb-3">
                Patterns Nova sees
              </h2>
              {!insights ? (
                <Paywall gate="patterns" compact />
              ) : (
              <div className="nova-note">
                <NovaByline disclaimer />
                {st.patterns.length ? (
                  <ul className="mt-2 space-y-3">
                    {st.patterns.map((p, i) => (
                      <li key={i} className="flex gap-2.5">
                        <MarkGlyph kind={p.kind} className="mt-1" />
                        <div className="min-w-0">
                          <p className="t-note">{p.text}</p>
                          {p.lesson && LESSON_MAP[p.lesson] && (
                            <Link href={`/learn/${p.lesson}`} className="link t-small">
                              Lesson: {LESSON_MAP[p.lesson].title}
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="t-note mt-2">No repeated mistakes yet. Keep writing your reasons down and setting stops, and this stays empty.</p>
                )}
              </div>
              )}
            </aside>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
            <section aria-labelledby="trend-h" className="min-w-0">
              <SectionTitle id="trend-h" title="Process score over time" />
              <PriceChart data={st.scoreSeries} height={200} yDomain={[0, 100]} baseline={70} baselineLabel="Solid (70)" label="Process score of each buy, oldest to newest" seriesLabel="Process score" formatValue={(v) => String(Math.round(v))} formatTime={(t) => new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} />
            </section>
            <section aria-labelledby="mistakes-h" className="min-w-0" data-testid="mistakes">
              <SectionTitle id="mistakes-h" title="Most common mistakes" />
              {!insights ? (
                <>
                  {/* preview: the chart's real categories, with plain well blocks instead of bars and no counts (no blur) */}
                  {st.mistakes.length > 0 && (
                    <ul className="mb-4 space-y-2.5" aria-label="Preview of the chart. Counts are part of Premium." data-testid="mistakes-preview">
                      {st.mistakes.slice(0, 4).map((m) => (
                        <li key={m.id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 t-small">
                          <span className="truncate">{m.name}</span>
                          <span className="block h-4 w-3/4 rounded-r-[4px] bg-well" aria-hidden />
                        </li>
                      ))}
                    </ul>
                  )}
                  <Paywall gate="mistakes" />
                </>
              ) : st.mistakes.length === 0 ? (
                <p className="t-small text-ink-2">No mistakes flagged yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {st.mistakes.slice(0, 6).map((m) => (
                    <li key={m.id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 t-small" title={`${m.name}: ${m.n} of ${st.total} trades`}>
                      <span className="truncate">{m.name}</span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-4 rounded-r-[4px] bg-series-1" style={{ width: `${Math.max(4, (m.n / maxMistake) * 70)}%` }} aria-hidden />
                        <span className="tnum shrink-0 t-micro text-ink-2">
                          {m.n} of {st.total}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="history-h" className="mt-12 min-w-0">
            <SectionTitle
              id="history-h"
              title="Trade history"
              action={
                <span className="flex items-center gap-2">
                  {!can(plan, "csv-export") && <PlanTag feature="csv-export" />}
                  <button onClick={exportCsv} className="btn btn-secondary" aria-haspopup={can(plan, "csv-export") ? undefined : "dialog"}>
                    Export CSV
                  </button>
                </span>
              }
            />
            {csvPaywall && <PaywallDialog gate="csv" onClose={() => setCsvPaywall(false)} />}
            <Segmented kind="tabs" idBase="history" label="Filter trades" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "buys", label: "Buys" }, { value: "sells", label: "Sells" }, { value: "auto", label: "Automatic exits" }]} />
            <TabPanel idBase="history" value={filter}>
            <ul className="mt-2">
              {history.map((t) => {
                const c = tradeChecks(t);
                return (
                  <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-rule py-3 t-small md:grid-cols-[10rem_minmax(0,1fr)_auto_auto]">
                    <span className="tnum t-micro text-ink-2 md:t-small">{new Date(t.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <span className="font-medium">{t.side === "buy" ? "Bought" : "Sold"}</span> {t.qty} {t.symbol} at <span className="tnum">{usd(t.price)}</span>
                      {isAutoExit(t) && <span className="tag ml-2">{t.role === "stop-loss" ? "Stop-loss" : "Take-profit"}</span>}
                      {t.thesis && <span className="mt-0.5 block break-words text-ink-2 [overflow-wrap:anywhere]">{t.thesis}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      {c && <CheckStrip checks={c} size={18} />}
                      {t.realizedPnl != null && <Delta value={t.realizedPnl} size="xs" />}
                    </span>
                    <ScoreLoop score={t.score} size="s" />
                  </li>
                );
              })}
              {history.length === 0 && <li className="py-4 t-small text-ink-2">No trades of this kind yet.</li>}
            </ul>
            </TabPanel>
          </section>
        </>
      )}
    </div>
  );
}
