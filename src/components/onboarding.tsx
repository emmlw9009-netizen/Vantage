"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useApp, Profile } from "@/store/app";
import { cn } from "@/lib/format";

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

  const finish = () => {
    const clean = name.trim() || "Trader";
    setProfile({ name: clean, handle: clean.toLowerCase().replace(/[^a-z0-9]+/g, ""), experience: exp, goal, onboarded: true });
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card glow w-full max-w-lg p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-2">
          <Sparkles className="size-4 text-brand" /> Coach Nova
          <span className="ml-auto text-xs text-muted">{step + 1} / 3</span>
        </div>
        {step === 0 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome. You have $100,000 of paper money.</h2>
            <p className="mt-2 text-ink-2">I'm your AI coach. I'll review every trade you make, teach you what the pros do, and help you build a strategy. First, what should I call you?</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setStep(1)} placeholder="Your first name" className="mt-6 h-12 w-full rounded-2xl border border-line bg-panel-2 px-4 outline-none focus:border-line-strong" />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">How much investing experience do you have?</h2>
            <div className="mt-6 grid gap-2">
              {EXP.map((o) => (
                <Choice key={o.v} active={exp === o.v} onClick={() => setExp(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">What's your main goal?</h2>
            <div className="mt-6 grid gap-2">
              {GOALS.map((o) => (
                <Choice key={o.v} active={goal === o.v} onClick={() => setGoal(o.v)} label={o.label} sub={o.sub} />
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => (step ? setStep(step - 1) : finish())} className="text-sm text-muted hover:text-ink">
            {step ? "Back" : "Skip"}
          </button>
          <button onClick={() => (step < 2 ? setStep(step + 1) : finish())} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:brightness-95">
            {step < 2 ? "Continue" : "Start trading"} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Choice({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button onClick={onClick} className={cn("rounded-2xl border p-4 text-left transition", active ? "border-transparent bg-accent-soft ring-2 ring-accent" : "border-line hover:bg-panel-2")}>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-muted">{sub}</div>
    </button>
  );
}
