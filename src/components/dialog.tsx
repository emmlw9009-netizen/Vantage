"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * A true modal. It renders in a portal on document.body, marks every other body child `inert` while open
 * (no focus, no clicks, hidden from assistive tech), moves focus inside, keeps Tab cycling inside, and
 * returns focus on close. Escape calls onClose when provided; pass no onClose for a blocking dialog.
 * Use `ariaLabel` instead of `title` when the content supplies its own heading.
 */
export function Dialog({ title, ariaLabel, children, onClose, className, z = "z-[70]" }: { title?: string; ariaLabel?: string; children: React.ReactNode; onClose?: () => void; className?: string; z?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-dialog-host", "");
    document.body.appendChild(el);
    setHost(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    if (!host) return;
    const prev = document.activeElement as HTMLElement | null;
    // Everything behind the dialog becomes inert.
    const made: Element[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child === host || child.tagName === "SCRIPT" || child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      made.push(child);
    }
    const root = ref.current;
    const focusables = () => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (root?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? root)?.focus();
    const isTop = () => {
      const hosts = document.querySelectorAll("[data-dialog-host]");
      return hosts[hosts.length - 1] === host;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) {
          e.preventDefault();
          root?.focus();
          return;
        }
        const active = document.activeElement as HTMLElement | null;
        const inside = !!active && !!root?.contains(active);
        if (!inside) {
          e.preventDefault();
          (e.shiftKey ? f[f.length - 1] : f[0]).focus();
        } else if (e.shiftKey && active === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && active === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    // If focus ever lands outside (for example from browser chrome), pull it back in.
    const onFocusIn = (e: FocusEvent) => {
      if (isTop() && root && e.target instanceof Node && !root.contains(e.target)) (focusables()[0] ?? root).focus();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocusIn);
      for (const c of made) c.removeAttribute("inert");
      if (prev && document.contains(prev)) prev.focus?.();
    };
  }, [host, onClose]);

  if (!host) return null;
  return createPortal(
    <div className={cn("fixed inset-0 grid place-items-center overflow-y-auto p-4", z)} style={{ background: "var(--scrim)" }}>
      <m.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        className={cn("float relative w-full max-w-lg p-5 outline-none sm:p-6", className)}
      >
        {title && (
          <h2 id={titleId} className="t-h2">
            {title}
          </h2>
        )}
        {children}
      </m.div>
    </div>,
    host,
  );
}
