"use client";

import { useApp, usePlan } from "@/store/app";
import { PLANS } from "@/lib/plans";
import { PlanLedger } from "@/components/plan-ledger";

export default function UpgradePage() {
  const plan = usePlan();
  const source = useApp((s) => s.profile.planSource);
  const where = plan === "free" ? "You're on Free." : source === "server" ? `You're on ${PLANS[plan].name}.` : `You're previewing ${PLANS[plan].name} in test mode.`;
  return (
    <div className="max-w-[1100px]">
      <h1 className="t-title">Plans</h1>
      <p className="mt-2 max-w-[72ch] t-lead">
        {where} Compare what each plan includes. Every plan uses practice money in a simulated market.
      </p>
      <div className="mt-8">
        <PlanLedger where="app" />
      </div>
    </div>
  );
}
