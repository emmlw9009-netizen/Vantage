"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { cn, pct, signedUsd } from "@/lib/format";
import { useToast } from "@/store/toast";
import { MEMBER_MAP } from "@/lib/community-seed";
import { ME, useApp } from "@/store/app";

/** A change value that never relies on color alone: arrow + sign + color. */
export function Delta({ value, ratio, className, size = "sm" }: { value?: number; ratio?: number; className?: string; size?: "xs" | "sm" | "md" }) {
  const v = ratio ?? value ?? 0;
  const up = v > 0;
  const flat = Math.abs(v) < 1e-9;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tnum inline-flex items-center gap-0.5 font-medium", flat ? "text-muted" : up ? "text-up" : "text-down", size === "xs" ? "text-xs" : size === "md" ? "text-base" : "text-sm", className)}>
      {!flat && <Icon className={size === "md" ? "size-4" : "size-3.5"} aria-hidden />}
      {value != null && ratio == null ? signedUsd(value) : pct(v)}
    </span>
  );
}

/** Price text that flashes when it changes. */
export function LivePrice({ value, className, format }: { value: number; className?: string; format: (n: number) => string }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "flash-up" | "flash-down">("");
  useEffect(() => {
    if (value !== prev.current) {
      setFlash(value > prev.current ? "flash-up" : "flash-down");
      prev.current = value;
      const t = setTimeout(() => setFlash(""), 900);
      return () => clearTimeout(t);
    }
  }, [value]);
  return <span className={cn("tnum rounded px-0.5", flash, className)}>{format(value)}</span>;
}

export function Avatar({ id, size = 36 }: { id: string; size?: number }) {
  const profile = useApp((s) => s.profile);
  const m = MEMBER_MAP[id];
  const name = id === ME ? profile.name || "You" : m?.name ?? "?";
  const hue = id === ME ? 95 : m?.hue ?? 200;
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, oklch(0.62 0.16 ${hue}), oklch(0.45 0.14 ${hue + 40}))` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const tone = score >= 85 ? "var(--up)" : score >= 70 ? "var(--series-1)" : score >= 50 ? "var(--warn)" : "var(--down)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Coach score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-2)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="tnum absolute inset-0 grid place-items-center text-sm font-semibold">{score}</span>
    </div>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-xs font-medium text-ink-2", className)}>{children}</span>;
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed right-4 top-[4.5rem] z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-6 md:top-auto">
      {toasts.map((t) => (
        <div key={t.id} className="card pointer-events-auto flex items-start gap-3 p-3.5 pr-2" role="status">
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.tone === "good" ? "bg-up" : t.tone === "warn" ? "bg-warn" : t.tone === "risk" ? "bg-down" : "bg-series-1")} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t.href ? <Link href={t.href}>{t.title}</Link> : t.title}</div>
            {t.body && <div className="text-sm text-ink-2">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="rounded-md p-1 text-muted hover:text-ink" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
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
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      if (href.startsWith("/")) out.push(<Link key={k++} href={href}>{label}</Link>);
      else out.push(<a key={k++} href={href} target="_blank" rel="noreferrer noopener">{label}</a>);
    } else out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = "sm" }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-panel-2 p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-full font-medium transition", size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm", value === o.value ? "bg-panel text-ink shadow-sm" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
