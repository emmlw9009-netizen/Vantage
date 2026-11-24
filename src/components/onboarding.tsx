"use client";

import { useState } from "react";
import { useApp, Profile } from "@/store/app";
import { cn } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { ConsentCheckbox, consentRecord } from "./consent";
import { Dialog } from "./dialog";

const EXP: { v: Profile["experience"]; label: string; sub: string }[] = [
  { v: "new", label: "Brand new", sub: "I've never bought a stock" },
  { v: "some", label: "A little", sub: "I've made a few trades" },
  { v: "experienced", label: "Experienced", sub: "I trade regularly" },
];
const GOALS: { v: Profile["goal"]; label: string; sub: string }[] = [
  { v: "learn", label: "Understand the market", sub: "Learn the fundamentals" },
  { v: "long-term", label: "Invest long-term", sub: "Build wealth over years" },
  { v: "active", label: "Trade actively", sub: "Swing and short-term trades" },
];

export function Onboarding() {
  const setProfile = useApp((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [exp, setExp] = useState<Profile["experience"]>("new");
  const [goal, setGoal] = useState<Profile["goal"]>("learn");
  const [agreed, setAgreed] = useState(false);

  const finish = () => {
    if (!agreed) return; // consent is never skipped
    const clean = name.trim() || "Trader";
    setProfile({ name: clean, handle: clean.toLowerCase().replace(/[^a-z0-9]+/g, ""), experience: exp, goal, onboarded: true, consent: consentRecord() });
  };

  return (
    <Dialog ariaLabel={`Welcome to ${BRAND.name}`} z="z-[60]">
      <div>
        <div className="mb-5 flex items-center gap-2 t-small">
          <span className="font-semibold">Nova</span>
          <span className="tag tag-nova">AI coach</span>
          <span className="tnum ml-auto text-ink-2">Step {step + 1} of 3</span>
        </div>
        {step === 0 && (
          <>
            <h2 className="t-h2">Welcome to {BRAND.name}. You have $100,000 in practice money.</h2>
            <p className="t-note mt-2 text-ink">I&apos;m Nova, your AI coach. I check every trade you place and point you to the lesson that helps. What should I call you?</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agreed && setStep(1)} placeholder="Your first name" className="field mt-5" maxLength={40} />
            <div className="mt-4">
              <ConsentCheckbox checked={agreed} onChange={setAgreed} />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="t-h2">How much investing experience do you have?</h2>
            <div className="mt-6 grid gap-2">
              {EXP.map((o) => (
                <Choice key={o.v} active={exp === o.v} onClick={() => setExp(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="t-h2">What&apos;s your main goal?</h2>
            <div className="mt-6 grid gap-2">
              {GOALS.map((o) => (
                <Choice key={o.v} active={goal === o.v} onClick={() => setGoal(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => (step ? setStep(step - 1) : finish())} disabled={!step && !agreed} className="btn btn-quiet disabled:border-transparent disabled:bg-transparent">
            {step ? "Back" : "Skip"}
          </button>
          <button onClick={() => (step < 2 ? setStep(step + 1) : finish())} disabled={step === 0 && !agreed} className="btn btn-primary btn-lg">
            {step < 2 ? "Continue" : "Start trading"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Choice({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn("flex min-h-14 items-center gap-3 rounded-md border px-4 py-3 text-left", active ? "border-ink bg-well" : "border-edge hover:bg-well")}>
      <span className={cn("size-4 shrink-0 rounded-full border-[1.5px]", active ? "border-ink bg-ink shadow-[inset_0_0_0_3px_var(--well)]" : "border-edge")} aria-hidden />
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block t-small text-ink-2">{sub}</span>
      </span>
    </button>
  );
}
