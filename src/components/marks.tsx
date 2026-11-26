"use client";

import Link from "next/link";
import { cn } from "@/lib/format";
import { DrawPath } from "./motion/draw-path";
import { CHECKS, checkSummary, type CheckId, type CheckState } from "@/lib/trade-checks";
import { BOX, LOOP_D, TICK_D } from "@/lib/marks-geometry";
export { TICK_D };

/* Nova's blue-pencil marks (docs/design/direction.md §7). Geometry is part of the signature: keep the overshooting tick. */


/** Gain/loss triangle. Text colour comes from the parent. */
export function Tri({ up, className }: { up: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={cn("inline-block size-[0.62em] shrink-0 fill-current", className)} aria-hidden>
      <path d={up ? "M5 1.2 L9.2 8.6 H0.8 Z" : "M5 8.8 L9.2 1.4 H0.8 Z"} />
    </svg>
  );
}

/** One check cell: a box, a blue-pencil tick that leaves the box, or a muted "not needed" slash. */
export function CheckCell({ state, size = 20, draw = false, ink = false, className }: { state: CheckState; size?: number; draw?: boolean; ink?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} fill="none" stroke="var(--edge)" strokeWidth={1.5} />
      {state === "done" && (
        <DrawPath key="tick" d={TICK_D} draw={draw} fill="none" stroke={ink ? "var(--ink)" : "var(--pencil)"} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {state === "na" && <path d="M5 19 L15 9" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" />}
    </svg>
  );
}

/** The five checks in canonical order. Compact (no labels) or labeled. Always one accessible sentence. */
export function CheckStrip({ checks, labeled = false, size, className, hideFromAT = false }: { checks: Record<CheckId, CheckState>; labeled?: boolean; size?: number; className?: string; hideFromAT?: boolean }) {
  const s = checkSummary(checks);
  const sentence = `${s.done} of ${s.total} checks done.${s.missing.length ? ` Missing: ${s.missing.join(", ")}.` : ""}`;
  const px = size ?? (labeled ? 28 : 20);
  return (
    <span
      className={cn("inline-flex items-start", labeled ? "gap-2" : "gap-0.5", className)}
      {...(hideFromAT ? { "aria-hidden": true } : { role: "img", "aria-label": sentence })}
    >
      {CHECKS.map((c) => (
        <span key={c.id} className="flex flex-col items-center">
          <CheckCell state={checks[c.id]} size={px} />
          {labeled && <span className="t-micro mt-0.5 text-ink-2">{c.short}</span>}
        </span>
      ))}
    </span>
  );
}

export function tierFor(score: number): { label: string; risk: boolean } {
  if (score >= 85) return { label: "Disciplined", risk: false };
  if (score >= 70) return { label: "Solid", risk: false };
  if (score >= 50) return { label: "Needs work", risk: false };
  return { label: "High risk", risk: true };
}

const LOOP_SIZES = { s: { w: 44, h: 30, f: "text-[14px]" }, m: { w: 72, h: 48, f: "text-[24px]" }, l: { w: 120, h: 80, f: "text-[36px]" } } as const;

/** The process score with Nova's hand-drawn loop around it. */
export function ScoreLoop({ score, size = "m", draw = false, children, className, label = true }: { score: number; size?: keyof typeof LOOP_SIZES; draw?: boolean; children?: React.ReactNode; className?: string; label?: boolean }) {
  const z = LOOP_SIZES[size];
  const tier = tierFor(score);
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="img" aria-label={`Process score ${Math.round(score)} out of 100, ${tier.label}`}>
      <span className="relative inline-grid shrink-0 place-items-center" style={{ width: z.w, height: z.h }} aria-hidden>
        <svg viewBox="0 0 72 48" width={z.w} height={z.h} className="absolute inset-0 overflow-visible">
          <DrawPath d={LOOP_D} draw={draw} duration={0.36} fill="none" stroke="var(--pencil)" strokeWidth={size === "s" ? 2.4 : 2} strokeLinecap="round" />
        </svg>
        <span className={cn("tnum relative t-wide font-semibold leading-none text-pencil", z.f)}>{children ?? Math.round(score)}</span>
      </span>
      {label && size !== "s" && (
        <span className={cn("t-small font-medium", tier.risk ? "text-red" : "text-ink")} aria-hidden>
          {tier.risk && <MarkGlyph kind="risk" className="mr-1 inline-block align-[-3px]" />}
          {tier.label}
        </span>
      )}
    </span>
  );
}

/** Nova's mark vocabulary: tick (good, pencil), query (watch, ink), cross (risk, red). Shapes differ, so colour never works alone. */
export function MarkGlyph({ kind, className, size = 18 }: { kind: "good" | "warn" | "risk"; className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      {kind === "good" && <path d={TICK_D} fill="none" stroke="var(--pencil)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />}
      {kind !== "good" && <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} fill="none" stroke={kind === "risk" ? "var(--red)" : "var(--ink)"} strokeWidth={1.5} />}
      {kind === "warn" && (
        <text x={10} y={18.6} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)" style={{ fontFamily: "var(--font-sans)" }}>
          ?
        </text>
      )}
      {kind === "risk" && <path d="M6.5 10.5 L13.5 17.5 M13.5 10.5 L6.5 17.5" stroke="var(--red)" strokeWidth={2} strokeLinecap="round" />}
    </svg>
  );
}
export const MARK_WORD = { good: "Good", warn: "Watch", risk: "Risk" } as const;

/** "Nova" + the AI coach tag. Every place Nova speaks carries this. */
export function NovaByline({ tag = "AI coach", disclaimer = false, time, extra, className }: { tag?: string; disclaimer?: boolean; time?: string; extra?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="t-small font-semibold text-ink">Nova</span>
      <span className="tag tag-nova">{tag}</span>
      {extra}
      {disclaimer && (
        <Link href="/disclaimer" className="link -my-2.5 inline-block py-2.5 t-small text-ink-2">
          AI coach disclaimer
        </Link>
      )}
      {time && <span className="t-micro text-muted">{time}</span>}
    </div>
  );
}

/** Anything Nova writes sits behind the blue double margin rule. */
export function NovaNote({ children, className, byline }: { children: React.ReactNode; className?: string; byline?: React.ReactNode }) {
  return (
    <div className={cn("nova-note", className)}>
      {byline ?? <NovaByline />}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function Tag({ children, kind = "plain", className }: { children: React.ReactNode; kind?: "plain" | "nova" | "plan" | "fill"; className?: string }) {
  return <span className={cn("tag", kind === "nova" && "tag-nova", kind === "plan" && "tag-plan", kind === "fill" && "tag-fill", className)}>{children}</span>;
}
