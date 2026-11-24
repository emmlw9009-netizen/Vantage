"use client";

import Link from "next/link";
import { Fragment, useId, useRef } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { cn, pct, signedUsd } from "@/lib/format";
import { useToast } from "@/store/toast";
import { MEMBER_MAP } from "@/lib/community-seed";
import { ME, useApp } from "@/store/app";
import { MarkGlyph, ScoreLoop, Tri, tierFor } from "./marks";

/**
 * A change value that never relies on colour alone: triangle + sign (+ colour).
 * Gains are written "in the black" (ink); losses in red pencil; zero is muted with no triangle.
 */
export function Delta({ value, ratio, className, size = "sm" }: { value?: number; ratio?: number; className?: string; size?: "xs" | "sm" | "md" }) {
  const v = ratio ?? value ?? 0;
  const flat = Math.abs(v) < 1e-9;
  const up = v > 0;
  const text = value != null && ratio == null ? signedUsd(value).replace("-", "−") : pct(v).replace("-", "−");
  return (
    <span className={cn("tnum inline-flex items-center gap-1 whitespace-nowrap font-medium", flat ? "text-muted" : up ? "text-gain" : "text-loss", size === "xs" ? "text-xs" : size === "md" ? "text-base" : "text-sm", className)}>
      {!flat && <Tri up={up} />}
      <span className="sr-only">{flat ? "unchanged" : up ? "up" : "down"}</span>
      {text}
    </span>
  );
}

/** A live price. Updates in place: no flashes (direction lives in the Delta beside it). */
export function LivePrice({ value, className, format }: { value: number; className?: string; format: (n: number) => string }) {
  return <span className={cn("tnum", className)}>{format(value)}</span>;
}

const NOVA_ID = "u7";

/** Flat avatars: initials on a well. Nova gets a blue-pencil ring. */
export function Avatar({ id, size = 32 }: { id: string; size?: number }) {
  const profile = useApp((s) => s.profile);
  const mem = MEMBER_MAP[id];
  if (id === NOVA_ID) {
    return (
      <span className="inline-grid shrink-0 place-items-center rounded-full border-[1.5px] border-pencil font-semibold text-pencil" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
        N
      </span>
    );
  }
  const name = id === ME ? profile.name || "You" : mem?.name ?? "?";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-well font-semibold text-ink t-narrow" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </span>
  );
}

export function scoreTier(score: number): { label: string; tone: string } {
  const t = tierFor(score);
  return { label: t.label, tone: t.risk ? "var(--red)" : "var(--ink)" };
}

/** Kept for older callers: the score now renders as Nova's loop. */
export function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  return <ScoreLoop score={score} size={size >= 96 ? "l" : size >= 60 ? "m" : "s"} />;
}
export const ScoreRing = ScoreGauge;

/** Small sentence-case tag (4px radius). */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("tag", className)}>{children}</span>;
}

/**
 * Toasts: top-left under the top bar on desktop, under the header on phones, so they never cover the
 * ticket's Buy button or the coach's Send button. At most two, auto-dismissed by the store.
 */
export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  const reduce = useReducedMotion();
  const shown = toasts.slice(-2);
  return (
    <div data-toaster className="pointer-events-none fixed left-4 right-4 top-[64px] z-50 flex flex-col gap-2 sm:right-auto sm:w-[360px] lg:left-8 lg:top-[68px]">
      <AnimatePresence initial={false}>
        {shown.map((t) => (
          <m.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.12 } }}
            transition={{ duration: 0.14 }}
            className="float pointer-events-auto flex items-start gap-3 py-3 pl-4 pr-1.5"
            role="status"
          >
            {t.tone === "good" && <MarkGlyph kind="good" className="mt-0.5" />}
            {t.tone === "risk" && <MarkGlyph kind="risk" className="mt-0.5" />}
            <div className="min-w-0 flex-1">
              <div className="t-small font-semibold">{t.href ? <Link href={t.href} className="hover:underline">{t.title}</Link> : t.title}</div>
              {t.body && <div className="t-small break-words text-ink-2">{t.body}</div>}
              {t.action && (
                <button onClick={() => { t.action?.run(); dismiss(t.id); }} className="btn-quiet mt-1 inline-flex min-h-10 items-center t-small font-semibold">
                  {t.action.label}
                </button>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} className="grid size-10 shrink-0 place-items-center rounded-md text-ink-2 hover:bg-well hover:text-ink" aria-label="Dismiss">
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Tiny, safe markdown: paragraphs, bullets, **bold**, _italic_, [links](/internal). */
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="prose-coach">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l) || !l.trim())) {
          return (
            <ul key={i}>
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|_[^_]+_|\*[^*]+\*)/g;
  let last = 0;
  let mm: RegExpExecArray | null;
  let k = 0;
  while ((mm = re.exec(s))) {
    if (mm.index > last) out.push(s.slice(last, mm.index));
    const tok = mm[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      if (href.startsWith("/")) out.push(<Link key={k++} href={href}>{label}</Link>);
      else out.push(<a key={k++} href={href} target="_blank" rel="noreferrer noopener">{label}</a>);
    } else out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = mm.index + tok.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/** Section heading row: h2 + a quiet action, ruled underneath. */
export function SectionTitle({ title, action, as: As = "h2", className, id }: { title: React.ReactNode; action?: React.ReactNode; as?: "h2" | "h3"; className?: string; id?: string }) {
  return (
    <div className={cn("sec-head mb-3", className)}>
      <As id={id} className={As === "h2" ? "t-h2" : "t-h3"}>{title}</As>
      {action}
    </div>
  );
}

/**
 * One-of-many choice. kind="radio" (default): a bordered radiogroup whose selected option is ink-filled.
 * kind="tabs": underlined text tabs (role=tablist). The indicator slides via a shared layoutId.
 * Arrow keys move the selection (roving tabindex). Every option is at least 40px tall.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  kind = "radio",
  label,
  size = "sm",
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  kind?: "radio" | "tabs";
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const gid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (idx + dir + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  if (kind === "tabs") {
    return (
      <div role="tablist" aria-label={label} className={cn("flex min-w-0 gap-1 overflow-x-auto border-b border-rule", className)} onKeyDown={onKey}>
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${gid}-tab-${o.value}`}
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={cn("relative min-h-11 shrink-0 px-3 t-small font-medium", size === "md" && "text-[15px]", on ? "text-ink" : "text-ink-2 hover:text-ink")}
            >
              {o.label}
              {on && <m.span layoutId={`${gid}-ind`} className="absolute inset-x-2 -bottom-px h-0.5 bg-ink" transition={{ duration: 0.2 }} />}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md border border-edge p-0.5", className)} onKeyDown={onKey}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn("relative min-h-10 min-w-10 rounded-[4px] px-3 t-small font-medium", size === "md" && "px-4", on ? "text-on-ink" : "text-ink-2 hover:text-ink")}
          >
            {on && <m.span layoutId={`${gid}-ind`} className="absolute inset-0 rounded-[4px] bg-ink" transition={{ duration: 0.2 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
