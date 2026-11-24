import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";
import { LegalDoc, S, Summary } from "@/components/legal-doc";

export const metadata: Metadata = { title: `Privacy policy | ${BRAND.name}` };

export default function Privacy() {
  return (
    <LegalDoc title="Privacy policy">
      <Summary>
        <p>
          Today there are no accounts. Your simulated portfolio, trades, progress, profile name and settings are saved in your own browser (localStorage) and stay on your device. We do not run analytics or advertising trackers, and we do not sell or share your personal information.
        </p>
        <p>
          The one thing that can leave your device is what you send to the AI coach, and only when the AI coach is switched on and you have acknowledged the in-app notice: your display name, simulated portfolio, trades and chat messages go to Anthropic, our AI provider. Otherwise none of it is sent anywhere. You can export or delete everything in Settings.
        </p>
      </Summary>

      <S id="who" title="1. Who we are">
        <p>
          The controller of your personal data is {LEGAL.entityName}, {LEGAL.entityAddress}. Contact: {LEGAL.contactEmail}. This policy covers the {BRAND.name} website and app. It should be read with our <Link href="/terms">Terms of service</Link>.
        </p>
      </S>

      <S id="data" title="2. What data we handle">
        <h3>Stored in your browser</h3>
        <p>
          The app saves the following in your browser’s localStorage on your device: the display name and handle you enter, your experience level and goal, your agreement record (the version of the terms and when you accepted), your simulated cash, positions, orders and trades, lesson progress, XP and missions, watchlist, community posts and comments you write, your chat history with Nova, simulated market prices, and your theme choice. We do not store this data on our servers. It stays on your device until you delete it (see section 8).
        </p>
        <h3>Sent to our AI provider, when the AI coach is on</h3>
        <p>
          If the AI coach is switched on, then when you chat with Nova, request a trade review, or post in the community and Nova replies, the app sends the relevant request to our server, which passes it to Anthropic. This includes your display name, a snapshot of your simulated portfolio and trades, your progress, and the text you wrote. We show you a notice before this happens for the first time. If the AI coach is not switched on, or if the app cannot confirm that it is, Nova runs as a rules engine in your browser and the app sends no portfolio, trade, name or chat data anywhere, including to our own server. (The app does ask our server whether the AI coach is switched on. That request contains none of your data.) Our server also refuses to forward any request to the AI provider unless the app confirms you have acknowledged the notice.
        </p>
        <h3>Server and hosting logs</h3>
        <p>
          When you load the site, our hosting provider ({LEGAL.hostingProvider}) and our server may record technical data such as your IP address, browser type (user agent), the pages requested and the time. We use this to deliver the Service, keep it secure and fix problems.
        </p>
        <h3>What we do not collect today</h3>
        <p>
          We do not collect your real name, email, payment details, precise location or any real financial-account numbers. Please do not type real financial-account numbers or other sensitive details into the app or into chat with Nova.
        </p>
      </S>

      <S id="purposes" title="3. Why we use it, and our legal bases">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Purpose</th><th>Data</th><th>Legal basis (GDPR and UK GDPR)</th></tr>
            </thead>
            <tbody>
              <tr><td>Provide the simulator, lessons, progress and settings you asked for</td><td>Browser-stored data</td><td>Performance of a contract. Storing it on your device is strictly necessary for the service you requested.</td></tr>
              <tr><td>Generate AI coaching replies and trade reviews</td><td>Name, portfolio, trades, chat text</td><td>Contract, and your consent shown by the notice and your use of the AI coach</td></tr>
              <tr><td>Keep the Service secure, prevent abuse, fix errors</td><td>Server and hosting logs</td><td>Legitimate interests</td></tr>
              <tr><td>Record that you agreed to our terms</td><td>Terms version and date</td><td>Legal obligation and legitimate interests (proof of consent)</td></tr>
            </tbody>
          </table>
        </div>
      </S>

      <S id="recipients" title="4. Who receives data">
        <p>We do not sell your data. We use these providers, and share data with them only as described:</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Recipient</th><th>Role</th><th>Data</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Anthropic</td><td>AI model provider (service provider and processor) for Nova</td><td>Display name, simulated portfolio, trades, progress, chat text</td><td>Used only when the AI coach is switched on</td></tr>
              <tr><td>{LEGAL.hostingProvider}</td><td>Hosting provider (processor)</td><td>Server logs including IP address and user agent</td><td>Applies to anyone loading the site</td></tr>
              <tr><td>Supabase</td><td>Accounts and database (processor)</td><td>Account, profile and community data</td><td>Planned. Applies only when accounts are enabled</td></tr>
              <tr><td>Resend</td><td>Email delivery (processor)</td><td>Email address and message content</td><td>Planned. Applies only when email is enabled</td></tr>
              <tr><td>Stripe</td><td>Payment processing (processor, and independent controller for its own compliance)</td><td>Billing details, plan</td><td>Planned. Applies only when paid plans go live</td></tr>
              <tr><td>Meta (Pixel and Conversions API)</td><td>Advertising measurement</td><td>Event and device data</td><td>Planned. Only with your marketing-cookie consent, and never without it</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          We will update this policy and ask for your agreement again before any planned provider starts to receive your data. Where required, we sign data processing agreements with our providers. We may also disclose data if the law requires it, or to protect rights and safety, or in a business transfer, in which case we will tell you.
        </p>
      </S>

      <S id="ai" title="5. The AI provider, retention and training">
        <p>
          Our AI provider is Anthropic. As we understand Anthropic’s current commercial API terms, data sent through the API is not used to train its models by default. The provider may keep it for a limited period under its own terms, for example to prevent abuse. These terms can change, so please check Anthropic’s current privacy and commercial terms for the latest position. We send only what Nova needs to answer you, and we do not send your email address or real name unless you type your real name as your display name. You can use your own first name or any nickname.
        </p>
      </S>

      <S id="storage" title="6. Cookies and local storage">
        <p>
          We do not set advertising or tracking cookies, and we do not use analytics today. We use your browser’s localStorage (keys beginning “sp-”) to save your simulator data and your theme choice. This is strictly necessary for the service you asked for. If we add anything non-essential in the future, such as analytics or marketing cookies, we will ask for your consent first and let you change your mind.
        </p>
      </S>

      <S id="retention" title="7. How long we keep data">
        <ul>
          <li><strong>Browser-stored data:</strong> until you delete it in Settings or clear your browser data. We cannot access it.</li>
          <li><strong>AI provider:</strong> under Anthropic’s own retention terms, as described in section 5.</li>
          <li><strong>Server and hosting logs:</strong> {LEGAL.logRetention}.</li>
          <li><strong>Records of your agreement to the terms:</strong> kept in your browser with your other data.</li>
        </ul>
      </S>

      <S id="control" title="8. Your choices: export and delete">
        <p>
          Open <Link href="/settings">Settings</Link> to export all your data as a JSON file, or to delete all of it. Deleting clears everything the app has saved in your browser and returns you to the start. You can also clear it through your browser’s site-data controls. Data already sent to the AI provider is handled under section 5, and you can ask us about it using the contact address.
        </p>
      </S>

      <S id="rights" title="9. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, restrict or object to the processing of your personal data, to receive it in a portable format, to withdraw consent at any time, and to appeal a decision we make about your request. Because most of your data is on your device, you can already do much of this yourself in Settings. For anything else, email {LEGAL.contactEmail}. We will respond within one month (GDPR and UK GDPR) or 45 days (California and similar US state laws), and tell you if we need more time. We will not discriminate against you for using your rights.
        </p>
        <p>
          If you are in the EU or UK, you can complain to your local data protection authority. If you are in the United States and disagree with how we handled a request, you can appeal by replying to our response, and you may contact your state attorney general.
        </p>
      </S>

      <S id="transfers" title="10. International transfers">
        <p>
          We and our providers are based in or process data in the United States and possibly other countries. If you are in the EU, UK or another region with transfer rules, your data may be transferred to countries that do not have the same data protection laws. Where required, we rely on safeguards such as the EU-US Data Privacy Framework (where the recipient is certified) or standard contractual clauses.
        </p>
      </S>

      <S id="children" title="11. Children">
        <p>
          {BRAND.name} is for people aged {LEGAL.minimumAge} and older. We do not knowingly collect personal data from anyone under {LEGAL.minimumAge}, and in no case from children under 13. If you believe a child has used the Service, email {LEGAL.contactEmail}. If we learn that we have data from someone under {LEGAL.minimumAge}, we will delete it and block the use.
        </p>
      </S>

      <S id="california" title="12. California and other US state privacy rights">
        <p>
          In the last 12 months we have collected, or enabled to be sent to our AI provider where the AI coach is on, these categories of personal information: identifiers (the display name you enter), and internet or other electronic activity (your simulated trades, your actions in the simulator, and chat messages), and technical identifiers (IP address and user agent in server logs). We use them for the purposes in section 3.
        </p>
        <ul>
          <li>We do not sell personal information and we do not share it for cross-context behavioral advertising. We do not use or disclose sensitive personal information beyond what is necessary to provide the Service.</li>
          <li>Because we do not sell or share, there is currently nothing to opt out of, and a “Do Not Sell or Share My Personal Information” link is not needed. If this changes, we will add it and will honor opt-out preference signals such as Global Privacy Control.</li>
          <li>Residents of California, Colorado, Connecticut, Virginia, Texas and other states with privacy laws may have rights to know, access, delete, correct and port their data, and to opt out of sale, sharing and targeted advertising. Use Settings or email {LEGAL.contactEmail} to exercise them. You may use an authorized agent.</li>
        </ul>
      </S>

      <S id="security" title="13. Security and breaches">
        <p>
          We use reasonable technical and organizational measures to protect data, including encrypted connections (HTTPS) and keeping the data we hold to a minimum. No system is perfectly secure. If a breach affects your personal data, we will notify you and the authorities as the law requires, including within 72 hours to supervisory authorities where GDPR applies.
        </p>
      </S>

      <S id="signals" title="14. Do Not Track and Global Privacy Control">
        <p>
          We do not track you across other sites, so there is no tracking for Do Not Track to turn off. We honor Global Privacy Control as an opt-out signal if we ever sell, share or use data for targeted advertising.
        </p>
      </S>

      <S id="accounts" title="15. When accounts, email and paid plans launch (planned)">
        <p>
          This section describes what will apply once we turn on accounts and related services. They do not apply to you today. Before they apply, we will update this policy and ask you to agree again.
        </p>
        <ul>
          <li><strong>Account data:</strong> email address, password hash or sign-in provider identifier, and your profile.</li>
          <li><strong>Community content:</strong> posts, comments and likes you make, and the public profile and leaderboard display name you choose. Public content can be seen by other users.</li>
          <li><strong>Authentication and device logs:</strong> IP address, device and sign-in events, for security.</li>
          <li><strong>Providers:</strong> Supabase (accounts and database, with row-level security and encryption at rest), Resend (email), and Stripe (payments, so we never see your full card number).</li>
          <li><strong>Email and notifications:</strong> you can choose your preferences and unsubscribe from non-essential email at any time.</li>
          <li><strong>Billing data:</strong> plan, status and billing records held by Stripe and kept as long as tax law requires.</li>
          <li><strong>Analytics and marketing:</strong> any analytics or marketing cookies, including Meta Pixel or Conversions API, will be off until you opt in through a consent banner, and you can withdraw consent at any time.</li>
          <li><strong>Account deletion and export:</strong> you will be able to export and delete your account data in Settings.</li>
          <li><strong>Retention:</strong> we will keep account data while your account is open and delete it after you close it, except what we must keep by law, with a retention period per data type.</li>
          <li><strong>Moderation data:</strong> reports and moderation decisions, kept to enforce the Community guidelines.</li>
          <li><strong>Sensitive data:</strong> we will not ask for financial account numbers, government IDs or other sensitive information.</li>
        </ul>
      </S>

      <S id="representative" title="16. EU and UK representative">
        <p>If required by law we will appoint a representative and, if required, a data protection officer: [EU/UK representative and DPO details, if required].</p>
      </S>

      <S id="changes" title="17. Changes to this policy">
        <p>
          We will update this policy when our practices change. The date and version are at the top of this page. For material changes we will tell you in the app and ask you to agree again.
        </p>
      </S>

      <S id="contact" title="18. Contact">
        <p>
          {LEGAL.entityName}<br />
          {LEGAL.entityAddress}<br />
          Email: {LEGAL.contactEmail}
        </p>
      </S>
    </LegalDoc>
  );
}
