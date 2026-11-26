/**
 * Event layer for marketing measurement (Meta Pixel / Conversions API ready).
 * - No NEXT_PUBLIC_META_PIXEL_ID: every function here is a no-op and nothing is loaded.
 * - With an ID: the Pixel script loads only after the visitor chooses "Allow marketing cookies".
 * - Never sends personal data: only the whitelisted, non-identifying props below leave the browser.
 */
export type TrackEvent = "CompleteRegistration" | "FirstTrade" | "FirstTradeWithStopLoss" | "LessonComplete" | "ShareScore";

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
export const MARKETING_CONSENT_KEY = "sp-marketing-consent";
export type MarketingChoice = "granted" | "denied";

/** The only props that may be sent. Names, handles, free text and amounts are never on this list. */
const SAFE_PROPS = new Set(["lesson", "score", "label", "side", "symbol", "with_stop"]);

type Fbq = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readMarketingChoice(): MarketingChoice | null {
  try {
    const v = localStorage.getItem(MARKETING_CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveMarketingChoice(c: MarketingChoice) {
  try {
    localStorage.setItem(MARKETING_CONSENT_KEY, c);
  } catch {}
  if (c === "granted") loadPixel();
}

export function sanitizeProps(props?: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (!SAFE_PROPS.has(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 40);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Inject the Pixel once. Only called after explicit consent, and only when an ID is configured. */
export function loadPixel() {
  if (!PIXEL_ID || typeof window === "undefined" || window.fbq) return;
  const fbq = function (...a: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...a);
    else (fbq.queue as unknown[]).push(a);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = window._fbq = fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");
}

/** Fire a marketing event. Safe to call anywhere; never throws. */
export function track(event: TrackEvent, props?: Record<string, unknown>) {
  try {
    if (!PIXEL_ID || typeof window === "undefined") return;
    if (readMarketingChoice() !== "granted") return;
    loadPixel();
    const standard = event === "CompleteRegistration";
    window.fbq?.(standard ? "track" : "trackCustom", event, sanitizeProps(props));
  } catch {}
}
