import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { LegalDoc, S, Summary } from "@/components/legal-doc";

export const metadata: Metadata = { title: `Community guidelines | ${BRAND.name}` };

export default function Guidelines() {
  return (
    <LegalDoc title="Community guidelines">
      <Summary>
        <p>
          The community is for learning. Be kind, show your reasoning, and keep real money out of it. Anything that tries to move a real stock price, sell something, or hurt someone will be removed.
        </p>
      </Summary>

      <S id="purpose" title="What the community is for">
        <p>
          Share ideas, ask questions, post lessons learned and compete on discipline, all on a simulated market. Some members and posts are demo content and are labelled as such. Nothing here is investment advice (see the <Link href="/disclaimer">Disclaimer</Link>).
        </p>
      </S>

      <S id="rules" title="Rules">
        <h3>No market manipulation</h3>
        <p>
          No pump-and-dump talk, no coordinated buying or “squeeze” campaigns aimed at real securities, no spreading false or misleading claims about real companies, and no inside information. This applies even though {BRAND.name} trades are simulated, because posts can be read by anyone.
        </p>
        <h3>No real-money solicitation</h3>
        <p>
          Do not ask for or offer real money, investment management, “signals”, paid groups, referral or affiliate links, crypto or forex schemes, or any off-platform trading service. No promoting products or services.
        </p>
        <h3>Be respectful</h3>
        <p>
          No harassment, threats, hate speech, discrimination, bullying or sexually explicit content. Disagree with ideas, not people.
        </p>
        <h3>Protect privacy and safety</h3>
        <p>
          Do not share anyone’s personal information, including your own financial-account numbers, passwords or government IDs.
        </p>
        <h3>Be honest and original</h3>
        <p>
          No spam, impersonation or misleading claims about your results. Post only what you have the right to post, and see our <Link href="/copyright">Copyright policy</Link> for infringing content.
        </p>
        <h3>AI-generated content</h3>
        <p>
          Nova’s comments are written by an AI and are labelled “AI-generated”. They can be wrong. Do not present AI output as your own analysis.
        </p>
      </S>

      <S id="reporting" title="Reporting">
        <p>
          Use the Report action on any post or comment to flag it. Reported content is hidden for you straight away. You can also email {LEGAL.contactEmail} with a link or a description.
        </p>
      </S>

      <S id="moderation" title="What we do about it">
        <p>
          We may hide or remove content, warn you, limit features, or end access, at our discretion, as described in the <Link href="/terms">Terms</Link>. We aim to review reports promptly. We do not promise to catch everything. For copyright complaints, see the <Link href="/copyright">Copyright and DMCA policy</Link>.
        </p>
      </S>
    </LegalDoc>
  );
}
