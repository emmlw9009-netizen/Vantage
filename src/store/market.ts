"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Bar, NewsItem, TICKERS, generateHistory, gaussian, isCurrentHeadline, mulberry32, randomNews, round2, hashString } from "@/lib/market-data";

const TICKS_PER_DAY = 78; // each live tick ≈ 5 simulated minutes
const INTRADAY_CAP = 240;

const historyCache: Record<string, Bar[]> = {};
export function getHistory(symbol: string): Bar[] {
  if (!historyCache[symbol]) {
    const t = TICKERS.find((x) => x.symbol === symbol);
    historyCache[symbol] = t ? generateHistory(t) : [];
  }
  return historyCache[symbol];
}

interface MarketState {
  prices: Record<string, number>;
  prevClose: Record<string, number>;
  intraday: Record<string, Bar[]>;
  news: NewsItem[];
  sessionStarted: number;
  initialized: boolean;
  init: () => void;
  tick: () => void;
  resetSession: () => void;
}

function seedSession() {
  const prices: Record<string, number> = {};
  const prevClose: Record<string, number> = {};
  const intraday: Record<string, Bar[]> = {};
  const now = Date.now();
  for (const t of TICKERS) {
    const hist = getHistory(t.symbol);
    const close = hist[hist.length - 1]?.c ?? t.basePrice;
    prevClose[t.symbol] = close;
    // pre-fill a short morning session so the 1D chart isn't empty
    const rand = mulberry32(hashString(t.symbol + new Date().toDateString()));
    const sigma = t.vol / Math.sqrt(252 * TICKS_PER_DAY);
    let p = close * (1 + gaussian(rand) * sigma * 2);
    const points: Bar[] = [];
    for (let i = 40; i > 0; i--) {
      p = p * Math.exp(gaussian(rand) * sigma);
      points.push({ t: now - i * 2000, c: round2(p) });
    }
    intraday[t.symbol] = points;
    prices[t.symbol] = points[points.length - 1].c;
  }
  return { prices, prevClose, intraday, news: seedNews(now), sessionStarted: now };
}

function seedNews(now = Date.now()): NewsItem[] {
  const news: NewsItem[] = [];
  for (let guard = 0; news.length < 3 && guard < 50; guard++) {
    const n = randomNews();
    if (!news.some((x) => x.headline === n.headline)) news.push({ ...n, at: now - (news.length + 1) * 7 * 60_000 });
  }
  return news;
}

export const useMarket = create<MarketState>()(
  persist(
    (set, get) => ({
      prices: {},
      prevClose: {},
      intraday: {},
      news: [],
      sessionStarted: 0,
      initialized: false,
      init: () => {
        const s = get();
        if (Object.keys(s.prices).length === TICKERS.length && Object.keys(s.intraday).length) {
          // stored headlines from older templates are dropped on load (see merge); refill if none are left
          set({ initialized: true, ...(s.news.length ? {} : { news: seedNews() }) });
          return;
        }
        set({ ...seedSession(), initialized: true });
      },
      resetSession: () => set({ ...seedSession(), initialized: true }),
      tick: () => {
        const s = get();
        const now = Date.now();
        const market = gaussian(Math.random) * 0.0011;
        let news: NewsItem | null = null;
        if (Math.random() < 1 / 22) news = randomNews();

        const prices = { ...s.prices };
        const intraday: Record<string, Bar[]> = {};
        for (const t of TICKERS) {
          const p0 = prices[t.symbol] ?? t.basePrice;
          const sigma = (t.vol / Math.sqrt(252 * TICKS_PER_DAY)) * 0.85;
          const pull = -0.015 * Math.log(p0 / (s.prevClose[t.symbol] ?? p0)); // gentle mean reversion
          let r = t.beta * market + gaussian(Math.random) * sigma + pull * sigma;
          if (news) {
            if (news.symbol === t.symbol) r += news.impact;
            else if (news.symbol === null) r += news.impact * t.beta;
          }
          const p1 = round2(Math.max(0.5, p0 * Math.exp(r)));
          prices[t.symbol] = p1;
          const arr = s.intraday[t.symbol] ?? [];
          const next = arr.length >= INTRADAY_CAP ? arr.slice(arr.length - INTRADAY_CAP + 1) : arr.slice();
          next.push({ t: now, c: p1 });
          intraday[t.symbol] = next;
        }
        set({ prices, intraday, news: news ? [news, ...s.news].slice(0, 40) : s.news });
      },
    }),
    {
      name: "sp-market",
      version: 1,
      // Drop persisted headlines that don't match the current templates (old ones alleged specific events about real companies).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MarketState>;
        return { ...current, ...p, news: (p.news ?? []).filter((n) => isCurrentHeadline(n?.headline)) };
      },
      partialize: (s) => ({ prices: s.prices, prevClose: s.prevClose, intraday: s.intraday, news: s.news, sessionStarted: s.sessionStarted }),
    },
  ),
);
