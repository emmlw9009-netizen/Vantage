"use client";
import { create } from "zustand";
import { uid } from "@/lib/format";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: "default" | "good" | "warn" | "risk";
  href?: string;
  /** Optional inline action, e.g. Undo. Running it dismisses the toast. */
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  /** Pause or resume the auto-dismiss timer (hover and focus). */
  hold: (id: string) => void;
  release: (id: string) => void;
}

const AUTO_MS = 6000;
const RISK_MS = 12000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let lastOutside: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (e) => {
    const el = e.target as HTMLElement;
    if (!el.closest?.("[data-toaster]")) lastOutside = el;
  });
}

export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = uid();
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    get().release(id);
  },
  dismiss: (id) => {
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.delete(id);
    // if focus was inside the toast, give it back to what had it before
    if (typeof document !== "undefined" && document.activeElement?.closest("[data-toaster]") && lastOutside?.isConnected) lastOutside.focus();
    set({ toasts: get().toasts.filter((x) => x.id !== id) });
  },
  hold: (id) => {
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.delete(id);
  },
  release: (id) => {
    // risk and warning toasts stay longer, but never forever
    const toast = get().toasts.find((x) => x.id === id);
    if (!toast) return;
    const ms = toast.tone === "risk" || toast.tone === "warn" ? RISK_MS : AUTO_MS;
    const old = timers.get(id);
    if (old) clearTimeout(old);
    timers.set(id, setTimeout(() => get().dismiss(id), ms));
  },
}));
