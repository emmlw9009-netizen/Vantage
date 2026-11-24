"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/store/app";
import { LEGAL } from "@/lib/legal";
import { AI_CHECK_EVENT, probeCoachMode } from "@/lib/ai-notice";
import { Dialog } from "./dialog";
import { useHydrated } from "./providers";

/** One-time notice before any data goes to the AI provider. Never shown in offline mode. */
export function AiNotice() {
  const hydrated = useHydrated();
  const onboarded = useApp((s) => s.profile.onboarded);
  const consented = useApp((s) => s.profile.consent?.version === LEGAL.termsVersion);
  const seen = useApp((s) => s.profile.aiNoticeAt);
  const setProfile = useApp((s) => s.setProfile);
  const [ai, setAi] = useState(false);
  const need = hydrated && onboarded && consented && !seen;

  const check = useCallback(() => {
    probeCoachMode().then((m) => {
      if (m === "ai") setAi(true);
      return m;
    });
  }, []);

  useEffect(() => {
    if (!need) return;
    check();
    // A failed probe is not cached: keep asking until the server gives a definite answer.
    const id = setInterval(() => {
      probeCoachMode().then((m) => {
        if (m === "ai") setAi(true);
        if (m !== "unknown") clearInterval(id);
      });
    }, 4000);
    window.addEventListener(AI_CHECK_EVENT, check);
    return () => {
      clearInterval(id);
      window.removeEventListener(AI_CHECK_EVENT, check);
    };
  }, [need, check]);

  if (!need || !ai) return null;
  return (
    <Dialog title="Nova uses an AI service" z="z-[64]">
      <p className="mt-2 text-ink-2">To write replies and trade reviews, the app sends the following to Anthropic, our AI provider:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px]">
        <li>your display name</li>
        <li>your simulated portfolio and trades</li>
        <li>your progress, and the text of the messages and posts you send to Nova</li>
      </ul>
      <p className="mt-3 text-sm text-ink-2">
        Nova can be wrong and is not investment advice. Read how this data is handled in the{" "}
        <Link href="/privacy#ai" target="_blank" rel="noopener" className="link font-medium">Privacy Policy</Link>.
      </p>
      <div className="mt-6 flex justify-end">
        <button data-autofocus onClick={() => setProfile({ aiNoticeAt: new Date().toISOString() })} className="btn btn-primary btn-lg">
          I understand
        </button>
      </div>
    </Dialog>
  );
}
