"use client";

import Link from "next/link";
import { useState } from "react";
import type { Trade } from "@/store/app";
import { useApp } from "@/store/app";
import { scoreLabel, FlagTone } from "@/lib/analysis";
import { LESSON_MAP } from "@/lib/course";
import { cn, timeAgo, usd } from "@/lib/format";
import { tradeChecks } from "@/lib/trade-checks";
import { Delta } from "./ui";
import { track } from "@/lib/track";
import { useToast } from "@/store/toast";
import { shareScorePath } from "@/lib/share-score";
import { CheckStrip, MARK_WORD, MarkGlyph, NovaByline, ScoreLoop } from "./marks";

const ROLE_WORD: Record<string, string> = { "stop-loss": "Stop-loss exit", "take-profit": "Take-profit exit" };
const ORDER: Record<FlagTone, number> = { risk: 0, warn: 1, good: 2 };

/** One of Nova's marks with its finding and, when there is one, the lesson that fixes it. */
export function FlagRow({ tone, title, detail, lesson }: { tone: FlagTone; title: string; detail?: string; lesson?: string }) {
  return (
    <li className="flex gap-3">
      <MarkGlyph kind={tone} className="mt-0.5" />
      <div className="min-w-0 t-small">
        <span className="sr-only">{MARK_WORD[tone]}: </span>
        <span className="font-medium text-ink">{title}</span>
        {detail && <span className="block text-ink-2">{detail}</span>}
        {lesson && LESSON_MAP[lesson] && (
          <Link href={`/learn/${lesson}`} className="link mt-0.5 inline-block t-small text-ink">
            Lesson: {LESSON_MAP[lesson].title}
          </Link>
        )}
      </div>
    </li>
  );
}

/** The marked ticket: the trade line, its five checks, the score loop, then Nova's notes in the margin. */
export function ReviewCard({ trade, compact = false, headingLevel = "h3" }: { trade: Trade; compact?: boolean; headingLevel?: "h2" | "h3" }) {
  const addPost = useApp((s) => s.addPost);
  const [shared, setShared] = useState(false);
  const r = trade.review;
  const checks = tradeChecks(trade);
  const H = headingLevel;

  const share = () => {
    addPost({
      kind: trade.realizedPnl && trade.realizedPnl > 0 ? "win" : trade.realizedPnl && trade.realizedPnl < 0 ? "lesson" : "idea",
      body: `${trade.side === "buy" ? "Bought" : "Sold"} ${trade.qty} ${trade.symbol} at ${usd(trade.price)}. Process score ${trade.score} (${scoreLabel(trade.score)}). Simulated trade, practice money.${trade.thesis ? `\n\nThesis: ${trade.thesis}` : ""}${r ? `\n\nCoach: ${r.headline}` : ""}`,
      symbol: trade.symbol,
      tradeId: trade.id,
    });
    setShared(true);
  };

  const push = useToast((s) => s.push);
  const shareScore = async () => {
    const url = `${location.origin}${shareScorePath({ score: trade.score, label: scoreLabel(trade.score), symbol: trade.symbol, side: trade.side })}`;
    track("ShareScore", { score: trade.score, label: scoreLabel(trade.score), symbol: trade.symbol, side: trade.side });
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "My Vantage process score", text: "Simulated trade. Educational only, not investment advice.", url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      push({ title: "Link copied", body: "Paste it anywhere to share your score card.", tone: "good" });
    } catch {
      push({ title: "Couldn't copy the link", body: url, tone: "warn" });
    }
  };

  const flags = [...trade.flags].sort((a, b) => ORDER[a.tone] - ORDER[b.tone]);

  return (
    <article className="border-t border-rule-strong pt-4" aria-label={`Coach review of ${trade.side === "buy" ? "buying" : "selling"} ${trade.qty} ${trade.symbol}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 t-small text-ink-2">
            <span className="font-medium">Coach review</span>
            <span className="t-micro text-muted">{timeAgo(trade.at)}</span>
          </div>
          <H className="mt-1 t-h3">
            {trade.side === "buy" ? "Bought" : "Sold"} {trade.qty} {trade.symbol} at <span className="tnum">{usd(trade.price)}</span>
          </H>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 t-small text-ink-2">
            {ROLE_WORD[trade.role] && <span>{ROLE_WORD[trade.role]}</span>}
            {trade.realizedPnl != null && (
              <span className="inline-flex items-center gap-1.5">
                Realized <Delta value={trade.realizedPnl} />
              </span>
            )}
          </div>
          {checks && <CheckStrip checks={checks} labeled size={24} className="mt-3" />}
        </div>
        <ScoreLoop score={trade.score} size="m" draw={trade.reviewStatus === "done" && Date.now() - trade.at < 20_000} />
      </div>

      <div className="nova-note mt-5">
        <NovaByline disclaimer extra={r?.source === "rules" ? <span className="t-micro text-ink-2">Checked with the built-in playbook</span> : undefined} />
        {trade.reviewStatus === "pending" && <p className="mt-2 t-small text-ink-2">Nova is reviewing this trade.</p>}
        {r && (
          <div className="mt-2">
            <p className="t-h3">{r.headline}</p>
            <p className="t-note mt-1 max-w-[66ch] text-ink">{r.summary}</p>
            {!compact && (r.didWell.length > 0 || r.improve.length > 0) && (
              <ul className="mt-3 space-y-2">
                {r.improve.map((x, i) => (
                  <li key={`i${i}`} className="flex gap-3 t-small">
                    <MarkGlyph kind="warn" className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="sr-only">Watch: </span>
                      {x}
                    </span>
                  </li>
                ))}
                {r.didWell.map((x, i) => (
                  <li key={`d${i}`} className="flex gap-3 t-small">
                    <MarkGlyph kind="good" className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="sr-only">Good: </span>
                      {x}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!compact && flags.length > 0 && (
          <ul className="mt-4 space-y-3">
            {flags.map((f) => (
              <FlagRow key={f.id} {...f} />
            ))}
          </ul>
        )}
        {r && (
          <p className="mt-4 t-small">
            <span className="font-semibold">Next: </span>
            {r.nextStep}
          </p>
        )}
      </div>

      <div className={cn("mt-5 flex flex-wrap gap-2", compact && "mt-4")}>
        <Link href={`/coach?trade=${trade.id}`} className="btn btn-secondary">
          Ask Nova about this
        </Link>
        <button onClick={share} disabled={shared} className="btn btn-secondary">
          {shared ? "Shared to community" : "Share to community"}
        </button>
        <button onClick={shareScore} className="btn btn-secondary">
          Share score
        </button>
      </div>
    </article>
  );
}
