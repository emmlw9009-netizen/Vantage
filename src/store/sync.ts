"use client";

import { createJSONStorage } from "zustand/middleware";
import { mergeRaw } from "./merge";

/**
 * Cross-tab safety for the persisted stores.
 *
 * sp-app (the account): every write goes through ONE path. The store's setItem only records the newest snapshot; a
 * flush, run under the cross-tab Web Lock "vantage-write", three-way merges that snapshot with whatever storage holds
 * (orders, trades, posts, comments and chat are merged by id, so nothing either tab added is lost and nothing deleted
 * comes back) and writes the result with a new stamp. Money actions flush before they release the lock. Tabs follow each
 * other through storage events. Nothing can write app state around this: it is the only writer.
 *
 * sp-market (simulated prices, only the clock leader writes): compare-and-swap on a stamp, as before.
 *
 * Deleting all data writes a durable epoch key first. A tab whose epoch is older than the stored one is a stale tab from
 * before the deletion: it never writes, it reloads.
 */
const LOCK = "vantage-write";
const EPOCH_KEY = "sp-epoch";
const MERGED = new Set(["sp-app"]);
const stampKey = (name: string) => `${name}:stamp`;
const known: Record<string, string | null> = {};
const handlers: Record<string, () => void> = {};
/** What this tab last read from or wrote to storage (the merge base), and its newest unflushed snapshot. */
const base: Record<string, string | null> = {};
const pendingRaw: Record<string, string | null> = {};
const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
const lastFlush: Record<string, number> = {};
/** Stores whose stamp changed before the app registered its rehydrate handlers (the startup gap). */
const pending = new Set<string>();

const readStamp = (name: string) => {
  try {
    return localStorage.getItem(stampKey(name));
  } catch {
    return null;
  }
};
const readEpoch = () => {
  try {
    return localStorage.getItem(EPOCH_KEY);
  } catch {
    return null;
  }
};
/** True in a tab that is deleting everything: it never writes again. */
let deleting = false;
const myEpoch = typeof window === "undefined" ? null : readEpoch();
const staleEpoch = () => readEpoch() !== myEpoch;
const newStamp = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Write this tab's newest snapshot, merged with storage. Caller holds the lock (or accepts a tiny race on page hide). */
function flushSync(name: string) {
  const mine = pendingRaw[name];
  if (mine == null || deleting) return;
  if (staleEpoch()) return location.reload(); // a deletion happened since this tab loaded: never write over it
  try {
    const stored = localStorage.getItem(name);
    if (stored == null && base[name] != null) return location.reload(); // deleted by another tab
    const out = stored != null && stored !== base[name] ? mergeRaw(base[name], mine, stored) : mine;
    const stamp = newStamp();
    localStorage.setItem(name, out);
    localStorage.setItem(stampKey(name), stamp);
    known[name] = stamp;
    base[name] = out;
    pendingRaw[name] = null;
    lastFlush[name] = Date.now();
    if (out !== mine) handlers[name]?.(); // adopt what other tabs added
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

function requestFlush(name: string) {
  if (typeof navigator === "undefined" || !("locks" in navigator)) return flushSync(name);
  void navigator.locks.request(LOCK, () => flushSync(name)).catch(() => {});
}

function schedule(name: string) {
  if (timers[name]) return;
  const wait = Math.max(0, 50 - (Date.now() - (lastFlush[name] ?? 0))); // at most about 20 writes a second while streaming
  timers[name] = setTimeout(() => {
    timers[name] = undefined;
    requestFlush(name);
  }, wait);
}

export const guardedStorage = createJSONStorage(() => ({
  getItem: (name) => {
    const stored = localStorage.getItem(name);
    known[name] = readStamp(name);
    if (MERGED.has(name) && pendingRaw[name] != null && stored != null) {
      // unflushed local changes: hand back storage with them merged in, so a catch-up never drops them
      const merged = mergeRaw(base[name], pendingRaw[name] as string, stored);
      base[name] = stored;
      pendingRaw[name] = merged;
      return merged;
    }
    base[name] = stored;
    return stored;
  },
  setItem: (name, value) => {
    if (deleting) return;
    if (MERGED.has(name)) {
      if (staleEpoch()) return location.reload();
      pendingRaw[name] = value;
      schedule(name);
      return;
    }
    try {
      if (staleEpoch()) return location.reload();
      if (readStamp(name) !== (known[name] ?? null)) {
        // Someone else wrote since we last looked: don't clobber it, catch up instead.
        setTimeout(() => handlers[name]?.(), 0);
        return;
      }
      const stamp = newStamp();
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
    base[name] = null;
    pendingRaw[name] = null;
  },
}));

const storageNames = ["sp-app", "sp-market"];

function onStorage(e: StorageEvent) {
  if (e.key === null) return location.reload(); // another tab cleared all site data
  if (e.key === EPOCH_KEY) return location.reload(); // another tab deleted everything: this tab's state is now stale
  for (const name of storageNames) {
    if (e.key !== name && e.key !== stampKey(name)) continue;
    if (e.newValue === null) return location.reload(); // the data or its stamp was removed: another tab deleted the data
    known[name] = readStamp(name);
    if (handlers[name]) void handlers[name]();
    else pending.add(name);
  }
}

// Attached when this module loads, before any store hydrates or writes, so no other tab's write is missed at startup.
if (typeof window !== "undefined") {
  window.addEventListener("storage", onStorage);
  // best effort: write any unflushed change when the page goes away
  window.addEventListener("pagehide", () => {
    for (const name of MERGED) flushSync(name);
  });
}

/** Bring a store up to date with storage right now (synchronously with the sync localStorage backend) if another tab wrote. */
export function syncNow(name: string) {
  if (readStamp(name) !== (known[name] ?? null)) {
    handlers[name]?.();
    known[name] = readStamp(name);
  }
}

/** Start a deletion of all data: the epoch changes first, so no tab can write the old account back. */
export function markDeleted() {
  deleting = true;
  try {
    localStorage.setItem(EPOCH_KEY, newStamp());
  } catch {}
}

/**
 * Wraps every action of a persisted store so it first catches up with other tabs (without dropping unflushed local
 * changes, see getItem). Writes are merged and flushed by the one writer above.
 */
export function guardActions<T extends object>(name: string, api: T): T {
  const out = { ...api } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (typeof v !== "function") continue;
    const fn = v as (...a: unknown[]) => unknown;
    out[k] = (...args: unknown[]) => {
      syncNow(name);
      return fn(...args);
    };
  }
  return out as T;
}

/**
 * Runs a store write while holding the cross-tab Web Lock: it catches up first, runs, and flushes before releasing, so
 * two tabs can never interleave. Used for the money actions and for deleting data.
 */
export function withWriteLock<T>(fn: () => T): Promise<T> {
  const run = () => {
    for (const name of MERGED) syncNow(name);
    const r = fn();
    for (const name of MERGED) flushSync(name);
    return r;
  };
  if (typeof navigator === "undefined" || !("locks" in navigator)) return Promise.resolve(run());
  return navigator.locks.request(LOCK, () => run()) as Promise<T>;
}

/** Call once on the client. `rehydrate` functions are the stores' `persist.rehydrate`. */
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
