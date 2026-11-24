"use client";

import { useApp } from "@/store/app";

export type CoachMode = "ai" | "offline";
let modeP: Promise<CoachMode> | null = null;

/** Asks the server once whether the AI coach is configured. Any failure counts as offline (nothing is sent). */
export function getCoachMode(): Promise<CoachMode> {
  if (!modeP) {
    modeP = fetch("/api/coach")
      .then((r) => r.json())
      .then((d) => (d?.mode === "ai" ? "ai" : "offline") as CoachMode)
      .catch(() => "offline" as CoachMode);
  }
  return modeP;
}

/**
 * May the app send data to the AI provider right now?
 * Offline mode sends nothing, so it is always fine. In AI mode the user must have seen the data notice.
 */
export async function aiAllowed(): Promise<boolean> {
  if (useApp.getState().profile.aiNoticeAt) return true;
  return (await getCoachMode()) !== "ai";
}
