"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/format";

/**
 * Modal dialog. Focus moves into it on open and is trapped; Escape calls onClose when provided.
 * Pass no onClose for a blocking dialog (consent).
 */
export function Dialog({ title, children, onClose, className, z = "z-[70]" }: { title: string; children: React.ReactNode; onClose?: () => void; className?: string; z?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const focusables = () => Array.from(root?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    (root?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? root)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className={cn("fixed inset-0 grid place-items-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm", z)}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn("card w-full max-w-lg p-6 outline-none sm:p-8", className)}>
        <h2 id={titleId} className="font-display text-2xl font-bold leading-tight sm:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
