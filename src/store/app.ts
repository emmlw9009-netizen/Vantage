"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { analyzeTrade, Flag, PortfolioContext } from "@/lib/analysis";
import { uid, usd } from "@/lib/format";
import { expectedFill, marketFillPrice } from "@/lib/pricing";
import { useMarket } from "./market";
import { useToast } from "./toast";
import { guardActions, guardedStorage } from "./sync";

export const STARTING_CASH = 100_000;

export interface Position {
  symbol: string;
  qty: number;
  avgCost: number;
  openedAt: number;
}

export type OrderType = "market" | "limit" | "stop";
export type OrderRole = "entry" | "stop-loss" | "take-profit" | "exit";

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: OrderType;
  qty: number;
  limitPrice?: number;
  stopPrice?: number;
  status: "open" | "filled" | "cancelled";
  role: OrderRole;
  createdAt: number;
  filledAt?: number;
  fillPrice?: number;
  thesis?: string;
  stopLoss?: number;
  takeProfit?: number;
  groupId?: string; // bracket legs share a group (one-cancels-other)
  /** Why part of this order was not carried out (e.g. a stop that ended up above the fill price). */
  note?: string;
}

export interface CoachReview {
  headline: string;
  summary: string;
  didWell: string[];
  improve: string[];
  nextStep: string;
  source: "ai" | "rules";
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  at: number;
  role: OrderRole;
  thesis?: string;
  stopLoss?: number;
  takeProfit?: number;
  realizedPnl?: number;
  score: number;
  flags: Flag[];
  metrics: Record<string, number | undefined>;
  reviewStatus: "pending" | "done" | "error";
  review?: CoachReview;
}

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  /** Written while nothing could be sent to the AI provider. Never part of the history sent later. */
  local?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  kind: "idea" | "question" | "win" | "lesson";
  body: string;
  symbol?: string;
  tradeId?: string;
  at: number;
  likes: number;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  at: number;
}

export interface Profile {
  name: string;
  handle: string;
  experience: "new" | "some" | "experienced";
  goal: "learn" | "long-term" | "active";
  onboarded: boolean;
  /** Clickwrap record: which terms version was accepted and when (ISO string). */
  consent?: { version: string; acceptedAt: string };
  /** ISO time the user saw the AI data notice (only shown when the AI coach is on). */
  aiNoticeAt?: string;
  /** Invite code from a ?ref= link, stored once. No rewards yet. */
  referredBy?: string;
}

interface AppState {
  profile: Profile;
  cash: number;
  positions: Record<string, Position>;
  orders: Order[];
  trades: Trade[];
  equityHistory: { t: number; v: number }[];
  watchlist: string[];
  // learning
  xp: number;
  completedLessons: Record<string, { at: number; quiz: number }>;
  missions: Record<string, number>;
  activeDays: string[];
  // community
  posts: Post[];
  liked: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  /** Posts and comments the user reported. They are hidden for this user. */
  reported: Record<string, true>;
  following: Record<string, boolean>;
  // coach
  chat: ChatMsg[];

  setProfile: (p: Partial<Profile>) => void;
  placeOrder: (o: {
    symbol: string;
    side: "buy" | "sell";
    type: OrderType;
    qty: number;
    limitPrice?: number;
    stopPrice?: number;
    thesis?: string;
    stopLoss?: number;
    takeProfit?: number;
  }) => { ok: boolean; error?: string; tradeId?: string; orderId?: string };
  cancelOrder: (id: string) => void;
  processPrices: (prices: Record<string, number>) => string[];
  setReview: (tradeId: string, review: CoachReview | null) => void;
  toggleWatch: (symbol: string) => void;
  completeLesson: (slug: string, quiz: number) => void;
  completeMission: (id: string, xp: number) => void;
  addXp: (n: number) => void;
  addPost: (p: Omit<Post, "id" | "at" | "likes" | "authorId">) => string;
  toggleLike: (postId: string) => void;
  reportItem: (id: string) => void;
  unreportItem: (id: string) => void;
  addComment: (postId: string, body: string, authorId?: string) => void;
  toggleFollow: (userId: string) => void;
  pushChat: (m: Omit<ChatMsg, "id" | "at">) => string;
  updateChat: (id: string, content: string) => void;
  clearChat: () => void;
  resetAccount: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function equityOf(cash: number, positions: Record<string, Position>, prices: Record<string, number>) {
  let v = cash;
  for (const p of Object.values(positions)) v += p.qty * (prices[p.symbol] ?? p.avgCost);
  return v;
}

export const ME = "me";

const freshAccount = () => ({
  cash: STARTING_CASH,
  positions: {} as Record<string, Position>,
  orders: [] as Order[],
  trades: [] as Trade[],
  equityHistory: [{ t: Date.now(), v: STARTING_CASH }],
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      /** Execute a fill against state. Returns the new trade id. */
      const fill = (order: Order, price: number): string | undefined => {
        const s = get();
        const { prices, prevClose } = useMarket.getState();
        const positions = { ...s.positions };
        let cash = s.cash;
        const pos = positions[order.symbol];
        let qty = order.qty;
        let realizedPnl: number | undefined;
        let heldMs: number | undefined;

        if (order.side === "buy") {
          const cost = qty * price;
          if (cost > cash + 1e-6) return undefined;
          cash -= cost;
          if (pos) {
            const newQty = pos.qty + qty;
            positions[order.symbol] = { ...pos, qty: newQty, avgCost: (pos.avgCost * pos.qty + cost) / newQty };
          } else {
            positions[order.symbol] = { symbol: order.symbol, qty, avgCost: price, openedAt: Date.now() };
          }
        } else {
          if (!pos || pos.qty <= 0) return undefined;
          qty = Math.min(qty, pos.qty);
          cash += qty * price;
          realizedPnl = (price - pos.avgCost) * qty;
          heldMs = Date.now() - pos.openedAt;
          const left = pos.qty - qty;
          if (left <= 0) delete positions[order.symbol];
          else positions[order.symbol] = { ...pos, qty: left };
        }

        const ctx: PortfolioContext = {
          equity: equityOf(s.cash, s.positions, prices),
          cash: s.cash,
          positions: s.positions,
          prices,
          prevClose,
          recentTradeCount: s.trades.filter((t) => Date.now() - t.at < 10 * 60_000 && t.role === "entry").length + (order.role === "entry" ? 1 : 0),
        };
        const analysis = analyzeTrade(
          { side: order.side, symbol: order.symbol, qty, price, thesis: order.thesis, stopLoss: order.stopLoss, takeProfit: order.takeProfit, role: order.role, realizedPnl, heldMs },
          ctx,
        );

        const trade: Trade = {
          id: uid(),
          orderId: order.id,
          symbol: order.symbol,
          side: order.side,
          qty,
          price,
          at: Date.now(),
          role: order.role,
          thesis: order.thesis,
          stopLoss: order.stopLoss,
          takeProfit: order.takeProfit,
          realizedPnl,
          score: analysis.score,
          flags: analysis.flags,
          metrics: analysis.metrics,
          reviewStatus: "pending",
        };

        let orders = s.orders.map((o) => (o.id === order.id ? { ...o, status: "filled" as const, filledAt: Date.now(), fillPrice: price, qty } : o));

        // bracket legs for new buys, validated against the ACTUAL fill price. A leg that cannot be valid is never dropped silently.
        if (order.side === "buy") {
          const groupId = uid();
          const notes: string[] = [];
          if (order.stopLoss) {
            if (order.stopLoss < price) {
              orders.push({ id: uid(), symbol: order.symbol, side: "sell", type: "stop", qty, stopPrice: order.stopLoss, status: "open", role: "stop-loss", createdAt: Date.now(), groupId });
            } else {
              notes.push(`Stop-loss at ${usd(order.stopLoss)} was cancelled: it is at or above the ${usd(price)} fill, so it would sell immediately.`);
            }
          }
          if (order.takeProfit) {
            if (order.takeProfit > price) {
              orders.push({ id: uid(), symbol: order.symbol, side: "sell", type: "limit", qty, limitPrice: order.takeProfit, status: "open", role: "take-profit", createdAt: Date.now(), groupId });
            } else {
              notes.push(`Take-profit at ${usd(order.takeProfit)} was cancelled: it is at or below the ${usd(price)} fill.`);
            }
          }
          if (notes.length) {
            const note = notes.join(" ");
            orders = orders.map((o) => (o.id === order.id ? { ...o, note } : o));
            useToast.getState().push({ title: `${order.symbol} filled without ${notes.length > 1 ? "its exit legs" : order.stopLoss && order.stopLoss >= price ? "a stop-loss" : "a take-profit"}`, body: note, tone: "risk", href: "/dashboard" });
          }
        } else {
          // one-cancels-other; also cancel any sell legs that exceed what is left
          const remaining = positions[order.symbol]?.qty ?? 0;
          orders = orders.map((o) => {
            if (o.status !== "open" || o.symbol !== order.symbol || o.side !== "sell") return o;
            if (order.groupId && o.groupId === order.groupId) return { ...o, status: "cancelled" as const };
            if (remaining <= 0) return { ...o, status: "cancelled" as const };
            if (o.qty > remaining) return { ...o, qty: remaining };
            return o;
          });
        }

        const equity = equityOf(cash, positions, prices);
        set({
          cash,
          positions,
          orders,
          trades: [trade, ...s.trades].slice(0, 500),
          equityHistory: [...s.equityHistory, { t: Date.now(), v: equity }].slice(-3000),
          activeDays: s.activeDays.includes(today()) ? s.activeDays : [...s.activeDays, today()],
        });
        return trade.id;
      };

      const api: AppState = {
        profile: { name: "", handle: "", experience: "new", goal: "learn", onboarded: false },
        ...freshAccount(),
        watchlist: ["SPY", "AAPL", "NVDA", "MSFT", "TSLA"],
        xp: 0,
        completedLessons: {},
        missions: {},
        activeDays: [],
        posts: [],
        liked: {},
        comments: {},
        reported: {},
        following: {},
        chat: [],

        setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

        placeOrder: (input) => {
          const s = get();
          const price = useMarket.getState().prices[input.symbol];
          if (!price) return { ok: false, error: "There is no simulated price for that symbol. Pick a stock from Markets." };
          const qty = Math.floor(input.qty);
          if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: "Enter a whole number of shares, such as 10." };
          if (input.side === "buy") {
            // cash is checked at the price we would really pay: the slipped quote for market orders, the limit for limit orders
            const trigger = input.limitPrice;
            const cashRef = input.type === "limit" && trigger ? Math.max(trigger, expectedFill("buy", "market", price)) : expectedFill("buy", input.type, price, trigger);
            if (qty * cashRef > s.cash) return { ok: false, error: `Not enough cash. You can afford ${Math.floor(s.cash / cashRef)} shares.` };
            // exits are checked against where the order will actually fill (a limit above the market fills at the market)
            const fillRef = expectedFill("buy", input.type, price, trigger);
            if (input.stopLoss && input.stopLoss >= fillRef) return { ok: false, error: `Your stop-loss must be below ${usd(fillRef)}, the price this order would fill at.` };
            if (input.takeProfit && input.takeProfit <= fillRef) return { ok: false, error: `Your take-profit must be above ${usd(fillRef)}, the price this order would fill at.` };
          } else {
            const held = s.positions[input.symbol]?.qty ?? 0;
            if (qty > held) return { ok: false, error: held ? `You only hold ${held} shares.` : `You don't own any ${input.symbol}.` };
          }
          if (input.type !== "market" && !(input.limitPrice || input.stopPrice)) return { ok: false, error: "Enter a trigger price. A limit or stop order waits for that price before it fills." };

          const order: Order = {
            id: uid(),
            symbol: input.symbol,
            side: input.side,
            type: input.type,
            qty,
            limitPrice: input.limitPrice,
            stopPrice: input.stopPrice,
            status: "open",
            role: input.side === "buy" ? "entry" : "exit",
            createdAt: Date.now(),
            thesis: input.thesis?.trim().slice(0, 1000) || undefined,
            stopLoss: input.side === "buy" ? input.stopLoss : undefined,
            takeProfit: input.side === "buy" ? input.takeProfit : undefined,
          };
          set({ orders: [order, ...s.orders] });
          if (order.type === "market") {
            // tiny slippage so market orders feel real
            const tradeId = fill(order, marketFillPrice(order.side, price));
            if (!tradeId) {
              set((st) => ({ orders: st.orders.map((o) => (o.id === order.id ? { ...o, status: "cancelled" as const } : o)) }));
              return { ok: false, error: "The order was not filled. Check your cash and shares, then try again." };
            }
            return { ok: true, tradeId, orderId: order.id };
          }
          return { ok: true, orderId: order.id };
        },

        cancelOrder: (id) => set((s) => ({ orders: s.orders.map((o) => (o.id === id && o.status === "open" ? { ...o, status: "cancelled" as const } : o)) })),

        processPrices: (prices) => {
          const filled: string[] = [];
          const open = get().orders.filter((o) => o.status === "open");
          for (const o of open) {
            const cur = get().orders.find((x) => x.id === o.id);
            if (!cur || cur.status !== "open") continue; // may have been cancelled by an OCO sibling
            const p = prices[o.symbol];
            if (!p) continue;
            let trigger = false;
            if (o.type === "limit") trigger = o.side === "buy" ? p <= (o.limitPrice ?? 0) : p >= (o.limitPrice ?? Infinity);
            if (o.type === "stop") trigger = o.side === "sell" ? p <= (o.stopPrice ?? 0) : p >= (o.stopPrice ?? Infinity);
            if (trigger) {
              const id = fill(o, p);
              if (id) filled.push(id);
              else {
                const why = o.side === "buy" ? "not enough cash" : "no shares left to sell";
                set((s) => ({ orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: "cancelled" as const, note: `Cancelled: ${why}.` } : x)) }));
                useToast.getState().push({ title: `${o.symbol} order cancelled`, body: `Your ${o.type} ${o.side} could not fill: ${why}.`, tone: "warn", href: "/dashboard" });
              }
            }
          }
          // equity snapshot every ~10s
          const s = get();
          const last = s.equityHistory[s.equityHistory.length - 1];
          if (!last || Date.now() - last.t > 10_000) {
            set({ equityHistory: [...s.equityHistory, { t: Date.now(), v: equityOf(s.cash, s.positions, prices) }].slice(-3000) });
          }
          return filled;
        },

        setReview: (tradeId, review) =>
          set((s) => ({
            trades: s.trades.map((t) => (t.id === tradeId ? { ...t, review: review ?? t.review, reviewStatus: review ? "done" : "error" } : t)),
          })),

        toggleWatch: (symbol) =>
          set((s) => ({ watchlist: s.watchlist.includes(symbol) ? s.watchlist.filter((x) => x !== symbol) : [...s.watchlist, symbol] })),

        completeLesson: (slug, quiz) =>
          set((s) => {
            const first = !s.completedLessons[slug];
            const prevQuiz = s.completedLessons[slug]?.quiz ?? 0;
            const bonus = (first ? 50 : 0) + (quiz === 1 && prevQuiz < 1 ? 25 : 0);
            return {
              completedLessons: { ...s.completedLessons, [slug]: { at: Date.now(), quiz: Math.max(quiz, prevQuiz) } },
              xp: s.xp + bonus,
              activeDays: s.activeDays.includes(today()) ? s.activeDays : [...s.activeDays, today()],
            };
          }),

        completeMission: (id, xp) =>
          set((s) => (s.missions[id] ? s : { missions: { ...s.missions, [id]: Date.now() }, xp: s.xp + xp })),

        addXp: (n) => set((s) => ({ xp: s.xp + n })),

        addPost: (p) => {
          const id = uid();
          set((s) => ({ posts: [{ ...p, id, at: Date.now(), likes: 0, authorId: ME }, ...s.posts] }));
          return id;
        },

        toggleLike: (postId) => set((s) => ({ liked: { ...s.liked, [postId]: !s.liked[postId] } })),

        addComment: (postId, body, authorId = ME) =>
          set((s) => ({
            comments: { ...s.comments, [postId]: [...(s.comments[postId] ?? []), { id: uid(), authorId, body, at: Date.now() }] },
          })),

        reportItem: (id) => set((s) => ({ reported: { ...s.reported, [id]: true } })),
        unreportItem: (id) =>
          set((s) => {
            const { [id]: _removed, ...rest } = s.reported;
            void _removed;
            return { reported: rest };
          }),

        toggleFollow: (userId) => set((s) => ({ following: { ...s.following, [userId]: !s.following[userId] } })),

        pushChat: (m) => {
          const id = uid();
          set((s) => ({ chat: [...s.chat, { ...m, id, at: Date.now() }].slice(-100) }));
          return id;
        },
        updateChat: (id, content) => set((s) => ({ chat: s.chat.map((c) => (c.id === id ? { ...c, content } : c)) })),
        clearChat: () => set({ chat: [] }),

        resetAccount: () => set({ ...freshAccount() }),
      };
      // every action first catches up with other tabs, and is re-run if a write was refused
      return guardActions("sp-app", api);
    },
    {
      name: "sp-app",
      version: 1,
      storage: guardedStorage,
      // keep older blobs instead of discarding them; merge() below validates every field
      migrate: (state) => state as AppState,
      merge: (persisted, current) => mergeApp(persisted, current),
    },
  ),
);

export function useEquity() {
  const cash = useApp((s) => s.cash);
  const positions = useApp((s) => s.positions);
  const prices = useMarket((s) => s.prices);
  return equityOf(cash, positions, prices);
}

export { equityOf };

// function declaration on purpose: persist hydrates while this module is still loading, so no const/TDZ
function isRec(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Validating merge: any malformed persisted field falls back to its default instead of crashing the app. */
function mergeApp(persisted: unknown, current: AppState): AppState {
  if (!isRec(persisted)) return current;
  const p = persisted;
  const out: Record<string, unknown> = { ...current };
  for (const k of ["orders", "equityHistory", "watchlist", "activeDays", "posts", "chat"] as const) if (Array.isArray(p[k])) out[k] = (p[k] as unknown[]).filter((x) => x != null);
  for (const k of ["completedLessons", "missions", "liked", "comments", "reported", "following"] as const) if (isRec(p[k])) out[k] = p[k];
  for (const k of ["cash", "xp"] as const) if (typeof p[k] === "number" && Number.isFinite(p[k])) out[k] = p[k];
  if (isRec(p.profile)) out.profile = { ...current.profile, ...p.profile };
  if (isRec(p.positions)) {
    const pos: Record<string, Position> = {};
    for (const [sym, v] of Object.entries(p.positions)) {
      if (isRec(v) && Number.isFinite(v.qty) && (v.qty as number) > 0 && Number.isFinite(v.avgCost)) pos[sym] = { ...(v as unknown as Position), symbol: sym, openedAt: Number.isFinite(v.openedAt) ? (v.openedAt as number) : Date.now() };
    }
    out.positions = pos;
  }
  if (Array.isArray(p.trades)) {
    out.trades = (p.trades as unknown[]).filter(isRec).map((t) => ({ ...t, flags: Array.isArray(t.flags) ? t.flags : [], metrics: isRec(t.metrics) ? t.metrics : {} }));
  }
  return out as unknown as AppState;
}
