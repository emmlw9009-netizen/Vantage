"use client";

import { useApp } from "@/store/app";
import { LEGAL } from "@/lib/legal";

export type CoachMode = "ai" | "offline" | "unknown";

/**
 * Asks the server whether the AI coach is configured. Only a successful GET answering mode "ai" counts as AI.
 * A failed or malformed probe is "unknown" and is never cached: the next attempt probes again.
 */
export async function probeCoachMode(): Promise<CoachMode> {
  try {
    const r = await fetch("/api/coach", { cache: "no-store" });
    if (!r.ok) return "unknown";
    const d = await r.json();
    return d?.mode === "ai" ? "ai" : d?.mode === "offline" ? "offline" : "unknown";
  } catch {
    return "unknown";
  }
}

/** send: the AI provider may receive data. offline: use local rules, send nothing. wait: AI is on but the user has not seen the notice yet. */
export type AiGate = "send" | "offline" | "wait";

export const AI_CHECK_EVENT = "vantage:ai-check";

/** True once the user is onboarded and has agreed to the current terms. Nothing may leave the device before that. */
export function hasCurrentConsent(): boolean {
  const p = useApp.getState().profile;
  return !!p.onboarded && p.consent?.version === LEGAL.termsVersion;
}

/** Pure decision from a probe result, so the page header, footer and behaviour all agree. */
export function gateFor(mode: CoachMode): AiGate {
  if (mode !== "ai") return "offline";
  if (useApp.getState().profile.aiNoticeAt) return "send";
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AI_CHECK_EVENT));
  return "wait";
}

/**
 * The only way client code may decide to POST user data to /api/coach or /api/review.
 * Data is sent only when consent is current, AI mode is positively confirmed AND the user has acknowledged the data notice.
 * Without current consent (or before it), "wait": no probe, no request, no review of any kind.
 */
export async function aiGate(): Promise<AiGate> {
  if (!hasCurrentConsent()) return "wait";
  return gateFor(await probeCoachMode());
}
