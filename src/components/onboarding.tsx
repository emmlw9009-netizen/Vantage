"use client";

import { useState } from "react";
import { useApp, Profile } from "@/store/app";
import { cn } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Avatar } from "./ui";
import { ConsentCheckbox, consentRecord } from "./consent";

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
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Welcome" className="card w-full max-w-lg p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-2">
          <Avatar id="u7" size={24} /> Coach Nova
          <span className="ml-auto text-sm text-muted">Step {step + 1} of 3</span>
        </div>
        {step === 0 && (
          <>
            <h2 className="font-display text-3xl font-bold leading-tight">Welcome to {BRAND.name}. You have $100,000 of paper money.</h2>
            <p className="mt-2 text-ink-2">I'm your AI coach. I'll review every trade you make, teach you what the pros do, and help you build a strategy. First, what should I call you?</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agreed && setStep(1)} placeholder="Your first name" className="mt-6 h-12 w-full rounded-[10px] bg-panel-2 px-4 outline-none focus:ring-2 focus:ring-accent" />
            <div className="mt-4">
              <ConsentCheckbox checked={agreed} onChange={setAgreed} />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-display text-3xl font-bold leading-tight">How much investing experience do you have?</h2>
            <div className="mt-6 grid gap-2">
              {EXP.map((o) => (
                <Choice key={o.v} active={exp === o.v} onClick={() => setExp(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-display text-3xl font-bold leading-tight">What's your main goal?</h2>
            <div className="mt-6 grid gap-2">
              {GOALS.map((o) => (
                <Choice key={o.v} active={goal === o.v} onClick={() => setGoal(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => (step ? setStep(step - 1) : finish())} disabled={!step && !agreed} className="h-11 rounded-lg px-2 text-sm text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
            {step ? "Back" : "Skip"}
          </button>
          <button onClick={() => (step < 2 ? setStep(step + 1) : finish())} disabled={step === 0 && !agreed} className="inline-flex h-12 items-center rounded-[10px] bg-accent px-6 font-semibold text-accent-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40">
            {step < 2 ? "Continue" : "Start trading"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Choice({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button onClick={onClick} className={cn("rounded-[10px] border p-4 text-left transition", active ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line hover:bg-panel-2")}>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-muted">{sub}</div>
    </button>
  );
}
