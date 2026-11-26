"use client";

import { useRef, useState } from "react";
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
            <label htmlFor="onboarding-name" className="mt-5 block t-small font-medium text-ink-2">
              First name
            </label>
            <input id="onboarding-name" autoComplete="given-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agreed && setStep(1)} placeholder="Your first name" className="field mt-1.5" maxLength={40} />
            <div className="mt-4">
              <ConsentCheckbox checked={agreed} onChange={setAgreed} />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="exp-h" className="t-h2">How much investing experience do you have?</h2>
            <ChoiceGroup labelledBy="exp-h" value={exp} onChange={setExp} options={EXP} />
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="goal-h" className="t-h2">What&apos;s your main goal?</h2>
            <ChoiceGroup labelledBy="goal-h" value={goal} onChange={setGoal} options={GOALS} />
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

/** A radiogroup of big rows. Arrow keys move and select, and only the selected row is in the tab order. */
function ChoiceGroup<T extends string>({ labelledBy, value, onChange, options }: { labelledBy: string; value: T; onChange: (v: T) => void; options: readonly { v: T; label: string; sub: string }[] }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.v === value));
  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (idx + dir + options.length) % options.length;
    onChange(options[n].v);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} onKeyDown={onKey} className="mt-6 grid gap-2">
      {options.map((o, i) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={active}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={cn("flex min-h-14 items-center gap-3 rounded-md border px-4 py-3 text-left", active ? "border-ink bg-well" : "border-edge hover:bg-well")}
          >
            <span className={cn("size-4 shrink-0 rounded-[3px] border-[1.5px]", active ? "border-ink bg-ink shadow-[inset_0_0_0_3px_var(--well)]" : "border-edge")} aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium">{o.label}</span>
              <span className="block t-small text-ink-2">{o.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
