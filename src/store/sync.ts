"use client";

import { createJSONStorage } from "zustand/middleware";

/**
 * Cross-tab safety for the persisted stores.
 *
 * Every write goes through a compare-and-swap: each store has a stamp key (`<name>:stamp`) that changes on every write.
 * A tab remembers the stamp it last read or wrote. If the stored stamp differs, another tab wrote newer data, so this
 * tab's write is refused and the store rehydrates from storage instead. A stale tab can therefore never overwrite newer data.
 * Storage events from other tabs trigger the same rehydrate, so tabs converge within milliseconds.
 */
const stampKey = (name: string) => `${name}:stamp`;
const known: Record<string, string | null> = {};
const handlers: Record<string, () => void> = {};

const readStamp = (name: string) => {
  try {
    return localStorage.getItem(stampKey(name));
  } catch {
    return null;
  }
};

export const guardedStorage = createJSONStorage(() => ({
  getItem: (name) => {
    known[name] = readStamp(name);
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    try {
      if (readStamp(name) !== (known[name] ?? null)) {
        // Someone else wrote since we last looked: don't clobber it, catch up instead.
        setTimeout(() => handlers[name]?.(), 0);
        return;
      }
      const stamp = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(name, value);
      localStorage.setItem(stampKey(name), stamp);
      known[name] = stamp;
    } catch {
      /* storage full or blocked: keep running in memory */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      localStorage.removeItem(stampKey(name));
    } catch {}
    known[name] = null;
  },
}));

/** Call once on the client. `rehydrate` functions are the stores' `persist.rehydrate`. Returns a cleanup function. */
export function startCrossTabSync(stores: Record<string, () => void | Promise<void>>) {
  Object.assign(handlers, stores);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null) return location.reload(); // another tab cleared all site data
    for (const name of Object.keys(stores)) {
      if (e.key !== name && e.key !== stampKey(name)) continue;
      if (e.key === name && e.newValue === null) return location.reload(); // another tab deleted the data
      known[name] = readStamp(name);
      void stores[name]();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/**
 * Only one visible tab runs the market clock. Uses a Web Lock held while the tab is visible, so another visible tab
 * takes over automatically when the leader is closed, crashes or is hidden. Without Web Locks every tab ticks (old behaviour).
 */
let leader = typeof navigator === "undefined" || !("locks" in navigator);
export const isClockLeader = () => leader;

export function startClockElection() {
  if (typeof navigator === "undefined" || !("locks" in navigator)) return () => {};
  let release: (() => void) | null = null;
  let ctl: AbortController | null = null;
  const acquire = () => {
    if (ctl || document.hidden) return;
    const c = (ctl = new AbortController());
    navigator.locks
      .request("vantage-market-clock", { signal: c.signal }, () => {
        leader = true;
        return new Promise<void>((res) => {
          release = res;
        });
      })
      .catch(() => {});
  };
  const drop = () => {
    leader = false;
    release?.();
    release = null;
    ctl?.abort();
    ctl = null;
  };
  const onVis = () => (document.hidden ? drop() : acquire());
  document.addEventListener("visibilitychange", onVis);
  acquire();
  return () => {
    document.removeEventListener("visibilitychange", onVis);
    drop();
  };
}
