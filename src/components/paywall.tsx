"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { FREE_COACH_PER_DAY, FREE_TRADES_PER_DAY, PLANS, requiredPlan, type Feature } from "@/lib/plans";
import { cn } from "@/lib/format";
import { Dialog } from "./dialog";
import { Tag } from "./marks";

/**
 * Honest paywalls (docs/design/direction.md §8.12, plan Task 10). A ruled band that replaces only the locked content,
 * never the page: the plan tag, what is locked, what the plan includes, one primary "See plans" and a way back.
 * No lock icons, no blur, no countdowns, no urgency and no guilt-trip copy. verify scans every [data-paywall] for
 * confirmshaming phrases.
 */
export type Gate = "trades" | "lesson" | "tools" | "ma" | "mistakes" | "patterns" | "challenges" | "coach" | "csv" | "debrief" | "learning-plan";

const GATES: Record<Gate, { feature: Feature; title: string; body: string }> = {
  trades: {
    feature: "unlimited-trades",
    title: `You've placed today's ${FREE_TRADES_PER_DAY} free trades`,
    body: "New buys pause until midnight. Selling to close a position still works, and stop-loss and take-profit exits always run.",
  },
  lesson: {
    feature: "all-lessons",
    title: "The rest of this lesson is part of Premium",
    body: "You've read the first section. The full lesson, its quiz and its practice mission come with Premium.",
  },
  tools: {
    feature: "lesson-tools",
    title: "The interactive tools are part of Premium",
    body: "This lesson, its quiz and its practice mission stay free. The interactive tool that goes with it comes with Premium.",
  },
  ma: {
    feature: "ma-overlay",
    title: "The 50-day average overlay is part of Premium",
    body: "Premium draws the 50-day average on the price chart. Today's 50-day average is still listed under About.",
  },
  mistakes: {
    feature: "journal-insights",
    title: "Most common mistakes is part of Premium",
    body: "Premium counts each mistake across your trades and links the lesson that fixes it.",
  },
  patterns: {
    feature: "journal-insights",
    title: "Patterns Nova sees is part of Premium",
    body: "Premium shows the habits Nova finds across your trades, such as stops you skip.",
  },
  challenges: {
    feature: "challenges",
    title: "Joining challenges is part of Premium",
    body: "You can read every challenge on Free. Joining one comes with Premium. These are sample challenges until accounts launch.",
  },
  coach: {
    feature: "unlimited-coach",
    title: `You've sent today's ${FREE_COACH_PER_DAY} free messages`,
    body: "Nova answers again after midnight, and your conversation is saved.",
  },
  csv: {
    feature: "csv-export",
    title: "CSV export is part of Premium",
    body: "Premium downloads your trades as a CSV file for a spreadsheet. Export my data in Settings stays free on every plan.",
  },
  debrief: {
    feature: "weekly-debrief",
    title: "The weekly debrief is part of Elite",
    body: "It sums up your last 7 days: trades, score trend, top mistakes, your best and worst decision, and three things to work on.",
  },
  "learning-plan": {
    feature: "learning-plan",
    title: "The personal learning plan is part of Elite",
    body: "Elite orders lessons and missions around the mistakes you make most often.",
  },
};

export function gateCopy(gate: Gate) {
  const g = GATES[gate];
  const plan = PLANS[requiredPlan(g.feature)];
  return { ...g, plan };
}

type Secondary = { label: string; href: string } | { label: string; onClick: () => void };

/** Inline paywall band. `compact` is the quiet margin version: no primary button, a plain "See plans" link. */
export function Paywall({ gate, secondary, compact = false, as: As = "h3", note, className }: { gate: Gate; secondary?: Secondary; compact?: boolean; as?: "h2" | "h3"; note?: React.ReactNode; className?: string }) {
  const id = useId();
  const [collapsed, setCollapsed] = useState(false);
  const { title, body, plan } = gateCopy(gate);

  if (collapsed)
    return (
      <p data-paywall={gate} data-collapsed className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-rule py-3 t-small text-ink-2", className)}>
        <Tag kind="plan">{plan.name}</Tag>
        <span className="min-w-0">{title}.</span>
        <Link href="/upgrade" className="link">
          See plans
        </Link>
      </p>
    );

  if (compact)
    return (
      <section data-paywall={gate} aria-labelledby={id} className={cn("border-y border-rule py-3", className)}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Tag kind="plan">{plan.name}</Tag>
          <As id={id} className="t-small font-semibold">
            {title}
          </As>
        </div>
        <p className="mt-1 t-small text-ink-2">{body}</p>
        <Link href="/upgrade" className="link mt-1 inline-flex min-h-10 items-center t-small">
          See plans
        </Link>
      </section>
    );

  return (
    <section data-paywall={gate} aria-labelledby={id} className={cn("border-y border-rule-strong py-4", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Tag kind="plan">{plan.name}</Tag>
        <As id={id} className="t-h3 min-w-0">
          {title}
        </As>
      </div>
      <p className="mt-2 max-w-[66ch] t-small text-ink-2">
        {body} {plan.summary}
      </p>
      {note && <p className="mt-2 max-w-[66ch] t-small text-ink-2">{note}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/upgrade" className="btn btn-primary">
          See plans
        </Link>
        {secondary ? (
          "href" in secondary ? (
            <Link href={secondary.href} className="btn btn-quiet min-h-10">
              {secondary.label}
            </Link>
          ) : (
            <button onClick={secondary.onClick} className="btn btn-quiet min-h-10">
              {secondary.label}
            </button>
          )
        ) : (
          <button onClick={() => setCollapsed(true)} className="btn btn-quiet min-h-10">
            Not now
          </button>
        )}
      </div>
    </section>
  );
}

/** The paywall for a locked action (a toggle, a Join or an export button): a dialog the user opened, closed with Not now or Escape. */
export function PaywallDialog({ gate, onClose }: { gate: Gate; onClose: () => void }) {
  const id = useId();
  const { title, body, plan } = gateCopy(gate);
  return (
    <Dialog ariaLabel={title} onClose={onClose}>
      <div data-paywall={gate}>
        <Tag kind="plan">{plan.name}</Tag>
        <h2 id={id} className="t-h2 mt-2">
          {title}
        </h2>
        <p className="mt-2 text-ink-2">
          {body} {plan.summary}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Not now
          </button>
          <Link href="/upgrade" onClick={onClose} className="btn btn-primary">
            See plans
          </Link>
        </div>
      </div>
    </Dialog>
  );
}

/** "Premium" or "Elite" next to a locked control, so the lock is visible before anything is clicked. */
export function PlanTag({ feature, className }: { feature: Feature; className?: string }) {
  return (
    <Tag kind="plan" className={className}>
      {PLANS[requiredPlan(feature)].name}
    </Tag>
  );
}
