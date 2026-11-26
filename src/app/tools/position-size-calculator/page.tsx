import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { PositionSizeWidget } from "@/components/lesson-widgets";
import { ToolPage } from "@/components/tool-page";

const title = `Position size calculator: how many shares to buy | ${BRAND.name}`;
const description = "Free position size calculator. Enter your account size, risk percent, entry and stop to get the number of shares, the dollars at risk and the share of your account. Educational only.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools/position-size-calculator" },
  openGraph: { type: "website", title, description, url: "/tools/position-size-calculator", images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
};

export default function Page() {
  return (
    <ToolPage
      path="/tools/position-size-calculator"
      name="Position size calculator"
      title="How many shares should you buy?"
      lead="Let your stop decide the size. Type your account, how much you're willing to lose and where the idea is wrong."
      tool={<PositionSizeWidget />}
      formula="Shares = (Account × Risk %) ÷ (Entry − Stop)"
      formulaNote="Rounded down to whole shares, computed in whole cents so the answer matches the order ticket."
      example={{
        heading: "Worked example",
        lines: ["Account $100,000, risk 1% = $1,000 budget", "Entry $100, stop $95 = $5 risk per share", "$1,000 ÷ $5 = 200 shares", "Position value $20,000, 20% of the account"]}}
      steps={[
        { heading: "Set your risk", body: "Most traders stay between 1% and 2% of the account on one trade. That is the most you lose if the stop triggers." },
        { heading: "Place the stop first", body: "Pick the price where your reason stops being true. The distance from entry to stop is your risk per share." },
        { heading: "Check the size", body: "If one stock is over a quarter of your account, think about concentration even when the stop keeps the loss small." },
      ]}
      lesson={{ slug: "position-sizing", title: "Position sizing: the 1–2% rule" }}
      cta={{ title: "Size your first trade with a coach checking it", body: "Set a stop in the simulator and Nova shows how much of your practice account is at risk before you buy." }}
    />
  );
}
