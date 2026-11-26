"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useApp, usePlan } from "@/store/app";
import { useToast } from "@/store/toast";
import { withWriteLock } from "@/store/sync";
import { COMPARISON, FREE_COACH_PER_DAY, FREE_TRADES_PER_DAY, PLANS, PLAN_IDS, RENEWAL_TEXT, TEST_MODE_TEXT, canPreviewInTestMode, priceLabel, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/format";
import { Dialog } from "./dialog";
import { InkTick, Tag } from "./marks";
import { Segmented } from "./ui";

/**
 * The plan comparison ledger (docs/design/direction.md §8.12, §12.13), shared by /pricing (public) and /upgrade (app).
 * Desktop: one ruled table, three plan columns. Phone: a plan radiogroup and one column at a time. The renewal terms sit
 * under every button that starts a plan, and every such button opens the test-mode dialog first: payments are not live,
 * so a plan can only be previewed, at no charge.
 */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function Value({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <span className="inline-flex items-center">
        <InkTick />
        <span className="sr-only">Included</span>
      </span>
    );
  if (v === false)
    return (
      <span className="text-muted">
        <span aria-hidden>—</span>
        <span className="sr-only">Not included</span>
      </span>
    );
  return <span className="tnum">{v}</span>;
}

/** Name, tagline, price and the action for one plan. `current` is null until the browser state is known. */
function PlanHead({ id, current, source, primary, onPreview, where }: { id: PlanId; current: PlanId | null; source?: "test" | "server"; primary: boolean; onPreview: (id: PlanId) => void; where: "public" | "app" }) {
  const p = PLANS[id];
  const isCurrent = current === id;
  return (
    <div className="min-w-0 font-normal">
      <span className="flex flex-wrap items-center gap-2">
        <span className="t-h2">{p.name}</span>
        {p.popular && <Tag kind="fill">Most popular</Tag>}
      </span>
      <span className="mt-1 block min-h-10 max-w-[30ch] t-small text-ink-2">{p.tagline}</span>
      <span className="mt-4 flex items-baseline gap-2">
        <span className="t-readout tnum">{priceLabel(id)}</span>
        <span className="t-small text-ink-2">a month</span>
      </span>
      <div className="mt-4 md:min-h-[116px]" data-plan-cta={id}>
        {isCurrent ? (
          <>
            <span className="flex min-h-10 flex-wrap items-center gap-2 t-small font-semibold" data-testid={`current-${id}`}>
              Your current plan
              {id !== "free" && source !== "server" && <Tag>Test mode</Tag>}
            </span>
            {id !== "free" && (
              <Link href="/settings#membership" className="link inline-flex min-h-10 items-center t-small">
                Cancel in Settings
              </Link>
            )}
          </>
        ) : id === "free" ? (
          current == null && where === "public" ? (
            <Link href="/dashboard" className="btn btn-secondary">
              Start free
            </Link>
          ) : (
            <span className="block t-small text-ink-2">
              To go back to Free, cancel your plan in{" "}
              <Link href="/settings#membership" className="link">
                Settings
              </Link>
              .
            </span>
          )
        ) : !canPreviewInTestMode(source) ? (
          <Link href="/settings#membership" className="btn btn-secondary">
            Change plan in Settings
          </Link>
        ) : (
          <>
            <button onClick={() => onPreview(id)} aria-haspopup="dialog" className={cn("btn w-full sm:w-auto", primary ? "btn-primary" : "btn-secondary")}>
              Preview {p.name}
            </button>
            <span className="mt-2 block max-w-[34ch] t-micro text-ink-2" data-renewal>
              {RENEWAL_TEXT}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function PlanLedger({ where }: { where: "public" | "app" }) {
  const mounted = useMounted();
  const stored = usePlan();
  const source = useApp((s) => s.profile.planSource);
  const onboarded = useApp((s) => s.profile.onboarded);
  const router = useRouter();
  // The app shell renders only after the browser state has loaded; the public page waits one render so the server HTML matches.
  // A visitor who hasn't started yet has no current plan: the public page offers "Start free" instead.
  const current: PlanId | null = where === "app" ? stored : mounted && onboarded ? stored : null;
  const [view, setView] = useState<PlanId>("premium");
  const [confirm, setConfirm] = useState<PlanId | null>(null);
  useEffect(() => {
    if (current) setView(current === "free" ? "premium" : current === "premium" ? "elite" : "elite");
  }, [current]);

  // exactly one primary button: the next plan up from where the user is
  const primaryId: PlanId = current === "premium" || current === "elite" ? "elite" : "premium";

  const preview = async (id: PlanId) => {
    const ok = await withWriteLock(() => useApp.getState().setPlan(id, "test"));
    setConfirm(null);
    if (!ok) return;
    useToast.getState().push({ title: `Previewing ${PLANS[id].name} in test mode`, body: "Nothing was charged. Cancel anytime in Settings.", tone: "good" });
    if (where === "public") router.push("/dashboard");
  };

  const head = (id: PlanId) => <PlanHead id={id} current={current} source={source} primary={id === primaryId} onPreview={setConfirm} where={where} />;

  return (
    <div data-testid="plan-ledger">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-rule py-3 t-small" data-testid="test-mode-note">
        <Tag>Test mode</Tag>
        <span className="min-w-0 flex-1">Payments aren&apos;t live yet. You can preview Premium or Elite in test mode at no charge, and nothing is billed.</span>
      </p>

      {/* desktop and tablet: the full comparison ledger */}
      <div className="mt-8 hidden md:block">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">What each plan includes: Free, Premium and Elite</caption>
          <colgroup>
            <col className="w-[28%]" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <td className="border-t-2 border-transparent" />
              {PLAN_IDS.map((id) => (
                <th key={id} scope="col" className={cn("border-t-2 px-4 pb-4 pt-5 text-left align-top", id === "premium" ? "border-ink" : "border-rule-strong")}>
                  {head(id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((g) => (
              <Fragment key={g.group}>
                <tr>
                  <th colSpan={4} scope="colgroup" className="border-b border-rule-strong pb-2 pt-8 text-left t-small font-semibold">
                    {g.group}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-rule">
                    <th scope="row" className="py-3 pr-4 text-left align-top t-small font-normal">
                      {r.label}
                      {r.note && <span className="mt-0.5 block t-micro text-ink-2">{r.note}</span>}
                    </th>
                    {PLAN_IDS.map((id) => (
                      <td key={id} className="px-4 py-3 align-top t-small">
                        <Value v={r.values[id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone: one plan at a time */}
      <div className="mt-6 md:hidden">
        <Segmented label="Plan" value={view} onChange={setView} options={PLAN_IDS.map((id) => ({ value: id, label: PLANS[id].name }))} stretch />
        <div className="mt-6 border-t-2 border-ink pt-5">{head(view)}</div>
        {COMPARISON.map((g) => (
          <section key={g.group} className="mt-6" aria-label={`${g.group}, ${PLANS[view].name}`}>
            <h2 className="border-b border-rule-strong pb-2 t-small font-semibold">{g.group}</h2>
            <dl>
              {g.rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-rule py-3 t-small">
                  <dt className="min-w-0">
                    {r.label}
                    {r.note && <span className="mt-0.5 block t-micro text-ink-2">{r.note}</span>}
                  </dt>
                  <dd className="text-right">
                    <Value v={r.values[view]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <p className="mt-6 max-w-[72ch] t-small text-ink-2">
        Prices are in US dollars, per month. Taxes may apply where the law requires them. Renewal, cancellation and refunds are explained in section 15 of the{" "}
        <Link href="/terms#paid-plans" className="link">
          Terms of service
        </Link>
        . Every plan uses practice money in a simulated market. Nothing here is investment advice.
      </p>

      <section className="mt-12 max-w-[760px]" aria-labelledby="plan-faq-h">
        <h2 id="plan-faq-h" className="t-h2 border-b border-rule-strong pb-2">
          Questions
        </h2>
        <dl>
          {[
            ["What does test mode mean?", "Payments aren't live yet. Choosing Premium or Elite starts a free preview in this browser. No card is asked for and nothing is charged. Before any real billing starts, we'll tell you and ask you to choose again."],
            ["How do I cancel?", "In Settings, press Cancel plan. That's the only step, and you're back on Free at once."],
            ["What happens at the Free limits?", `After ${FREE_TRADES_PER_DAY} trades in a day, new buys pause until midnight. Selling to close a position always works, and stop-loss and take-profit exits always run. Nova answers ${FREE_COACH_PER_DAY} messages a day.`],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-rule py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 max-w-[66ch] t-small text-ink-2">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {confirm && (
        <Dialog title={`Preview ${PLANS[confirm].name}`} onClose={() => setConfirm(null)}>
          <div data-plan-cta={`dialog-${confirm}`} data-testid="test-mode-dialog">
            <p className="mt-2">{TEST_MODE_TEXT}</p>
            <ul className="mt-3 space-y-1 t-small text-ink-2">
              <li>{PLANS[confirm].name} unlocks in this browser straight away.</li>
              <li>No card is asked for and nothing is charged.</li>
              <li>You can go back to Free in Settings with one click.</li>
            </ul>
            <p className="mt-4 t-micro text-ink-2" data-renewal>
              When payments go live, {PLANS[confirm].name} will be {priceLabel(confirm)} a month. {RENEWAL_TEXT} We&apos;ll ask you before any billing starts.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => preview(confirm)} className="btn btn-primary">
                Preview {PLANS[confirm].name}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
