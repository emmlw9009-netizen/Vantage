"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/store/app";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { deleteAllData } from "@/lib/data-controls";
import { Dialog } from "./dialog";
import { useHydrated } from "./providers";

export function consentRecord() {
  return { version: LEGAL.termsVersion, acceptedAt: new Date().toISOString() };
}

/** The clickwrap checkbox. Unchecked by default; links open in a new tab so nothing typed is lost. */
export function ConsentCheckbox({ checked, onChange, id = "consent" }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-[10px] bg-panel-2 p-4 text-left text-[15px] leading-snug">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
      <span>
        I’m {LEGAL.minimumAge} or older and I agree to the{" "}
        <Link href="/terms" target="_blank" rel="noopener" className="font-medium text-series-1 underline underline-offset-2">Terms of Service</Link> and{" "}
        <Link href="/privacy" target="_blank" rel="noopener" className="font-medium text-series-1 underline underline-offset-2">Privacy Policy</Link>. I understand {BRAND.name} is an educational simulator, not investment advice.
      </span>
    </label>
  );
}

/** Blocks the app for existing users whose consent is missing or for an older terms version. */
export function ConsentGate() {
  const hydrated = useHydrated();
  const onboarded = useApp((s) => s.profile.onboarded);
  const consent = useApp((s) => s.profile.consent);
  const setProfile = useApp((s) => s.setProfile);
  const [checked, setChecked] = useState(false);
  if (!hydrated || !onboarded || consent?.version === LEGAL.termsVersion) return null;
  const outdated = !!consent;
  return (
    <Dialog title={outdated ? "Our terms have changed" : "Please agree to continue"} z="z-[65]">
      <p className="mt-2 text-ink-2">
        {outdated ? "We updated the Terms of Service or Privacy Policy. " : ""}
        To keep using {BRAND.name}, please read and agree. You can read both pages before you decide, and your data stays on your device.
      </p>
      <div className="mt-5">
        <ConsentCheckbox checked={checked} onChange={setChecked} id="consent-gate" />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => window.confirm("Delete all your data from this browser and leave?") && deleteAllData()} className="min-h-11 rounded-lg px-2 text-sm text-muted hover:text-ink">
          I don’t agree: delete my data
        </button>
        <button disabled={!checked} onClick={() => setProfile({ consent: consentRecord() })} className="inline-flex h-12 items-center rounded-[10px] bg-accent px-6 font-semibold text-accent-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40">
          Agree and continue
        </button>
      </div>
    </Dialog>
  );
}
