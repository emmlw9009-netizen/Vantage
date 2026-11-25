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

/** Stores whose stamp changed before the app registered its rehydrate handlers (the startup gap). */
const pending = new Set<string>();
/** Set when a write was refused; actions check it to catch up and run again instead of losing the change. */
const refused = new Set<string>();

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
        // The action that caused this write sees `refused` and re-runs on the fresh state (see guardActions).
        refused.add(name);
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

const storageNames = ["sp-app", "sp-market"];

function onStorage(e: StorageEvent) {
  if (e.key === null) return location.reload(); // another tab cleared all site data
  for (const name of storageNames) {
    if (e.key !== name && e.key !== stampKey(name)) continue;
    if (e.key === name && e.newValue === null) return location.reload(); // another tab deleted the data
    known[name] = readStamp(name);
    if (handlers[name]) void handlers[name]();
    else pending.add(name);
  }
}

// Attached when this module loads, before any store hydrates or writes, so no other tab's write is missed at startup.
if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

/** Bring one store up to date with storage right now (synchronously with the sync localStorage backend) if another tab wrote. */
export function syncNow(name: string) {
  if (readStamp(name) !== (known[name] ?? null)) {
    handlers[name]?.();
    known[name] = readStamp(name);
  }
}

/**
 * Wraps every action of a persisted store: it first catches up with other tabs, so it works on current data, and if its
 * write is still refused (another tab wrote in the same instant) it rehydrates and runs once more. A confirmed order is
 * therefore never silently dropped.
 */
export function guardActions<T extends object>(name: string, api: T): T {
  const out = { ...api } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (typeof v !== "function") continue;
    const fn = v as (...a: unknown[]) => unknown;
    out[k] = (...args: unknown[]) => {
      syncNow(name);
      refused.delete(name);
      let r = fn(...args);
      if (refused.delete(name)) {
        handlers[name]?.();
        known[name] = readStamp(name);
        r = fn(...args);
      }
      return r;
    };
  }
  return out as T;
}

/**
 * Runs a store write (read, change, write) while holding a cross-tab Web Lock, so two tabs can never interleave the
 * compare-and-swap. Used for the money actions. Without Web Locks it just runs.
 */
export function withWriteLock<T>(fn: () => T): Promise<T> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) return Promise.resolve(fn());
  return navigator.locks.request("vantage-write", () => fn()) as Promise<T>;
}

/** Call once on the client. `rehydrate` functions are the stores' `persist.rehydrate`. Returns a cleanup function. */
export function startCrossTabSync(stores: Record<string, () => void | Promise<void>>) {
  Object.assign(handlers, stores);
  // catch up on anything another tab wrote before we were ready
  for (const name of Object.keys(stores)) {
    if (pending.delete(name) || readStamp(name) !== (known[name] ?? null)) {
      known[name] = readStamp(name);
      void stores[name]();
    }
  }
  return () => {};
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
