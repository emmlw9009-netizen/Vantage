import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { PLANS } from "@/lib/plans";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";
import { PlanLedger } from "@/components/plan-ledger";
import { MotionProvider } from "@/components/motion/provider";

const title = `Pricing: Free, Premium and Elite | ${BRAND.name}`;
const description = `Start free with $100,000 in practice money. Premium is $${PLANS.premium.price} a month and Elite $${PLANS.elite.price} a month. Payments aren't live yet, so paid plans can be previewed in test mode at no charge.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing" },
  openGraph: { type: "website", title, description, url: "/pricing", images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
};

export default function Pricing() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main id="main" className="mx-auto max-w-[1264px] px-4 pb-20 pt-12 lg:px-8 lg:pt-20">
        <h1 className="t-title max-w-[18ch]">Pricing</h1>
        <p className="mt-5 max-w-[60ch] t-lead">
          Start free with practice money. Premium removes the daily limits, and Elite adds a weekly review and a learning plan built from your own trades.
        </p>
        <div className="mt-10 max-w-[1100px]">
          <MotionProvider>
            <PlanLedger where="public" />
          </MotionProvider>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
