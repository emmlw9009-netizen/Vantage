"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, MessageCircle, Share2, ShieldAlert, Sparkles } from "lucide-react";
import type { Trade } from "@/store/app";
import { useApp } from "@/store/app";
import { scoreLabel, FlagTone } from "@/lib/analysis";
import { LESSON_MAP } from "@/lib/course";
import { cn, timeAgo, usd } from "@/lib/format";
import { ScoreGauge, Pill, Delta } from "./ui";

const TONE: Record<FlagTone, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  good: { icon: CheckCircle2, cls: "bg-good-bg text-up", label: "Good" },
  warn: { icon: AlertTriangle, cls: "bg-warn-bg text-warn", label: "Watch" },
  risk: { icon: ShieldAlert, cls: "bg-risk-bg text-down", label: "Risk" },
};

export function FlagRow({ tone, title, detail, lesson }: { tone: FlagTone; title: string; detail?: string; lesson?: string }) {
  const T = TONE[tone];
  return (
    <div className="flex gap-3">
      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", T.cls)} title={T.label}>
        <T.icon className="size-3.5" aria-label={T.label} />
      </span>
      <div className="min-w-0 text-sm">
        <div className="font-medium">{title}</div>
        {detail && <div className="text-ink-2">{detail}</div>}
        {lesson && LESSON_MAP[lesson] && (
          <Link href={`/learn/${lesson}`} className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-series-1 hover:underline">
            <BookOpen className="size-3" /> {LESSON_MAP[lesson].title}
          </Link>
        )}
      </div>
    </div>
  );
}

export function ReviewCard({ trade, compact = false }: { trade: Trade; compact?: boolean }) {
  const addPost = useApp((s) => s.addPost);
  const [shared, setShared] = useState(false);
  const r = trade.review;

  const share = () => {
    addPost({
      kind: trade.realizedPnl && trade.realizedPnl > 0 ? "win" : trade.realizedPnl && trade.realizedPnl < 0 ? "lesson" : "idea",
      body: `${trade.side === "buy" ? "Bought" : "Sold"} ${trade.qty} ${trade.symbol} @ ${usd(trade.price)}. Coach score ${trade.score} (${scoreLabel(trade.score)}).${trade.thesis ? `\n\nThesis: ${trade.thesis}` : ""}${r ? `\n\nCoach: ${r.headline}` : ""}`,
      symbol: trade.symbol,
      tradeId: trade.id,
    });
    setShared(true);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line p-4 sm:p-5">
        <ScoreGauge score={trade.score} size={76} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink-2">Coach review</span>
            <Pill>{scoreLabel(trade.score)}</Pill>
            {trade.realizedPnl != null && <Delta value={trade.realizedPnl} size="xs" />}
          </div>
          <div className="mt-1 truncate font-semibold">
            {trade.side === "buy" ? "Bought" : "Sold"} {trade.qty} {trade.symbol} @ {usd(trade.price)}
            {trade.role !== "entry" && trade.role !== "exit" && <span className="font-normal text-muted"> · {trade.role}</span>}
          </div>
          <div className="text-xs text-muted">{timeAgo(trade.at)}</div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {trade.reviewStatus === "pending" && (
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <Sparkles className="size-4 animate-pulse text-coach" /> Nova is reviewing your trade…
          </div>
        )}
        {r && (
          <div className="border-l-[3px] border-coach pl-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-coach">
              <Sparkles className="size-3.5" /> {r.source === "ai" ? "Nova, AI coach" : "Nova, rules engine"}
            </div>
            <div className="font-display text-lg font-semibold leading-snug">{r.headline}</div>
            <p className="mt-1.5 font-serif text-[17px] leading-relaxed text-ink">{r.summary}</p>
            {!compact && (r.didWell.length > 0 || r.improve.length > 0) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {r.didWell.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-sm font-semibold">Did well</h4>
                    <ul className="space-y-1.5 text-sm">
                      {r.didWell.map((x, i) => (
                        <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" aria-hidden />{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.improve.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-sm font-semibold">Improve</h4>
                    <ul className="space-y-1.5 text-sm">
                      {r.improve.map((x, i) => (
                        <li key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <p className="mt-4 text-sm">
              <span className="font-semibold">Next step: </span>
              {r.nextStep}
            </p>
          </div>
        )}
        {!compact && (
          <div className="space-y-3">
            {trade.flags.map((f) => (
              <FlagRow key={f.id} {...f} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/coach?trade=${trade.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium hover:bg-panel-2">
            <MessageCircle className="size-4" /> Ask Nova about this
          </Link>
          <button onClick={share} disabled={shared} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-60">
            <Share2 className="size-4" /> {shared ? "Shared to community" : "Share to community"}
          </button>
        </div>
      </div>
    </div>
  );
}
