import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { RewardRiskWidget } from "@/components/lesson-widgets";
import { ToolPage } from "@/components/tool-page";

const title = `Reward to risk calculator and break-even win rate | ${BRAND.name}`;
const description = "Free reward to risk calculator. Enter entry, stop and target to see the ratio, a to-scale diagram and the win rate you need to break even. Educational only.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools/reward-risk-calculator" },
  openGraph: { type: "website", title, description, url: "/tools/reward-risk-calculator", images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
};

export default function Page() {
  return (
    <ToolPage
      path="/tools/reward-risk-calculator"
      name="Reward to risk calculator"
      title="Is the trade worth taking?"
      lead="Compare what you could win with what you could lose before you enter. The bars are drawn to scale."
      tool={<RewardRiskWidget />}
      formula="R = (Target − Entry) ÷ (Entry − Stop)"
      formulaNote="The win rate you need to break even is 1 ÷ (1 + R). Higher R means you can be wrong more often."
      example={{
        heading: "Worked example",
        lines: ["Entry $100, stop $95 = $5 risk", "Target $110 = $10 reward", "R = 10 ÷ 5 = 2, written 2 : 1", "Break-even win rate 1 ÷ 3 = 33%"]}}
      steps={[
        { heading: "Plan both exits", body: "Choose a stop where you admit you're wrong and a target where you'd take profit, before you enter." },
        { heading: "Aim for 2 : 1 or better", body: "If the target isn't at least about twice the distance to the stop, the trade probably isn't worth taking." },
        { heading: "Read the break-even rate", body: "At 2 : 1 you only need to win a third of the time. At 1 : 1 you need half, before costs." },
      ]}
      lesson={{ slug: "risk-reward", title: "Reward-to-risk" }}
      cta={{ title: "Practice bracket orders with a coach checking them", body: "Attach a stop and a target in the simulator and Nova checks the ratio on every trade." }}
    />
  );
}
