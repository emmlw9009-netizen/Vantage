"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/store/app";
import { useToast } from "@/store/toast";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { deleteAllData, downloadExport } from "@/lib/data-controls";
import { Dialog } from "@/components/dialog";
import { cn } from "@/lib/format";

type Theme = "system" | "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("sp-theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);
  const choose = (t: Theme) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("sp-theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("sp-theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  };
  return [theme, choose] as const;
}

const btn = "inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-panel-2";

export default function SettingsPage() {
  const consent = useApp((s) => s.profile.consent);
  const resetAccount = useApp((s) => s.resetAccount);
  const push = useToast((s) => s.push);
  const [theme, setTheme] = useTheme();
  const [dialog, setDialog] = useState<null | "delete" | "reset">(null);
  const [typed, setTyped] = useState("");

  const close = () => {
    setDialog(null);
    setTyped("");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>

      <section className="card divide-y divide-line" aria-labelledby="plan-h">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 id="plan-h" className="font-display text-xl font-semibold">Membership</h2>
            <p className="mt-0.5 text-sm text-ink-2" data-testid="plan-row">Plan: Free</p>
          </div>
        </div>
      </section>

      <section className="card divide-y divide-line" aria-labelledby="data-h">
        <div className="p-5">
          <h2 id="data-h" className="font-display text-xl font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-ink-2">
            {BRAND.name} keeps your practice account, trades, progress and chat in this browser only. There is no account on our servers to export from or delete.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0 max-w-md">
            <h3 className="font-medium">Export my data</h3>
            <p className="text-sm text-ink-2">Downloads a JSON file with everything saved in this browser: your account, orders, trades, profile, lessons and chat.</p>
          </div>
          <button
            onClick={() => {
              downloadExport();
              push({ title: "Data exported", body: "A JSON file was downloaded.", tone: "good" });
            }}
            className={btn}
          >
            Export my data
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0 max-w-md">
            <h3 className="font-medium">Delete all my data</h3>
            <p className="text-sm text-ink-2">Permanently erases everything saved in this browser, including your profile and your agreement record, and takes you back to the start. This cannot be undone.</p>
          </div>
          <button onClick={() => setDialog("delete")} className={cn(btn, "border-down text-down hover:bg-risk-bg")}>
            Delete all my data
          </button>
        </div>
      </section>

      <section className="card divide-y divide-line" aria-labelledby="practice-h">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0 max-w-md">
            <h2 id="practice-h" className="font-display text-xl font-semibold">Practice account</h2>
            <p className="mt-1 text-sm text-ink-2">Puts your cash back to $100,000 and clears positions, open orders, trades and the account chart. Your profile, lessons, XP and chat stay.</p>
          </div>
          <button onClick={() => setDialog("reset")} className={btn}>
            Reset practice account
          </button>
        </div>
      </section>

      <section className="card p-5" aria-labelledby="theme-h">
        <h2 id="theme-h" className="font-display text-xl font-semibold">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="mt-3 flex flex-wrap gap-2">
          {([["system", "Match my device"], ["light", "Light"], ["dark", "Dark"]] as const).map(([v, label]) => (
            <button
              key={v}
              role="radio"
              aria-checked={theme === v}
              onClick={() => setTheme(v)}
              className={cn("h-11 rounded-[10px] border px-4 text-sm font-medium", theme === v ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line hover:bg-panel-2")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5" aria-labelledby="legal-h">
        <h2 id="legal-h" className="font-display text-xl font-semibold">Legal</h2>
        <p className="mt-1 text-sm text-ink-2" data-testid="consent-record">
          {consent ? `You agreed to version ${consent.version} of the terms on ${new Date(consent.acceptedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.` : "No agreement recorded."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <li><Link className="inline-flex min-h-10 items-center font-medium text-series-1 underline underline-offset-2" href="/terms">Terms of service</Link></li>
          <li><Link className="inline-flex min-h-10 items-center font-medium text-series-1 underline underline-offset-2" href="/privacy">Privacy policy</Link></li>
          <li><Link className="inline-flex min-h-10 items-center font-medium text-series-1 underline underline-offset-2" href="/disclaimer">Disclaimer</Link></li>
        </ul>
        <p className="mt-1 text-sm text-ink-2">Questions about your data: {LEGAL.contactEmail}</p>
      </section>

      {dialog === "delete" && (
        <Dialog title="Delete all your data?" onClose={close}>
          <p className="mt-2 text-ink-2">This erases your practice account, trades, progress, chat and profile from this browser. It cannot be undone. Export first if you want a copy.</p>
          <label htmlFor="delete-confirm" className="mt-5 block text-sm font-medium">Type DELETE to confirm</label>
          <input id="delete-confirm" data-autofocus autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1.5 h-12 w-full rounded-[10px] bg-panel-2 px-4 outline-none focus:ring-2 focus:ring-accent" />
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={close} className={btn}>Cancel</button>
            <button disabled={typed !== "DELETE"} onClick={deleteAllData} className="inline-flex h-11 items-center rounded-[10px] bg-down px-4 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40">
              Delete everything
            </button>
          </div>
        </Dialog>
      )}
      {dialog === "reset" && (
        <Dialog title="Reset your practice account?" onClose={close}>
          <p className="mt-2 text-ink-2">Your cash goes back to $100,000, and your positions, open orders and trades are cleared. Lessons, XP, chat and your profile stay.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={close} className={btn}>Cancel</button>
            <button
              data-autofocus
              onClick={() => {
                resetAccount();
                close();
                push({ title: "Practice account reset", body: "You have $100,000 again.", tone: "good" });
              }}
              className="inline-flex h-11 items-center rounded-[10px] bg-accent px-4 text-sm font-semibold text-accent-ink"
            >
              Reset account
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
