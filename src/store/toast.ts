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
}

export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = uid();
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismiss(id), 5200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
