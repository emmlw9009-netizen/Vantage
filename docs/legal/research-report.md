# Vantage: Legal-Risk Research Report

Verification pass completed 2026-11-24 (see Verification log at end). Prepared 2026-11-24 for the owner to take to a lawyer. This is research, not legal advice. Items I could not confirm against a primary source are marked **(unverified)**. Web search in this session returned mostly secondary sources, so every date, threshold and citation should be re-checked by counsel before reliance. I could not query the USPTO database directly.

## 1. Summary: top 10 risks

| # | Risk | Likelihood | Impact | Level | One-line mitigation |
|---|------|-----------|--------|-------|---------------------|
| 1 | Fabricated likes, participant counts, posts and "members" shown next to real content (FTC fake-indicator rule, Section 5, state UDAP, backlash) | H | M | **High** | Remove fabricated numbers or label every seeded item "Sample data" and exclude it from rankings and counts |
| 2 | "Vantage" collides with existing marks in finance/education/software (Vantage Markets, others); forced rebrand or demand letter | M | H | **High** | Full clearance search before launch; consider a distinctive compound name |
| 3 | No entity and no insurance; owner personally liable for everything below | M | H | **High** | Form an LLC before public launch; E&O/cyber quote; keep entity formalities |
| 4 | Terms not enforceable (no clickwrap, no recorded acceptance), so disclaimers, limits and arbitration fail | H | M | **High** | Clickwrap at signup with versioned, timestamped acceptance |
| 5 | Privacy: worldwide users, AI subprocessor, minors, localStorage/ePrivacy, no policy | M | H | **High** | Privacy policy and age gate now; consent banner for EU/UK if any non-essential storage; DPA with vendors |
| 6 | Fictional "news" about real companies (Tesla etc.) screenshotted as real; defamation, trade libel, false light, trademark/dilution claims, platform/PR backlash | M | M | **Medium** | Label every headline "Simulated", use generic or fictional-company headlines, no negative factual claims about named firms |
| 7 | AI coach treated as personalized investment advice, or AI makes unsubstantiated or hallucinated claims; Anthropic usage-policy breach | L | H | **Medium** | Educational-only framing, no real-security recommendations, AI disclosure, guardrails, disclaimers |
| 8 | UGC: pump-and-dump talk, copyright takedowns, harassment; AI replies posted publicly as if human | M | M | **Medium** | Report tools, moderation, DMCA agent, "AI" badge on Nova posts |
| 9 | Unsubstantiated statistics and performance-style claims; gamification/dark-pattern criticism | M | M | **Medium** | Cite sources for every statistic; paper-trading disclaimers; avoid engagement-maximizing mechanics aimed at minors |
| 10 | Website accessibility demand letters (ADA Title III; EAA for EU) | M | M | **Medium** | Build to WCAG 2.2 AA now; publish accessibility statement |

---

## 2. Area-by-area analysis

### 2.1 Securities and investment-advice law

**Law.**
- The Advisers Act defines an investment adviser as one who, for compensation, advises others on the value of securities or on investing in them ([15 U.S.C. 80b-2(a)(11)](https://www.law.cornell.edu/uscode/text/15/80b-2)). The "publisher's exclusion" comes from [Lowe v. SEC, 472 U.S. 181 (1985)](https://supreme.justia.com/cases/federal/us/472/181/): bona fide, impersonal, regularly published content that is not tailored to individual clients is outside the Act.
- Risk rises with personalization. Nova comments on a user's own portfolio, which is individualized. But the portfolio is virtual, there is no compensation for advice on real securities (today), and no real order is placed. A subscription later strengthens the "for compensation" element. Whether virtual-portfolio feedback is "advice about securities" at all is arguable; I found no authority squarely on point **(unverified)**. The safe design is to make Nova a process coach (sizing, stop-losses, emotional flags) and never output "buy/sell/hold X" for real-world action.
- State law: many states have their own investment-adviser definitions and "internet adviser" exemptions under the [NASAA model rules](https://www.nasaa.org/) **(unverified; counsel should check state adviser definitions where users concentrate)**. Counsel should check the states with the broadest definitions.
- Gamification: [Massachusetts v. Robinhood](https://www.thinkadvisor.com/2024/01/18/robinhood-to-pay-7-5m-over-gamification-practices/): the SJC upheld the state's fiduciary rule in 2023, and Robinhood settled in January 2024 for $7.5M and dropped celebratory imagery tied to trading frequency. That case concerned a real broker-dealer. It shows regulator attitudes toward confetti, streaks and trade-frequency rewards.
- SEC: the 2023 predictive-data-analytics and "digital engagement practices" proposals were among rules the SEC [withdrew in June 2025](https://www.proskauer.com/alert/sec-withdraws-fourteen-rule-proposals) **(I confirmed the 14-proposal withdrawal; I did not confirm which items were on the list)**. The SEC says new action would require a fresh proposal.
- "AI washing": the SEC fined advisers in March 2024 for false AI claims (Delphia, Global Predictions) and the FTC ran "Operation AI Comply" in September 2024 **(both from memory, unverified in this session)**. Marketing Nova's "score" as predictive or proven would invite this.
- UK/EU, briefly: in the UK, giving a personal recommendation on a specific investment is a regulated activity, and promotions of investments need FCA authorization or approval (FSMA s.21) **(unverified)**; generic education is generally outside it. EU MiFID II "investment advice" likewise requires a personalized recommendation on a specific financial instrument **(unverified)**.

**Application.** Current risk is Low in likelihood but High in impact. Mission-based and weekly-challenge content naming real tickers could drift toward recommendations.

**Build into the product now.**
- A persistent footer and a pre-trade line: "Vantage is educational. Simulated trading only. Nothing here is investment advice or a recommendation to buy or sell any security."
- Nova system prompt: never recommend buying or selling a real security for real money; never predict prices; comment on process only; refuse requests for real-money advice with a canned response.
- Output filter that blocks "you should buy/sell [ticker]" patterns in Nova chat and public replies.
- A hypothetical-performance disclosure beside the leaderboard and portfolio return numbers: "Simulated results have inherent limitations, are not real trades, and do not reflect fees, slippage, liquidity or emotions. Past simulated results do not predict real results." (modeled on [CFTC Rule 4.41](https://www.law.cornell.edu/cfr/text/17/4.41) hypothetical-performance language).
- No "gains" confetti or loss-aversion nudges tied to trade frequency; reward process (learning, journaling), not volume.

**Owner actions.** Securities lawyer opinion on the Advisers Act and state "adviser" exposure before any paid tier or any real-money/broker link; decide whether Nova may ever name real tickers in non-simulated context (recommend no).

### 2.2 Trademark and use of real companies

**"Vantage" name.**
- Likelihood of confusion turns on the DuPont-type factors: similarity of mark, relatedness of goods/services, channels, buyer sophistication ([15 U.S.C. 1114](https://www.law.cornell.edu/uscode/text/15/1114), [1125(a)](https://www.law.cornell.edu/uscode/text/15/1125)). "Vantage" is a common, suggestive word with a crowded register.
- A search on this topic surfaced US filings for VANTAGE, VANTAGE FINANCIAL, VANTAGEBROKER (investment in stocks/securities) and VANTAGE ADVISOR GROUP, all by unrelated owners ([Justia: VANTAGEBROKER](https://trademark.justia.com/780/28/vantagebroker-78028957.html), [Justia: VANTAGE FINANCIAL](https://trademarks.justia.com/973/86/vantage-97386137.html), [Justia: Vantage Advisor Group](https://trademarks.justia.com/owners/vantage-advisor-group-1827733)). Statuses were not confirmed live. Vantage Markets (forex/CFD broker) appeared only as a Canadian application showing abandoned ([CIPO record](https://ised-isde.canada.ca/cipo/trademark-search/2170070)); its US/other-jurisdiction rights are **(unverified)**. Vantage Markets and similar brokers also have common-law rights through use.
- Vantage is a trading-education product. Classes 9 (software/apps), 36 (financial services), 41 (education), 42 (SaaS) all plausibly overlap with existing filings. Related goods plus a identical dominant word is the core risk, and brokers are well-resourced enforcers.

**Clearance steps.** (1) USPTO [Trademark Search](https://tmsearch.uspto.gov/) for VANTAGE and phonetic variants in classes 9/35/36/41/42/45; (2) state registers, WIPO Global Brand Database, EUIPO TMview, UKIPO; (3) common-law search (app stores, domains, social handles, Google); (4) professional full search report plus an attorney opinion; (5) file an intent-to-use application only after clearance.

**Alternatives.** A coined or distinctive compound (for example a made-up word plus a descriptive suffix) is easier to register and defend than a dictionary word. Check domains and handles at the same time.

**Real company names, tickers, fictional headlines.**
- Referring to Apple, NVIDIA and Tesla by name to identify them is generally nominative fair use if you use only what is necessary, don't suggest sponsorship, and don't use their logos ([New Kids on the Block v. News America, 971 F.2d 302 (9th Cir. 1992)](https://law.justia.com/cases/federal/appellate-courts/F2/971/302/260011/) from memory). Use words, not logos or brand fonts.
- The greater risk is the invented headlines. A false statement of fact about an identifiable company ("Tesla cuts outlook") can support defamation or trade libel if a reader takes it as real. Public companies are typically public figures and must show actual malice, which lowers risk, but screenshots stripped of context and market-moving panic are a real backlash vector. Also consider state "false light", Lanham Act dilution/false association (§1125(a), (c)) and securities-fraud-style complaints if a fake headline circulates as real **(unverified how courts would treat a labeled simulation)**.
- Company "business descriptions": copy from the company's SEC filings (public) or write your own. Do not copy Wikipedia or vendor text verbatim (copyright and licensing).

**Build into the product now.**
- Label every generated headline with a visible, non-removable "SIMULATED" tag and a footer on the news panel: "Fictional scenario for practice. Not real news. Not about the actual company's current business."
- Change content: use generic event templates ("Mega-cap tech company reports weaker guidance") or fictional companies with fictional tickers; if real names stay, never state concrete negative factual claims (fraud, recalls, lawsuits, specific earnings numbers) about them.
- Make generated prices visibly simulated (watermark chart) and never present them as real quotes. Do not use real ticker symbols for charts that look like live data without a "simulated" badge.
- Make headlines non-shareable (no share-to-social with the headline text), or watermark share images.
- Footer: "Vantage is not affiliated with or endorsed by any company named. Company names and tickers are used for identification only."

**Owner actions.** Trademark clearance and attorney opinion; domain/handle acquisition; lawyer review of whether to keep real names; keep a record of the template list for headlines.

### 2.3 FTC and consumer protection

**Law.**
- [16 CFR Part 465](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465), final rule [published Aug 22, 2024](https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials), effective Oct 21, 2024. It bans fake or false consumer reviews/testimonials (including ones attributed to non-existent people), buying positive/negative reviews, insider reviews without disclosure, review suppression, and (§465.8) selling, buying or distributing "fake indicators of social media influence" (bot or fake-account followers/views/likes) for use in misrepresenting influence. The reported knowledge standard is "knew or should have known" **(per secondary summaries)**. Civil penalties run to roughly $50,000+ per violation **(unverified exact figure)**.
- General deception: [FTC Act Section 5](https://www.law.cornell.edu/uscode/text/15/45) and state UDAP laws prohibit material misrepresentations; claims need a reasonable basis (substantiation).

**Application.**
- Seeded "214 likes" and "1,284 joined" next to real user content, on posts by invented people, is the closest fit in the product. §465.8 is aimed at fake influence indicators sold or distributed to misrepresent importance; Vantage would be self-generating them to make a new community look active. Whether a seeded demo layer with a small notice is within §465.8 is arguable, but "the community has 1,284 participants" is a plain factual claim that is false, and it can mislead users about the product's value, which is Section 5 and UDAP territory. The small notice is not a cure if it is not prominent and close to each item.
- Landing-page mock coach review and example scores: fine if clearly labeled "Example". A review attributed to a named fake user is a fake testimonial. Do not include fabricated testimonials, star ratings, "as seen in", or "join 10,000 learners".
- Statistics in lessons ("most professional fund managers fail to beat the S&P 500 after fees", "most active retail traders earn the lowest returns") are broadly supported by the [SPIVA scorecards](https://www.spglobal.com/spdji/en/research-insights/spiva/) and by Barber & Odean's research (from memory); cite them specifically with dates **(unverified in this session)**.
- Gamification: no specific US rule bans XP and streaks, but streak-loss guilt, countdowns and social pressure draw "dark pattern" scrutiny (FTC staff report, [Bringing Dark Patterns to Light, 2022](https://www.ftc.gov/reports/bringing-dark-patterns-light) from memory) and, for minors, heightened scrutiny.
- Future subscriptions: ROSCA ([15 U.S.C. 8401-8405](https://www.law.cornell.edu/uscode/text/15/chapter-110)) requires clear disclosure, express informed consent and simple cancellation. California's [Automatic Renewal Law (B&P 17600+)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=7.&title=&part=3.&chapter=1.&article=9.) and other states require pre-checkout disclosure, affirmative consent, an acknowledgment and online cancellation. The FTC "click-to-cancel" rule was vacated on procedural grounds by the Eighth Circuit on July 8, 2025 in *Custom Communications v. FTC*, No. 24-3137 ([DLA Piper](https://www.dlapiper.com/insights/publications/2025/07/ftcs-click-to-cancel-rule-voided), [Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2025/07/click-to-cancelled-eighth-circuit-vacates-federal-trade-commissions-revised-negative-option-rule)); the older Negative Option Rule, ROSCA and state laws still apply.

**Build into the product now.**
- Remove invented engagement numbers, or mark each seeded post/profile "Sample" (badge on the item, not just a page footnote), render seeded likes as hidden or "-", and never include seeded members in counts such as "1,284 joined". Once real accounts exist, show only real counts; delete seed content from production.
- Leaderboard: label simulated-sample rows; if the user is ranked against fictional people, say so at the rank display ("You vs. sample profiles").
- Every statistic in lessons gets an inline citation link and an "as of" date; add a "Sources" page.
- Mission/streak design: no loss-aversion pop-ups ("you'll lose your streak!"), allow streak freeze, easy to opt out of notifications.
- When subscriptions arrive: price, renewal term and cancellation path on the pay screen; separate unticked consent; reminder email before renewal where required; one-click cancel in account settings.

**Owner actions.** Lawyer review of how seed content is described; keep a substantiation file for every claim.

### 2.4 Privacy

**Today (localStorage only, no accounts).** The only data leaving the browser is what is sent to the AI provider: portfolio, trades, profile name and chat. That is personal data (a name plus behavior) processed by Anthropic as a service provider/subprocessor. An unauthenticated product with no server storage still needs a privacy policy if you are collecting or transmitting personal information (California's [CalOPPA](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=8.&title=&part=&chapter=22.&article=) applies to commercial sites collecting PII from California residents, from memory).

**Key rules.**
- **COPPA.** [Amended rule](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) published April 22, 2025; compliance deadline for most provisions **April 22, 2026** (already passed). It applies to services directed to children under 13 or with actual knowledge of under-13 users. A stock-learning app with XP and streaks will attract teens and kids; a "directed to children" analysis considers subject matter, visuals and audience. Safest: an age gate (neutral date-of-birth prompt, not "are you over 13?") that blocks under-13 and does not invite retry; and a decision on 13-17 vs 18+.
- **Minimum age.** Legally the floor is 13 (COPPA); GDPR Art. 8 sets 13-16 for consent depending on the member state. Financial services contracts with minors are voidable, and Anthropic's own consumer terms require 18+ **(unverified for API deployments; check commercial terms)**. Recommended: 18+ for accounts, or 13+ with parental-awareness copy, decided with counsel. Several states have enacted age-appropriate design and social-media age laws, some enjoined **(unverified; check California, Texas, Utah, Louisiana)**.
- **US state laws.** CCPA/CPRA thresholds: businesses with annual gross revenue over $26,625,000 (the CPI-adjusted figure effective Jan 1, 2025, per the [CPPA threshold table](https://www.cppa.ca.gov/regulations/cpi_adjustment.html); next adjustment expected Jan 1, 2027), or buying/selling/sharing personal information of 100,000+ consumers/households, or 50%+ revenue from selling/sharing ([Cal. Civ. Code 1798.140(d)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=CIV&sectionNum=1798.140.)). A small startup is likely under all three at launch, but it takes only 100,000 California visitors/users on some readings. Other states (Virginia, Colorado, Connecticut, Texas and others) use roughly a 100,000-consumer threshold; Texas's law applies to non-small businesses without a volume threshold **(unverified)**. Plan to comply with the common core anyway.
- **GDPR / UK GDPR.** Apply to controllers offering services to people in the EU/UK or monitoring their behavior, regardless of where the controller sits (Art. 3(2)). Worldwide traffic with an English-language, free product may or may not be "targeting"; but once you have accounts and EU users, assume yes. Needs: lawful basis (contract/consent), Art. 13 notice, data-subject rights, an EU/UK representative under Art. 27 (small-scale occasional processing can be exempt), transfer mechanism for sending data to the US (EU-US Data Privacy Framework if the vendor is certified, else SCCs; check Anthropic's DPA), records of processing, breach notification (72 hours).
- **ePrivacy / localStorage.** The ePrivacy Directive Art. 5(3) covers any storing/accessing of information on a device, including localStorage, unless "strictly necessary" for a service the user requested ([EDPB Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2023/guidelines-22023-technical-scope-art-53-eprivacy_en)). Storing the user's own simulated portfolio is likely strictly necessary; analytics and ad tech are not. Plan consent for any later analytics.
- **AI subprocessor disclosure.** Name Anthropic (or "an AI model provider") as a recipient, say what is sent, and say whether it is used for training (Anthropic's commercial API terms say customer data is not used for model training by default **(unverified; confirm in current commercial terms)**). Sign the vendor's DPA.
- **Retention and deletion.** Define retention for chat logs and trades; support access/deletion requests (CCPA 45-day response, GDPR one month).

**Privacy policy must contain today:** see Part 3. **When accounts launch:** account data (email, password hash, profile), Supabase as a processor, auth logs, IP addresses, community content, DSAR process, retention schedule, children statement, state-law notices (CA, others), GDPR lawful bases and transfers, cookie/consent banner if any non-essential storage, breach plan, and security measures (row-level security, encrypted at rest).

**Build into the product now.**
- Before the first AI call, show a short notice: "Nova uses an AI service. Your simulated portfolio, trades, display name and chat messages are sent to the provider to generate replies." Link to the privacy policy.
- Do not send the real name or email to the AI; send a pseudonymous handle or no name. Minimize context.
- Age gate in onboarding (DOB or 18+ checkbox) with refusal path that clears data.
- "Delete my data" button that clears localStorage and, later, account data.
- Footer links: Privacy, Terms, Cookie settings (if applicable), Contact.

**Owner actions.** Execute DPAs (Anthropic, Supabase, host); decide on EU/UK representative; decide GDPR posture (geo-block EU/UK at first, or comply); privacy counsel to review age policy.

### 2.5 Terms of service enforceability

**Case law.** Courts enforce online terms when a reasonable user has notice and manifests assent. Clickwrap (a box or button tied to visible terms) is routinely enforced; browsewrap (a footer link) rarely is. Key cases: [Meyer v. Uber, 868 F.3d 66 (2d Cir. 2017)](https://law.justia.com/cases/federal/appellate-courts/ca2/16-2750/16-2750-2017-08-17.html) (enforced given conspicuous notice and clear assent action); [Nguyen v. Barnes & Noble, 763 F.3d 1171 (9th Cir. 2014)](https://law.justia.com/cases/federal/appellate-courts/ca9/12-56628/12-56628-2014-08-18.html) (browsewrap not enforced without actual notice); [Berkson v. Gogo, 97 F. Supp. 3d 359 (E.D.N.Y. 2015)](https://law.justia.com/cases/federal/district-courts/new-york/nyedce/1:2014cv01199/338987/45/) (distinguishes the four types and rejected a sign-in-wrap whose terms were not conspicuous). Recent Ninth Circuit decisions refused to compel arbitration where sign-in-wrap notice was inadequate: *Chabolla v. ClassPass*, 129 F.4th 1147 (9th Cir. Feb. 2025) and *Godun v. JustAnswer*, No. 24-2095 (9th Cir. Apr. 2025) ([Fenwick](https://www.fenwick.com/insights/publications/ninth-circuit-reinforces-stricter-standards-for-online-user-agreements), [Hunton](https://hunton.com/privacy-and-information-security-law/its-a-wrap-the-latest-from-the-ninth-circuit-on-sign-in-wrap-agreements)). A 2026 district court decision (*Blackburn v. ClassPass*) reportedly enforced ClassPass's terms, so outcomes vary ([Goldman blog](https://blog.ericgoldman.org/archives/2026/04/remember-when-the-ninth-circuit-rejected-classpass-tos-formation-about-that-blackburn-v-classpass.htm)); the lesson is a separate, unambiguous clickwrap, not a link near a button.

**Application.** Today there is no account, so there is no formation moment. Accepting terms before first use (a modal gate) works for a localStorage app, but you need server-side proof for enforcement. When accounts launch, add acceptance at signup.

**Flow and records.**
- Unticked checkbox plus button: "I am 18 or older and agree to the [Terms] and [Privacy Policy]", links open the full text, no pre-checked boxes, the button disabled until checked, and no auto-accept through "Continue".
- Record: user id, document version/hash, timestamp (UTC), IP and user agent, the exact text shown. Re-prompt on material change.
- Arbitration and class-action waiver: enforceable under the [Federal Arbitration Act](https://www.law.cornell.edu/uscode/text/9/2) when properly assented to; include an opt-out window (30 days), carve out small claims and IP injunctions, state who pays fees (AAA/JAMS consumer rules), choose the seat. Mass-arbitration fee exposure is real; counsel may prefer a mass-arbitration protocol. For a free product with low stakes, the case for arbitration is weaker than for a paid product. Note EU/UK consumers cannot be stripped of mandatory consumer rights or home-forum rights.
- Limitation of liability: cap at the greater of fees paid in 12 months or a small fixed sum; disclaim consequential damages. Some jurisdictions void caps for gross negligence or consumer rights.
- Governing law: owner's home state, with a non-US carve-out for mandatory local consumer law.

### 2.6 User-generated content

**Law.**
- [47 U.S.C. 230(c)(1)](https://www.law.cornell.edu/uscode/text/47/230) shields a provider from liability for third-party content. It does not protect content the provider itself creates or materially develops. **Nova's public replies are the company's own generated content** and likely fall outside Section 230 (courts have not settled this for generative AI **(unverified)**). A defamatory, manipulative or advice-like Nova reply is Vantage's own speech.
- DMCA safe harbor ([17 U.S.C. 512](https://www.law.cornell.edu/uscode/text/17/512)) requires a designated agent registered with the [Copyright Office's DMCA directory](https://dmca.copyright.gov/) (fee $6, renew every three years, from memory), a repeat-infringer policy, and expeditious takedown. Without registration there is no safe harbor.
- Market manipulation: Exchange Act §9(a)(2) and §10(b)/Rule 10b-5 apply to real securities, and a platform hosting pump-and-dump chatter about real tickers can attract regulatory and reputational interest even without liability. Because trading is simulated, abuse would mostly be users promoting real positions or off-platform links.
- FTC/Take It Down Act and similar laws on non-consensual imagery obligations may apply to platforms hosting user images **(unverified; counsel should check current federal and state NCII takedown duties; avoid image uploads at launch)**.

**Build into the product now.**
- Rules: no solicitation of real-money trades, no tips or "guaranteed returns", no links to off-site brokers/Discord/Telegram/paid groups, no personal data, no harassment.
- Report button on every post and comment; block/mute; admin queue; documented response times; ban and repeat-infringer process.
- Text-only posts at launch (no images or links), rate limits, keyword filter for "guaranteed", "DM me", "pump" and ticker-plus-link patterns; new-account throttling.
- Nova public replies: clear "AI" badge and "Nova is an AI coach. Not investment advice" line; no replies on flagged posts; rate limit; output moderation pass before publishing; never reply with real-security recommendations.
- Content license in the Terms (users grant you a license to host and display).

**Owner actions.** Register a DMCA agent (use a role address, not personal) once the entity exists; publish the takedown/counter-notice procedure; decide on moderator coverage.

### 2.7 AI-specific rules

- **US state AI laws.** Utah's AI Policy Act requires disclosure that a consumer is interacting with generative AI when asked and, for regulated occupations, upfront; 2025 amendments (SB 226, effective May 7, 2025) narrowed the duty to high-risk interactions, including advice on financial matters, and disclosure on consumer request; a companion bill (SB 332) extended the Act to July 2027 ([Davis Polk](https://www.davispolk.com/insights/client-update/utah-scales-back-reach-generative-ai-consumer-protection-law), [enrolled SB 226](https://le.utah.gov/Session/2025/bills/enrolled/SB0226.pdf)). Counsel should read the enrolled text to confirm Nova's educational coaching is or is not a "high-risk interaction". California's bot-disclosure law ([B&P 17941](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&sectionNum=17941.)) prohibits undisclosed bots used to incentivize a commercial transaction or influence a vote; California and Maine have chatbot-specific laws, with California SB 243 aimed at companion chatbots **(unverified applicability)**. **Colorado:** the 2024 Colorado AI Act was repealed and replaced by SB 26-189, signed May 14, 2026, with a January 1, 2027 effective date and an automated-decision-making disclosure framework ([Davis Graham summary](https://www.dglaw.com/what-to-know-about-colorados-repeal-and-replacement-of-its-landmark-ai-act/), [AFS summary](https://www.afslaw.com/perspectives/alerts/colorado-replaces-its-landmark-ai-act-new-framework-what-developers-and)). It targets consequential decisions (credit, employment, etc.); a paper-trading coach is unlikely to qualify but confirm **(unverified)**. Status of litigation and any later amendment: check.
- **EU AI Act.** Article 50 transparency duties (tell people they are interacting with an AI system, mark synthetic content) became applicable from 2 August 2026, with a limited extension to the machine-readable-marking duty ([Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force), sources disagree on the extended date). Nova is a chatbot offered to EU users, so disclose it as AI. It is not a high-risk system as described (it is not creditworthiness assessment). The high-risk timeline moved to December 2027 under the Digital Omnibus **(per secondary sources)**.
- **Anthropic usage policy.** The [Usage Policy](https://www.anthropic.com/aup) has high-risk-use-case requirements covering financial advice: verified against the [policy text](https://www.anthropic.com/legal/aup) (version effective Nov 12, 2026): "Finance" is a listed high-risk category, defined as a personalized recommendation to buy, sell, hold or allocate among specific investment products; a qualified person must meaningfully review such a recommendation before it reaches the person relying on it, and that person must be clearly told AI was used (naming Anthropic is not required). A coach that gives only process feedback on simulated trades and never recommends real products is arguably outside the category, but disclose AI anyway; counsel should confirm that reading, or contact Anthropic. Breach can mean account termination, which would disable Nova.
- **Hallucination liability.** There is no safe harbor for AI output; operators are treated as the publisher of their own output. Air Canada's chatbot case (Moffatt v. Air Canada, 2024 BCCRT 149) held a company liable for its bot's misstatement **(from memory, unverified)**.

**Build into the product now.**
- "Nova is an AI" label at the top of every chat and on every public Nova post; first-use modal explaining limits ("can be wrong; educational only; not a financial adviser").
- Grounding: have Nova compute scores from data the app holds, and phrase uncertain content as questions. Log prompts and outputs for incident review. Rules-engine fallback also labeled as automated.
- Do not describe the 0-100 score as predictive or validated; call it "a process-quality score from a fixed rubric", and publish the rubric.
- Report-an-AI-reply button and a human-review path for flagged replies (a stand-in for Anthropic's human-in-the-loop).
- Add the "Not investment advice" disclaimer inside the Nova panel, adjacent to the input box.

**Owner actions.** Read the current Anthropic usage policy and commercial terms in full; consider contacting Anthropic's sales/support to confirm your use case; sign the DPA; set spend caps and abuse limits on the API key; confirm prompt-injection hardening (users' posts become model inputs).

### 2.8 Accessibility

- ADA Title III has been applied by many courts to commercial websites ("places of public accommodation", circuit split on websites without physical nexus). Thousands of demand letters and suits are filed yearly, mostly against e-commerce sites. The DOJ's April 2024 rule setting WCAG 2.1 AA applies to state and local governments (Title II), not private businesses, but WCAG is the de facto yardstick ([DOJ web guidance](https://www.ada.gov/resources/web-guidance/)). WCAG 2.2 AA is the current practical target ([W3C](https://www.w3.org/TR/WCAG22/)).
- **European Accessibility Act** (Directive (EU) 2019/882) has applied since 28 June 2025 to e-commerce and certain consumer services; a microenterprise exemption for services (fewer than 10 staff and under EUR 2M turnover) may apply ([EU summary](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/union-equality-strategy-rights-persons-disabilities-2021-2030/european-accessibility-act_en)) **(applicability to a free educational app: unverified)**.
- Risk areas here: color-only gain/loss indicators, charts without text alternatives, drag/hover-only interactions, animated XP/confetti (motion), quiz timers, focus management in modals, contrast in dark mode.

**Build into the product now.** Charts with data tables or text summaries; never color alone for P&L (add +/- and icons); keyboard operability and visible focus; `prefers-reduced-motion` respected; labeled form controls; 4.5:1 contrast; no timed quizzes without extension; automated axe/Lighthouse CI plus a manual screen-reader pass; accessibility statement with a contact method. **Owner actions:** commission an audit before paid tiers; avoid "accessibility overlay" widgets, which have drawn suits and criticism.

### 2.9 Other

- **Licenses.** Barlow and Source Serif are under the [SIL OFL 1.1](https://openfontlicense.org/): free to use and embed in web apps; bundle the license text, don't sell the fonts alone, and respect Reserved Font Names if you modify them. Next.js is MIT; lucide is ISC; both require keeping copyright and license notices. Add a "Third-party notices" page (generate from `license-checker`) and audit transitive dependencies for copyleft (GPL/AGPL) licenses.
- **Real market data later.** Exchange data is licensed: NYSE/Nasdaq/SIP data carry display and non-display fees and redistribution limits, even if delayed; vendor terms (Polygon, IEX, Alpha Vantage, etc.) often prohibit redistribution or require attribution and commercial plans. Simulated data today avoids this. Real quotes plus real tickers raises the "real-money advice" and market-data-license questions together **(unverified specifics; check each vendor's terms)**.
- **CAN-SPAM / TCPA.** [CAN-SPAM](https://www.law.cornell.edu/uscode/text/15/chapter-103) applies to commercial email: accurate headers, physical postal address, unsubscribe honored within 10 business days. Transactional email is largely exempt. [TCPA (47 U.S.C. 227)](https://www.law.cornell.edu/uscode/text/47/227) requires prior express written consent for marketing texts/autodialed calls; statutory damages $500-$1,500 per message. Avoid SMS until a consent flow exists; push notifications are generally outside TCPA but need store-policy compliance. GDPR/PECR require opt-in for marketing email in the EU/UK.
- **LLC and insurance.** An LLC separates business debts from personal assets but does not shield you from your own torts or from liability if you ignore formalities (veil piercing) or personally guarantee. Form it before launch, assign the IP/domain/trademark to it, open a separate bank account, and sign contracts in its name. FinCEN's March 2025 [interim final rule](https://www.govinfo.gov/content/pkg/FR-2025-03-26/html/2025-05199.htm) exempts US-formed companies and US owners from Corporate Transparency Act beneficial-ownership reporting (confirm whether a final rule has since changed this). Insurance: tech E&O plus cyber (and media liability, which covers defamation, IP and trademark claims from content) are the relevant lines; ask a broker whether a pre-revenue app is insurable and what AI exclusions apply **(unverified premiums)**.

---

## 3. Checklists

### 3.1 Terms of Service must include

- [ ] Parties, effective date, version number; plain-language summary box
- [ ] Eligibility: minimum age (decide 18+ or 13+), authority, no use where prohibited
- [ ] Service description: **educational simulation, paper trading, no real money, no brokerage, no real orders, prices/news/members are simulated**
- [ ] **No investment, financial, tax or legal advice; Nova is an AI; no fiduciary relationship; user responsible for own decisions**
- [ ] Hypothetical/simulated performance disclaimer
- [ ] Not affiliated with or endorsed by any company named; names used for identification
- [ ] AI features: may be inaccurate; outputs not verified; AI vendor processing; prohibited prompts/abuse
- [ ] Account terms (when accounts launch): accuracy, security, one account, termination
- [ ] Acceptable use: no real-money solicitation, manipulation, spam, harassment, scraping, reverse engineering, abusing the AI
- [ ] User content: ownership, license grant to Vantage, representations, moderation rights, removal
- [ ] DMCA notice and counter-notice procedure and designated agent; repeat-infringer policy
- [ ] Intellectual property: ownership of app, course content, scores; trademark notice
- [ ] Third-party links/services and open-source notices
- [ ] Fees, free trial, auto-renewal, cancellation and refunds (when paid tiers exist)
- [ ] Disclaimer of warranties (as is, no uptime guarantee, no accuracy guarantee)
- [ ] Limitation of liability and cap; carve-outs required by law
- [ ] Indemnity (consider narrower or omit for consumers)
- [ ] Dispute resolution: informal resolution first, arbitration, class waiver, opt-out window, small-claims carve-out, mass-arbitration protocol
- [ ] Governing law and venue; non-US consumer-rights carve-out
- [ ] Changes to terms: notice and re-acceptance for material changes
- [ ] Termination and data export/deletion on exit
- [ ] Export/sanctions compliance (OFAC-sanctioned countries blocked)
- [ ] Severability, entire agreement, assignment, notices, contact
- [ ] Accessibility contact and Privacy Policy cross-reference

### 3.2 Privacy Policy must include

**Today (no accounts):**
- [ ] Who we are (entity, contact email, postal address)
- [ ] What data: local storage contents (portfolio, trades, profile name, settings, progress); data sent to AI provider (portfolio, trades, name, chat); server/host logs (IP, user agent); anything else
- [ ] Purposes and legal bases (GDPR: contract/legitimate interests/consent)
- [ ] Recipients: AI provider (name Anthropic), hosting, analytics (none today); processor status and DPAs
- [ ] Whether AI vendor retains or trains on data (as per current vendor terms)
- [ ] localStorage/cookie statement; no ad tracking; consent for any non-essential storage
- [ ] Retention periods; how users clear local data
- [ ] User rights (access, deletion, correction, portability, objection, appeal) and how to exercise; response times
- [ ] International transfers and safeguards
- [ ] Children: minimum age, no knowing collection under 13 (or the chosen age), what happens when discovered
- [ ] California disclosures (categories collected, no sale or sharing, "Do Not Sell or Share" status, Global Privacy Control honoring), other state rights
- [ ] Security measures; breach notification commitment
- [ ] Do-Not-Track/GPC handling; changes to policy; effective date; contact; EU/UK representative and DPO if required; supervisory authority complaint right

**Added when accounts launch:** account data (email, password hash, auth provider), profile and community content, public vs private visibility, leaderboard display, Supabase and other processors, IP/device/auth logs, analytics and cookie consent banner, email/notification preferences and unsubscribe, payment processor and billing data (when subscriptions launch), account deletion and data export, content moderation data, retention schedule per data type, sale/share/targeted-advertising statements, sensitive-data handling (do not collect financial account numbers), data-breach plan.

### 3.3 Required in-app disclaimers (placement)

| Disclaimer | Placement |
|-----------|-----------|
| "Vantage is an educational simulator. No real money, no real trades. Not investment advice." | Global footer on every page; also on landing hero sub-text |
| Pre-trade line: "Simulated trade. Prices are generated and are not real market prices." | Trade ticket, above the confirm button |
| Hypothetical performance statement | Beside portfolio return, leaderboard, and any shared score |
| "SIMULATED" tag + "Fictional scenario, not real news" | On every headline card and news page header |
| "Sample profiles are fictional" (badge per item, not a footnote) | On each seeded post, member, like count, and challenge |
| "Nova is an AI coach. It can be wrong. Not investment advice." | Top of the Nova chat panel, adjacent to the input, and on each public Nova post (AI badge) |
| "Your portfolio, trades, name and messages are sent to our AI provider." | First-use Nova modal and under the chat input; link to privacy policy |
| "Not affiliated with or endorsed by any company named." | Footer; company/ticker pages |
| Age/terms clickwrap | Onboarding / signup, unticked box |
| Statistic citation links + "as of" date | Inline in lessons and quizzes |
| Landing mock review: "Example, not a real user review" | Directly under the mock coach review and example scores |
| Report/flag and community rules link | Every post/comment; composer |
| Copyright agent contact | Footer legal page |

---

## 4. Open questions for the owner

1. **Entity and domicile:** which US state; form an LLC now (and who is the manager)? Who owns the domain, code and name?
2. **Name:** are you willing to rebrand if clearance fails? Which classes and territories matter (US only, or EU/UK)?
3. **Jurisdiction and reach:** US-only launch, or geo-block EU/UK/Canada until compliant? Any sanctioned-country blocks?
4. **Minimum age:** 18+, or 13+? Will you verify age beyond self-declaration? Are teens an intended audience?
5. **Real company names:** keep real tickers and descriptions, or move to fictional companies? Who writes the headline templates?
6. **Seed content:** will fabricated community content ship at launch? If so, will it be labeled per item, or removed?
7. **AI use:** is Nova on at launch? Which Anthropic plan and terms apply? Is the user's display name needed in prompts? Will Nova ever name real tickers?
8. **Monetization and market data:** subscriptions, affiliate/broker referrals (which raises broker-referral and advice issues), real market data and when?
9. **Contact and agent details:** legal/support email, postal address (needed for CAN-SPAM and the DMCA agent), who moderates and how fast?
10. **Analytics and marketing:** any analytics, ads, email or SMS planned (consent, CAN-SPAM, TCPA)?
11. **Insurance and budget:** appetite for E&O/cyber coverage; budget for a trademark search and a one-time lawyer review of terms/privacy?
12. **Mobile apps:** App Store/Google Play financial-app and AI-content rules, age ratings, and in-app purchase fees need a separate review.

## Source notes

Verified via search in this session (secondary sources): FTC Part 465 existence, dates and §465.8 scope; COPPA amended-rule dates; SEC's June 2025 withdrawal of 14 proposals; Colorado SB 26-189; EU AI Act Article 50 and Digital Omnibus (sources conflict on one date); Massachusetts v. Robinhood outcome; existence of third-party VANTAGE filings; Anthropic high-risk-use requirements (summaries only). Everything else is from background knowledge and marked where uncertain. No USPTO or Anthropic primary text was opened.

## Verification log (2026-11-24)

Only anthropic.com could be fetched directly in this session; ecfr.gov, federalregister.gov, cornell.edu, justia, cppa.ca.gov and others did not resolve. Other claims were checked through search results (law-firm and agency pages), which counts as "verified (secondary)".

| Claim | Source | Status |
|-------|--------|--------|
| Anthropic usage policy: Finance is high-risk (personalized recommendation to buy/sell/hold/allocate among specific products); human review; AI disclosure; version effective Nov 12, 2026 | [anthropic.com/legal/aup](https://www.anthropic.com/legal/aup) (primary, fetched) | Verified; **corrected**: scope is narrower than the draft implied (see 2.7) |
| 16 CFR Part 465 exists, effective Oct 21, 2024; §465.8 covers fake indicators of social media influence (bots, non-real accounts); "knew or should have known" standard | [Federal Register](https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials), [eCFR](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465) via search summaries; text itself not fetched | Verified (secondary); exact text and penalty amount (about $50,000+) still unverified |
| CCPA revenue threshold | [CPPA table](https://www.cppa.ca.gov/regulations/cpi_adjustment.html): $26,625,000 from Jan 1, 2025 | **Corrected** (was "about $26.6M, unverified") |
| COPPA amended rule published Apr 22, 2025; compliance date Apr 22, 2026 | [Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) via search | Verified (secondary). The "actual knowledge" standard (rule applies to general-audience services with actual knowledge of under-13 users) is stated from background knowledge and not re-fetched: still unverified |
| Lowe v. SEC, 472 U.S. 181 (1985), publisher's exclusion | [Justia](https://supreme.justia.com/cases/federal/us/472/181/) | Not re-fetched (host blocked); still unverified in this session |
| Meyer v. Uber, 868 F.3d 66 (2d Cir. 2017) | cite in 2.5 | Not re-fetched; still unverified in this session |
| Chabolla v. ClassPass (129 F.4th 1147) and Godun v. JustAnswer (No. 24-2095), 9th Cir. 2025 | [Fenwick](https://www.fenwick.com/insights/publications/ninth-circuit-reinforces-stricter-standards-for-online-user-agreements), [Hunton](https://hunton.com/privacy-and-information-security-law/its-a-wrap-the-latest-from-the-ninth-circuit-on-sign-in-wrap-agreements) | Verified (secondary); added later contrary district ruling (Blackburn) |
| Click-to-cancel rule vacated (Custom Communications v. FTC, 8th Cir., July 8, 2025) | [DLA Piper](https://www.dlapiper.com/insights/publications/2025/07/ftcs-click-to-cancel-rule-voided) | Verified (secondary); **corrected** to say the older Negative Option Rule remains |
| Utah SB 226 narrowing; SB 332 extends to July 2027 | [Davis Polk](https://www.davispolk.com/insights/client-update/utah-scales-back-reach-generative-ai-consumer-protection-law) | Verified (secondary); sunset attribution to SB 332 **corrected** |
| FinCEN CTA exemption for US companies | [Federal Register, Mar 26, 2025](https://www.govinfo.gov/content/pkg/FR-2025-03-26/html/2025-05199.htm) | Verified (secondary); later final rule not checked |
| Colorado SB 26-189 signed May 14, 2026, effective Jan 1, 2027 | search summaries (earlier) | Verified (secondary); litigation status unchecked |
| EU AI Act Art. 50 applicable Aug 2, 2026; Omnibus date conflicts | [Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force) | Verified (secondary); Art. 50(2) date still unverified |
| Remaining "(unverified)" items: Advisers Act state-law specifics, SEC/FTC AI-washing actions, UK FSMA/MiFID points, Vantage Markets' US rights, defamation analysis, Texas privacy law, state age-design laws, Anthropic API 18+ and training terms, NCII duties, California chatbot laws, Colorado applicability, EAA microenterprise exemption, market-data vendor terms, insurance availability | none found in this pass | Still unverified; each carries a note on what counsel should check |
