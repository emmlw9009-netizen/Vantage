"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp, usePlan } from "@/store/app";
import { withWriteLock } from "@/store/sync";
import { FREE_COACH_PER_DAY, FREE_TRADES_PER_DAY, PLANS, canPreviewInTestMode, priceLabel } from "@/lib/plans";
import { Tag } from "@/components/marks";
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

const THEMES: readonly (readonly [Theme, string])[] = [["system", "Match my device"], ["light", "Light"], ["dark", "Dark"]];

const btn = "btn btn-secondary";

export default function SettingsPage() {
  const consent = useApp((s) => s.profile.consent);
  const handle = useApp((s) => s.profile.handle);
  const resetAccount = useApp((s) => s.resetAccount);
  const plan = usePlan();
  const planSource = useApp((s) => s.profile.planSource);
  const planChangedAt = useApp((s) => s.profile.planChangedAt);
  const testMode = plan !== "free" && planSource !== "server";
  // One click, no confirmation step, no "are you sure": cancelling is as easy as starting (Terms section 15).
  const cancelPlan = async () => {
    const ok = await withWriteLock(() => useApp.getState().setPlan("free", "test"));
    if (ok) push({ title: "Plan cancelled. You're on Free.", body: "Nothing was charged. Your trades, lessons and journal stay.", tone: "good" });
  };
  const push = useToast((s) => s.push);
  const [theme, setTheme] = useTheme();
  const [dialog, setDialog] = useState<null | "delete" | "reset">(null);
  const [typed, setTyped] = useState("");

  const copyInvite = async () => {
    const url = `${location.origin}/?ref=${encodeURIComponent(handle)}`;
    try {
      await navigator.clipboard.writeText(url);
      push({ title: "Invite link copied", tone: "good" });
    } catch {
      push({ title: "Couldn't copy the link", body: url, tone: "warn" });
    }
  };

  const close = () => {
    setDialog(null);
    setTyped("");
  };

  return (
    <div className="max-w-[880px]">
      <h1 className="t-title">Settings</h1>

      <section id="membership" className="mt-10 divide-y divide-rule border-t border-rule-strong" aria-labelledby="plan-h">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 max-w-md">
            <h2 id="plan-h" className="t-h2">Membership</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold" data-testid="plan-row">Plan: {PLANS[plan].name}</span>
              {testMode && <Tag>Test mode</Tag>}
            </p>
            <p className="mt-1 text-sm text-ink-2" data-testid="plan-detail">
              {plan === "free"
                ? `${FREE_TRADES_PER_DAY} trades and ${FREE_COACH_PER_DAY} coach messages a day, and the lessons in modules 1 and 2.`
                : testMode
                  ? `You're previewing ${PLANS[plan].name} in test mode${planChangedAt ? ` since ${new Date(planChangedAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}` : ""}. Payments aren't live yet, so nothing is charged. When they are, ${PLANS[plan].name} will be ${priceLabel(plan)} a month and we'll ask before any billing starts.`
                  : `${PLANS[plan].name}, ${priceLabel(plan)} a month.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/upgrade" className={btn}>
              See plans
            </Link>
            {plan !== "free" && canPreviewInTestMode(planSource) && (
              <button onClick={cancelPlan} className={btn}>
                Cancel plan
              </button>
            )}
          </div>
        </div>
      </section>

      {handle && (
        <section className="mt-10 divide-y divide-rule border-t border-rule-strong" aria-labelledby="invite-h">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0 max-w-md">
              <h2 id="invite-h" className="t-h2">Your invite link</h2>
              <p className="mt-0.5 break-all text-sm text-ink-2" data-testid="invite-link">
                /?ref={handle}
              </p>
              <p className="mt-1 text-sm text-ink-2">Share it with a friend who wants to practice. It only tells us which link they used.</p>
            </div>
            <button onClick={copyInvite} className={btn}>
              Copy invite link
            </button>
          </div>
        </section>
      )}

      <section className="mt-10 divide-y divide-rule border-t border-rule-strong" aria-labelledby="data-h">
        <div className="py-4">
          <h2 id="data-h" className="t-h2">Your data</h2>
          <p className="mt-1 text-sm text-ink-2">
            {BRAND.name} keeps your practice account, trades, progress and chat in this browser only. There is no account on our servers to export from or delete.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 max-w-md">
            <h3 className="font-semibold">Export my data</h3>
            <p className="text-sm text-ink-2">Downloads a JSON file with everything saved in this browser except your theme setting: your account, orders, trades, profile, lessons and chat.</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 max-w-md">
            <h3 className="font-semibold">Delete all my data</h3>
            <p className="text-sm text-ink-2">Permanently erases everything saved in this browser, including your profile and your agreement record, and takes you back to the start. This cannot be undone. When the app reloads it creates a fresh set of simulated prices, which holds no personal data.</p>
          </div>
          <button onClick={() => setDialog("delete")} className="btn btn-danger">
            Delete all my data
          </button>
        </div>
      </section>

      <section className="mt-10 divide-y divide-rule border-t border-rule-strong" aria-labelledby="practice-h">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 max-w-md">
            <h2 id="practice-h" className="t-h2">Practice account</h2>
            <p className="mt-1 text-sm text-ink-2">Puts your cash back to $100,000 and clears positions, open orders, trades and the account chart. Your profile, lessons, XP and chat stay.</p>
          </div>
          <button onClick={() => setDialog("reset")} className={btn}>
            Reset practice account
          </button>
        </div>
      </section>

      <section className="mt-10 border-t border-rule-strong pt-5" aria-labelledby="theme-h">
        <h2 id="theme-h" className="t-h2">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="mt-3 flex flex-wrap gap-2">
          {THEMES.map(([v, label], i) => (
            <button
              key={v}
              id={`theme-${v}`}
              role="radio"
              aria-checked={theme === v}
              tabIndex={theme === v ? 0 : -1}
              onClick={() => setTheme(v)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const next = THEMES[(i + d + THEMES.length) % THEMES.length][0];
                setTheme(next);
                document.getElementById(`theme-${next}`)?.focus();
              }}
              className={cn("btn min-h-11 border px-4", theme === v ? "border-ink bg-ink text-on-ink" : "border-edge text-ink hover:bg-well")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-rule-strong pt-5" aria-labelledby="legal-h">
        <h2 id="legal-h" className="t-h2">Legal</h2>
        <p className="mt-1 text-sm text-ink-2" data-testid="consent-record">
          {consent ? `You agreed to version ${consent.version} of the terms on ${new Date(consent.acceptedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.` : "No agreement recorded."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <li><Link className="link inline-flex min-h-10 items-center" href="/terms">Terms of service</Link></li>
          <li><Link className="link inline-flex min-h-10 items-center" href="/privacy">Privacy policy</Link></li>
          <li><Link className="link inline-flex min-h-10 items-center" href="/disclaimer">Disclaimer</Link></li>
        </ul>
        <p className="mt-1 text-sm text-ink-2">{/^\[.*\]$/.test(LEGAL.contactEmail) ? "Contact details will appear here." : `Questions about your data: ${LEGAL.contactEmail}`}</p>
      </section>

      {dialog === "delete" && (
        <Dialog title="Delete all your data?" onClose={close}>
          <p className="mt-2 text-ink-2">This erases your practice account, trades, progress, chat and profile from this browser. It cannot be undone. Export first if you want a copy.</p>
          <label htmlFor="delete-confirm" className="mt-5 block text-sm font-medium">Type DELETE to confirm</label>
          <input id="delete-confirm" data-autofocus autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="field mt-1.5" />
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={close} className={btn}>Cancel</button>
            <button disabled={typed !== "DELETE"} onClick={deleteAllData} className="btn btn-danger-fill">
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
              className="btn btn-primary"
            >
              Reset account
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
