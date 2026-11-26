import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { LegalDoc, S, Summary } from "@/components/legal-doc";

export const metadata: Metadata = { title: `Terms of service | ${BRAND.name}` };

export default function Terms() {
  return (
    <LegalDoc title="Terms of service">
      <Summary>
        <p>
          {BRAND.name} is an educational simulator. You trade with pretend money in a market that is generated, not real. Nothing here is investment, financial, tax or legal advice, and {BRAND.name} cannot place real trades.
        </p>
        <p>
          You must be {LEGAL.minimumAge} or older. Nova, our coach, is an AI and can be wrong. These terms include an arbitration clause and a class-action waiver (section 19), which you can opt out of within 30 days. We offer Free, Premium and Elite plans (section 15). Payments are not live yet, so Premium and Elite can only be previewed in test mode, at no charge. When billing starts, a paid plan will renew automatically until you cancel, and you can cancel in Settings with one click.
        </p>
      </Summary>

      <S id="agreement" title="1. Who we are and what this agreement is">
        <p>
          These terms are an agreement between you and {LEGAL.entityName} (“we”, “us”, “{BRAND.name}”), located at {LEGAL.entityAddress}. They apply to the {BRAND.name} website and app and to everything in them (the “Service”). They take effect on {LEGAL.effectiveDate} (version {LEGAL.termsVersion}).
        </p>
        <p>
          You accept these terms by ticking the agreement box when you start, or by using the Service. If you do not agree, do not use the Service. Please also read our <Link href="/privacy">Privacy policy</Link>, <Link href="/disclaimer">Investment and simulation disclaimer</Link>, <Link href="/community-guidelines">Community guidelines</Link> and <Link href="/copyright">Copyright and DMCA policy</Link>, which are part of this agreement.
        </p>
      </S>

      <S id="eligibility" title="2. Eligibility">
        <ul>
          <li>You must be at least {LEGAL.minimumAge} years old. By agreeing, you confirm that you are. If we learn that someone under {LEGAL.minimumAge} is using the Service, we may remove their access, and we will ask you to delete your data in Settings because it is stored only on your device.</li>
          <li>You confirm that you have the legal capacity and authority to enter into this agreement.</li>
          <li>Do not use the Service where it is prohibited by law, or if you are barred from receiving it under the laws that apply to you.</li>
        </ul>
      </S>

      <S id="service" title="3. What the Service is, and what it is not">
        <p>
          {BRAND.name} is an <strong>educational simulation</strong>. It offers paper trading with a pretend starting balance, lessons, an AI coach and a community. Specifically:
        </p>
        <ul>
          <li>No real money is used. No trade you place is a real order. We are not a broker, dealer, exchange, investment adviser or bank, and we do not hold, move or invest anyone’s money.</li>
          <li>Prices, charts, news headlines, community members, posts, likes and leaderboard entries are simulated or fictional unless a page says otherwise. Simulated prices are generated and are not real market prices.</li>
          <li>Company names and ticker symbols are used only to identify the companies and indexes the simulation refers to.</li>
        </ul>
        <p>See the <Link href="/disclaimer">Investment and simulation disclaimer</Link> for the full statement.</p>
      </S>

      <S id="no-advice" title="4. No investment, financial, tax or legal advice">
        <p>
          Nothing in the Service is investment, financial, tax or legal advice, or a recommendation or solicitation to buy or sell any security or to follow any strategy. Nova is an AI, not a person, and not a licensed adviser. We have no fiduciary relationship with you. You are solely responsible for your own decisions, including anything you do with real money. Talk to a qualified professional before making real financial decisions.
        </p>
      </S>

      <S id="hypothetical" title="5. Hypothetical and simulated performance">
        <p>
          All results shown in the Service, including account value, returns, scores, rankings and leaderboards, come from simulated trading. Simulated results have inherent limits: they do not reflect real market conditions, real fills, slippage, fees, taxes, liquidity or the emotions of risking real money. They are not a prediction or a guide to what you or anyone would earn trading real securities.
        </p>
      </S>

      <S id="no-affiliation" title="6. No affiliation with companies named">
        <p>
          {BRAND.name} is not affiliated with, endorsed by or sponsored by any company, exchange or index named in the Service. Names, tickers and marks belong to their owners and are used only to identify them. Simulated headlines about named companies are fictional scenarios and are not real news.
        </p>
      </S>

      <S id="ai" title="7. AI features">
        <ul>
          <li>Nova’s replies, trade reviews and other AI-generated content may be inaccurate, incomplete, out of date or unsuitable for you. We do not verify them. Do not rely on them for real financial decisions.</li>
          <li>Only when the AI coach is switched on, and only after you have seen and acknowledged an in-app notice, {LEGAL.aiData} are sent to our AI provider (Anthropic) to generate replies. The <Link href="/privacy">Privacy policy</Link> explains this. Otherwise Nova runs as a local rules engine in your browser (labelled “Nova, rules engine”), and no portfolio, trade, name or chat data is sent anywhere, including to our own server.</li>
          <li>Do not try to misuse the AI: for example, by trying to extract its instructions, generate unlawful, harassing or deceptive content, or use it to bypass the rules in section 9.</li>
        </ul>
      </S>

      <S id="accounts" title="8. Accounts">
        <p>
          Today your data is stored in your own browser and there are no accounts. If and when we offer accounts, you agree to give accurate information, keep your sign-in details secure, keep to one account per person, and tell us promptly if you think someone else has accessed your account. You are responsible for activity under your account. We may suspend or terminate accounts as described in section 22.
        </p>
      </S>

      <S id="acceptable-use" title="9. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use the Service to solicit real money, run a real-money scheme, or promote any real trading service, signal group, referral link or investment product;</li>
          <li>post content meant to manipulate markets, such as pump-and-dump talk, coordinated buying or “squeeze” campaigns, or false claims about real securities;</li>
          <li>spam, harass, threaten, impersonate or discriminate against others, or post unlawful, hateful, sexually explicit or deceptive content;</li>
          <li>scrape, crawl or harvest the Service or its data by automated means, or build a competing product from it;</li>
          <li>reverse engineer, decompile or interfere with the Service, bypass security or rate limits, or overload it;</li>
          <li>abuse the AI features, or use them to generate content that breaks these terms;</li>
          <li>break the law, or infringe anyone’s rights.</li>
        </ul>
        <p>The <Link href="/community-guidelines">Community guidelines</Link> give more detail.</p>
      </S>

      <S id="user-content" title="10. Your content">
        <ul>
          <li><strong>Ownership.</strong> You keep ownership of what you post (posts, comments, trade notes, theses).</li>
          <li><strong>License to us.</strong> You give us a worldwide, non-exclusive, royalty-free license to host, store, display, reproduce and distribute your content as needed to run, secure and improve the Service, including showing it to other users where you post it publicly. This license ends when you delete the content or your data, except for copies in backups for a short time and content others have already shared or quoted.</li>
          <li><strong>Your promises.</strong> You confirm you have the rights to post your content, that it does not infringe anyone’s rights or break the law, and that it does not break these terms.</li>
          <li><strong>Moderation.</strong> We may review, hide, edit or remove content, and restrict accounts, at our discretion, including when someone tells us about it. Reports made in the app are not yet sent to us. We are not obliged to monitor content.</li>
        </ul>
      </S>

      <S id="dmca" title="11. Copyright complaints (DMCA)">
        <p>
          We respond to notices of alleged copyright infringement under the Digital Millennium Copyright Act. Our notice and counter-notice procedure, our designated agent and our repeat-infringer policy are in the <Link href="/copyright">Copyright and DMCA policy</Link>.
        </p>
      </S>

      <S id="ip" title="12. Our intellectual property">
        <p>
          The Service, including its software, design, course content, lessons, quizzes, scores, rule engine, text and graphics, belongs to us or our licensors and is protected by intellectual property laws. We give you a limited, personal, non-exclusive, non-transferable, revocable license to use the Service for your own learning. We use “{BRAND.name}” and our logo as our name and branding. This agreement gives you no right to use them, and you may not use them without our written permission.
        </p>
      </S>

      <S id="third-party" title="13. Third-party links, services and open-source software">
        <p>
          The Service may link to or rely on third-party sites and services (for example, our AI provider). We do not control them and are not responsible for them. Their own terms and policies apply. The Service includes open-source software, which is licensed under its own license terms.
        </p>
      </S>

      <S id="data" title="14. Privacy">
        <p>
          How we handle personal data is described in the <Link href="/privacy">Privacy policy</Link>. You can export or delete your data at any time in Settings.
        </p>
      </S>

      <S id="paid-plans" title="15. Paid plans">
        <p>
          We offer three plans: Free, Premium and Elite. <strong>Payments are not live yet.</strong> Until they are, you can preview Premium or Elite in test mode at no charge, as described below. We show these terms next to every button that starts a plan, and before any real billing starts we will tell you in the app and ask you to agree.
        </p>
        <ul>
          <li><strong>Plans and prices.</strong> Free ($0) includes the simulator with a limit of 10 trades per day, the lessons in the first two modules and 10 messages to Nova per day. Premium ($30 per month) and Elite ($60 per month) add the features listed on our <Link href="/pricing">Pricing page</Link>, and a plan lists only features that exist in the Service. Prices may change before payments go live.</li>
          <li><strong>Daily limits on Free.</strong> Every order you place counts toward the 10 trades per day. Selling to close or reduce a position is always allowed, even at the limit, and automatic stop-loss and take-profit exits never count and always run. Daily limits reset at midnight in your device’s local time.</li>
          <li><strong>Test mode.</strong> While payments are not live, choosing Premium or Elite starts a preview in a clearly labelled test mode. No payment is taken, no card is asked for or charged, and nothing renews. The preview is stored in your browser with your other data, so deleting your data in Settings also returns you to Free. Real billing will start only after we tell you and you choose to start it.</li>
          <li><strong>Automatic renewal.</strong> When payments are live, paid plans will be billed monthly and renew automatically each month until you cancel.</li>
          <li><strong>How to cancel.</strong> You can cancel at any time in Settings with one click (“Cancel plan”), which is as easy as starting a plan. You do not need to contact us.</li>
          <li><strong>When cancellation takes effect.</strong> In test mode, cancelling returns you to the Free plan at once. When payments are live, cancelling stops future renewals: paid features continue until the end of the period you have already paid for, then your account returns to the Free plan.</li>
          <li><strong>Refunds.</strong> {LEGAL.refundPolicy}</li>
          <li><strong>Price changes.</strong> If we change the price of a plan, we will tell you in advance (by email or in the app) and the new price will apply from your next renewal after the notice. You can cancel before then.</li>
          <li><strong>Taxes.</strong> Prices may exclude taxes. Where we are required to collect sales tax, VAT or similar taxes, they will be shown at checkout.</li>
        </ul>
        <p>When payments are live, they will be processed by a third-party payment provider (planned: Stripe). We will not store your full card number.</p>
      </S>

      <S id="warranties" title="16. Disclaimer of warranties">
        <p>
          The Service is provided “as is” and “as available”. To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, accuracy and non-infringement. We do not promise that the Service will be uninterrupted, error-free or secure, that simulated data or AI output will be accurate, or that any content or score is correct. Some places do not allow some of these exclusions, so some may not apply to you.
        </p>
      </S>

      <S id="liability" title="17. Limitation of liability">
        <p>
          To the fullest extent the law allows, we and our officers, directors, employees, contractors and suppliers will not be liable for indirect, incidental, special, consequential, exemplary or punitive damages, or for lost profits, lost data or loss of goodwill, arising from or related to the Service, even if we were told they were possible. Because the Service uses no real money, you should never suffer a trading loss from it. If you make real financial decisions based on the Service, you do so at your own risk.
        </p>
        <p>
          Our total liability for all claims relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim arose and US$100. Nothing in these terms limits liability that cannot be limited by law, including for fraud, for death or personal injury caused by negligence, or for anything else the law does not allow us to exclude. Where you live, you may have consumer rights that these terms do not remove.
        </p>
      </S>

      <S id="indemnity" title="18. Responsibility for your content and conduct">
        <p>
          If you post content or act in a way that breaks these terms or the law, and a third party brings a claim against us because of it, you agree, to the extent the law allows, to cover our reasonable losses from that claim. This section does not apply where the law does not allow it.
        </p>
      </S>

      <S id="disputes" title="19. Resolving disputes">
        <p>Please read this section carefully. It affects your legal rights. It applies to the extent the law allows, and does not take away any right you cannot waive.</p>
        <ul>
          <li><strong>Talk to us first.</strong> Before starting any formal proceeding, email {LEGAL.contactEmail} with a short description of the problem and what you want. Both sides will try in good faith to resolve it for at least 30 days.</li>
          <li><strong>Binding arbitration.</strong> If we cannot resolve it, any dispute arising out of or relating to these terms or the Service will be resolved by individual, binding arbitration administered by {LEGAL.arbitrationProvider} under its consumer rules, rather than in court, except as set out below. The arbitrator can award the same individual relief a court could.</li>
          <li><strong>Small claims and injunctions.</strong> Either side may bring an individual claim in small-claims court if it qualifies. Either side may go to court to stop infringement or misuse of intellectual property.</li>
          <li><strong>No class actions.</strong> You and we each agree to bring claims only in an individual capacity, and not as a plaintiff or class member in any class, collective or representative proceeding.</li>
          <li><strong>Many similar claims.</strong> If 25 or more similar claims are filed by or with the help of the same lawyers, they will be handled in batches of 10, with the others paused until each batch is decided, and the arbitration provider’s fees for the batches will follow its mass-arbitration rules.</li>
          <li><strong>You can opt out.</strong> You can opt out of arbitration and the class waiver within 30 days of first agreeing to these terms by emailing {LEGAL.contactEmail} with the subject “Arbitration opt-out” and your name. Opting out does not affect any other part of these terms.</li>
          <li><strong>If this section is unenforceable.</strong> If the class waiver is found unenforceable for a claim, that claim goes to court and not to arbitration.</li>
        </ul>
      </S>

      <S id="governing-law" title="20. Governing law, venue and consumer rights">
        <p>
          These terms are governed by the laws of {LEGAL.governingLaw}, without regard to conflict-of-law rules. Subject to section 19, claims that go to court will be brought in the state or federal courts located in that jurisdiction, and you and we consent to their jurisdiction. If you live outside the United States, you may also have mandatory consumer-protection rights under your local law, and nothing in these terms removes them. You may be able to bring a claim in your home courts.
        </p>
      </S>

      <S id="changes" title="21. Changes to these terms">
        <p>
          We may update these terms. For material changes, we will give notice in the app or by email before they apply, update the version and date at the top, and ask you to agree again before you keep using the Service. Using the Service after a non-material change means you accept it. If you do not agree to a change, you can stop using the Service and delete your data in Settings.
        </p>
      </S>

      <S id="termination" title="22. Ending your use, and your data">
        <p>
          You may stop using the Service at any time. You can export your data and delete it in Settings. We may suspend or end your access if you break these terms or the law, if we have to for security or legal reasons, or if we stop offering the Service. If we end your access without cause, we will give you reasonable notice where possible and, where accounts exist, a chance to export your data. Sections that by their nature should survive (for example, 5, 10 to 12, 16 to 19 and 24) survive termination.
        </p>
      </S>

      <S id="sanctions" title="23. Export controls and sanctions">
        <p>
          You may not use the Service if you are located in, or ordinarily resident in, a country or region subject to comprehensive U.S. sanctions (such as those administered by OFAC), or if you are on a U.S. government restricted-party list. You agree to comply with applicable export-control and sanctions laws.
        </p>
      </S>

      <S id="general" title="24. General terms">
        <ul>
          <li><strong>Severability.</strong> If a part of these terms is unenforceable, the rest stays in effect.</li>
          <li><strong>Entire agreement.</strong> These terms, with the policies they refer to, are the whole agreement between you and us about the Service.</li>
          <li><strong>Assignment.</strong> You may not transfer your rights under these terms without our consent. We may transfer ours as part of a merger, sale or reorganization.</li>
          <li><strong>No waiver.</strong> If we do not enforce a right, we do not give it up.</li>
          <li><strong>Notices.</strong> We may give you notice in the app, by email if we have your address, or on this page. You may give us notice at the contact address below.</li>
        </ul>
      </S>

      <S id="accessibility-privacy" title="25. Accessibility and privacy">
        <p>
          We want the Service to work for everyone. See our <Link href="/accessibility">Accessibility statement</Link>. For how we handle personal data, see the <Link href="/privacy">Privacy policy</Link>.
        </p>
      </S>

      <S id="contact" title="26. Contact">
        <p>
          {LEGAL.entityName}<br />
          {LEGAL.entityAddress}<br />
          Email: {LEGAL.contactEmail}
        </p>
      </S>
    </LegalDoc>
  );
}
