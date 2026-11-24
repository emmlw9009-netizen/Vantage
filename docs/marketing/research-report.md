# Vantage: Pre-Launch Marketing Research Report

Prepared 2026-11-24. Scope: Meta ads and organic channels for a free, US-first, 18+ investing-education simulator. This is research, not legal advice; a separate legal review is under way and should sign off on all ad copy.

**Verification note.** Web search worked; direct page fetches of Meta's policy site were blocked by the sandbox network. Policy statements below come from search-result summaries of Meta's pages and developer docs. Anything not confirmed is marked "(unverified)". Re-read the linked Meta pages in Ads Manager before launch, because Meta edits these often.

---

## 1. Executive summary: top 10 recommendations (priority order)

1. **Treat Meta ads as a second-phase channel; build the organic and product loop first (weeks 1-4).** With no revenue and a solo founder, the cheapest signal is organic short video plus SEO pages. Start paid only once activation is instrumented (recommendation 3).
2. **Run Meta campaigns under the Special Ad Category "Financial products and services" unless Meta's own review tells you otherwise.** Meta requires it for US financial products and services campaigns since Jan 14, 2025 ([Meta developer docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category), via search summary). Whether a free educational simulator counts is not stated in the sources I found (unverified). Declaring it costs you narrow targeting; not declaring when Meta thinks you should risks rejections and account restrictions. Default to declaring it, and test.
3. **Instrument events before spending a dollar:** Pixel plus Conversions API, with `CompleteRegistration`, a custom `OnboardingComplete`, `FirstTrade`, `FirstTradeWithStopLoss` and `LessonComplete`. Optimise on the deepest event that gets about 50 events a week (Meta's rule of thumb; treat as unverified, see section 3.3).
4. **Position as "the practice field for process, not picks": Vantage grades how you trade, not what you trade.** This separates you from simulators that only track P&L (section 5).
5. **Lead creative with the AI review (Nova's 0-100 trade score) shown on screen.** It is the only demonstrable, differentiated feature, and it makes a clean non-advice story: "see why a trade was risky".
6. **Publish the 19 lessons as public, indexable pages and ship two free calculators** (position size, reward-to-risk). These are the durable, zero-cost acquisition asset and also feed AI-search citations.
7. **Ship share cards (trade score, discipline rank, weekly challenge result) and a referral link before launch.** Organic video and community challenges need a shareable artifact.
8. **Post 4-5 short videos a week across TikTok, Reels and Shorts from the same recordings;** keep every video free of real-return claims and carry a short "educational, not advice" overlay.
9. **Use creators sparingly and only with written disclosure terms** (FTC Endorsement Guides). Prefer college investing clubs and micro-creators on flat fees, never performance claims.
10. **Set hard guardrails and a pre-approval checklist** (section 7): no implied returns, no "Are you broke?" copy, no fake reviews or bought followers, 18+ only. The FTC fake-review rule carries civil penalties ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)).

---

## 2. Meta ads policy fit

### 2.1 What the rules say (as verified)

| Topic | Finding | Source |
|---|---|---|
| Financial and insurance products | Ads for credit cards, loans, insurance must target 18+. Advertisers may need licences per country. Meta can check authorisation. | [Meta: Financial and Insurance Products and Services](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/financial-services/) |
| US investment ads | Investment-product ads in the US cannot promote opportunities that push users to interact via direct messaging. | same page (via search summary) |
| Prohibited financial products | Binary options, ICOs, CFDs, misleading student-loan consolidation or refinancing. | [Meta: Prohibited Financial Products and Services](https://transparency.meta.com/policies/ad-standards/deceptive-content/prohibited-financial-products-and-services/) |
| Special Ad Category | `FINANCIAL_PRODUCTS_SERVICES` replaced `CREDIT`. Required for US-based advertisers or US audiences since Jan 14, 2025. Housing/employment audience restrictions apply, enforced as hard errors via API. Category scope described as including insurance, bank accounts, investment services and payment services. | [Meta developer docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category) |
| Countries | US, Canada and parts of Europe require self-identification. | [Meta transparency](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/financial-services/) (via search summary) |
| Personal attributes | You may not assert or imply a viewer's attributes; "vulnerable financial status" is on the list. Meta's example: "Are you bankrupt?" is prohibited. "We can help you finally get out of debt" is flagged as implying the viewer is in trouble. | [Meta: Personal attributes](https://transparency.meta.com/policies/ad-standards/objectionable-content/personal-attributes), [Jon Loomer](https://www.jonloomer.com/qvt/personal-attributes-and-ad-rejections/) |
| Deceptive practices | Ads promoting offers using deceptive or misleading practices are prohibited. Specific "get rich" wording rules were not retrieved (unverified); expect enforcement under this policy. | [Meta Advertising Standards](https://transparency.meta.com/policies/ad-standards/) |
| Detailed targeting | Meta has removed sensitive options since Jan 2022 and further consolidated interest options (a January 2026 round is reported by secondary sources; unverified). | [Social Media Today](https://www.socialmediatoday.com/news/meta-removes-more-detailed-ad-targeting-options-facebook-instagram/757856/), [Meta Advantage+ audience docs](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-expansion/advantage-audience/) |

### 2.2 Unresolved question: is Vantage a "financial product or service"?

Vantage is a free simulator, not a broker, and moves no money. None of the sources I found say whether such an app falls under the special category (unverified). Practical stance:

- Select the Financial Products and Services category when creating campaigns. This is the safe default and Meta's review is more likely to pass cleanly.
- What you lose: age/gender/ZIP targeting, Lookalike audiences (replaced by a category-compliant "special ad audience" equivalent; details unverified), and detailed-targeting options. For a "broad plus creative-led" strategy this costs little.
- Keep a written record of what you declared and why, and raise it with counsel.

### 2.3 What an educational app may and may not say

May say (framed around learning and process):
- "Practice with virtual money. No real funds are used."
- "Get a score on how you sized and protected a trade."
- Feature descriptions: lessons, quizzes, simulated market, AI review.
- Truthful, specific claims you can substantiate ("19 lessons", "$100,000 in virtual cash").

May not say:
- Any implied or guaranteed return ("turn $100k into $1M", "learn to beat the market").
- Before/after P&L screenshots presented as skill outcomes. Simulated results must be labelled simulated, and should not be the headline.
- Statements about the viewer's finances ("Broke? Fix it", "Still living paycheck to paycheck?").
- Anything urging real trades or implying advice ("Buy this now").
- "Free money", "easy", "secret", "risk-free" phrasing. "Risk-free practice" is arguable; use "no real money at stake" (unverified whether "risk-free" is flagged).

### 2.4 Example copy

| Compliant | Non-compliant | Why |
|---|---|---|
| "Practice the market before it counts. Paper trade with $100,000 in virtual money." | "Turn $100K into millions with Vantage." | Implied returns |
| "Nova scores every practice trade on risk sizing and stop-losses." | "The AI that picks winning trades." | Implies advice and outcomes |
| "Learn what a stop-loss is in 3 minutes. Free lesson." | "Are you tired of losing money in stocks?" | Personal-attribute implication |
| "New to investing? Try it with virtual money first." | "Broke? Start investing today." | Financial status attribute |
| "Simulated market. Educational use only. Not investment advice." (overlay or footer) | "I made +312% in 30 days" (simulated, no label) | Unlabelled simulated results; misleading |
| "See your discipline score on the weekly challenge." | "Beat the leaderboard and win cash" (if prizes exist) | Prize rules and gambling-adjacent flags; avoid |

### 2.5 Likely rejection reasons

1. Missing or wrong special-ad-category declaration.
2. Personal-attribute language (second-person financial status).
3. Return-implying images (green arrows, charts going up, cash stacks) combined with "invest" language.
4. Landing page lacking a clear disclaimer, privacy policy, or mismatched claims versus ad.
5. Pixel privacy disclosure absent (section 3.6).
6. Screenshots with real ticker logos implying endorsement (Vantage uses simulated prices; keep a "simulated" label).
7. "Get rich", "secret", "guaranteed" phrases.

Account tip: start with 3-5 conservative ads, get a clean approval history, then widen. Appeal rejections once with a short factual note ("educational simulator, no real money").

---

## 3. Meta ads playbook for a small budget

### 3.1 Objective and destination

| Option | When | Notes |
|---|---|---|
| **Web app, Sales/Leads objective optimising on Pixel/CAPI events** | Now (web app only) | Recommended. |
| Advantage+ app campaign | After the mobile app ships | Meta unified Advantage+ across sales, app and leads; a campaign counts as Advantage+ only when budget, audience and placement automation are all on ([Meta developer docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns.md)). |
| Traffic / Engagement | Avoid | Cheap clicks, poor activation, trains the algorithm on the wrong user. |

Because the app is web-only, the "app install" benchmark is moot until the mobile build ships. App events can go through the Conversions API (dataset-linked; dedupe on `event_id` + `event_name`) per [Meta's app-events docs](https://developers.facebook.com/documentation/ads-commerce/conversions-api/app-events).

### 3.2 Event setup

| Event | Type | Use |
|---|---|---|
| `PageView`, `ViewContent` (lesson page) | Standard | Retargeting pool (minimum audience size applies) |
| `Lead` (waitlist email) | Standard | Pre-launch objective |
| `CompleteRegistration` | Standard | First optimisation target |
| `OnboardingComplete` | Custom | Quality filter |
| `FirstTrade`, `FirstTradeWithStopLoss` | Custom | Activation; the true goal |
| `LessonComplete` | Custom | Engagement; secondary |

Send each from browser Pixel and server CAPI with a shared `event_id`. Pass hashed email where the user consented, plus `fbc`/`fbp`. A secondary source claims CAPI users saw 17.8% lower cost per result in a Nov 2025 Meta experiment (unverified; [Stape](https://stape.io/tr/blog/facebook-conversion-api-vs-facebook-pixel)). Never send financial details, trade contents or anything sensitive as event parameters; keep to event names and IDs.

Optimisation ladder: start on `CompleteRegistration`; move to `FirstTrade` once you have roughly 50 events per week per ad set (common guidance; the "about 50 conversions" claim in my sources is unofficial, so unverified).

### 3.3 Audiences

- Special category limits detailed targeting, so go **broad, 18+ (set min 18; Advantage+ audience lets age_min be 18-25 only and fixes max at 65 per [Meta docs](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-expansion/advantage-audience/))**. Creative does the targeting: a "college student" angle and a "just opened Robinhood/Schwab" angle reach different people with the same audience.
- Geography: US only, then big states or metros if CPMs are uneven.
- Retargeting: site visitors and signups who did not trade, as soon as pools are large enough.
- Lookalikes: only after about 1,000 high-quality seed users (`FirstTrade`); availability under the special category is unverified, so test.
- Exclude existing users via a custom audience of registered emails.

### 3.4 Creative formats

| Format | Concept |
|---|---|
| Screen recording, 15-30s | Make a trade, get Nova's score and critique |
| Founder-led selfie video | "I built this because I lost money by not using stops" (personal story, no returns) |
| "I tried paper trading for 30 days" | Process learnings, discipline score trend, labelled simulated |
| Myth/explainer | "What a stop-loss does, in 20 seconds" |
| Static carousel | "5 red flags Nova catches" (revenge trade, no stop, oversize) |
| UGC-style reaction | Real student testing the app (disclose any compensation) |

Use 9:16 Reels and Stories first. Burn in captions. Put the simulated/educational disclaimer in the first 3 seconds or as a persistent small overlay and in the primary text.

### 3.5 Testing structure

- One campaign, one ad set for creative tests (ABO), 4-6 ads each with a different concept/hook, not minor variants.
- Run each test about 5-7 days or until each ad has spent about 2-3x target cost per signup; kill the bottom half; promote winners to a scaling campaign (Advantage+ settings).
- Test budget share: 20-30% of spend (agency heuristic, unverified).
- Do not edit live ads; duplicate instead, to preserve learning.

### 3.6 Benchmarks (use as ranges, validate with your own data)

| Metric | Figure | Source / confidence |
|---|---|---|
| Facebook traffic-campaign CPC, Finance & Insurance | $1.22 (2025 report); $0.86 (2026 report) vs all-industry $0.70 / $0.60 | [WordStream 2025](https://wordstream.com/blog/facebook-ads-benchmarks-2025), [WordStream 2026](https://www.wordstream.com/blog/facebook-ads-benchmarks-2026) via search summary |
| Cost per lead, all industries | about $27.66, up about 21% YoY | WordStream 2025, same summary |
| Finance CPL | about $39 (July 2025-July 2026) | [Superads](https://www.superads.ai/facebook-ads-costs/cost-per-lead/finance); third-party estimate |
| Blended CPM | about $14 | [Digital Applied](https://digitalapplied.com/blog/facebook-ads-benchmarks-2026-cpc-cpm-ctr-industry); secondary |
| Finance-specific CPM | no reliable figure (unverified) | |
| Finance app CPI (US, Meta) | about $8.32 | [Superads](https://www.superads.ai/facebook-ads-costs/cost-per-app-install/finance/united-states); vendor estimate. iOS $2-5+, Android $1-3 ranges are unsourced (unverified) |

Planning assumptions for Vantage (my estimates, unverified): CPM $15-30 under the special category; CPC $1-2.50; click-to-signup 15-30% on a good landing page; cost per signup $4-12; cost per first trade $15-40 because roughly a third to half of signups will not trade. Expect the first month to be above this range.

### 3.7 Measurement stack

- **UTMs** on every link: `utm_source=meta&utm_medium=paid&utm_campaign=<name>&utm_content=<creative_id>`. Same convention for creators (`utm_medium=creator`) and organic (`utm_medium=social`).
- **Pixel + CAPI** as in 3.2. Verify with Meta's Test Events and Event Match Quality (EMQ is web-only per [Meta best practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices)).
- **Product analytics** (PostHog, Amplitude or similar, your choice) as the source of truth for activation and D7 retention; Meta's attribution will over-claim.
- **Consent and privacy:** your privacy policy must disclose the Pixel and CAPI, data categories shared with Meta, and opt-out options. Meta's business terms also require you to have rights and notice for data you send (details of the exact clause: unverified). Add a cookie/consent banner for EU/UK visitors and state-level opt-outs (California, others); have counsel confirm.
- Weekly dashboard: spend, signups, cost per signup, activation rate, cost per activated user, D7 retention by channel.

### 3.8 Sample 30/60/90-day plans

Assumptions: web app, no revenue; plans assume tracking is live and organic is running. Cost per activated user (first trade) is the headline metric.

**$1,000 per month (about $33/day)**

| Phase | Plan |
|---|---|
| Days 1-30 | One test campaign, 4 creatives, $20/day on `CompleteRegistration`. Hold $300 for retargeting later. Goal: find 1-2 concepts under $10 per signup. |
| Days 31-60 | Cut losers; one ad set of winners at $25/day, optimise on `OnboardingComplete` if volume permits. Add 2 new concepts. |
| Days 61-90 | Retargeting at $5/day; continue creative refresh monthly. Decide whether to scale or pause based on cost per activated user. |

Reality check: at this level you get about 100-250 signups a month; treat it as creative research, not growth.

**$3,000 per month**

| Phase | Plan |
|---|---|
| Days 1-30 | Test campaign $50/day (6 creatives, 2 ad sets: broad and a student-angle creative set). |
| Days 31-60 | Move winners into an Advantage+ scaling campaign at $60/day; test campaign continues at $25/day; retargeting $10/day. |
| Days 61-90 | Optimise on `FirstTrade`. Seed lookalike from activated users if allowed. Split-test landing pages (lesson page vs home). |

**$10,000 per month**

| Phase | Plan |
|---|---|
| Days 1-30 | $150/day across 2-3 test ad sets, 10 creatives; $50/day retargeting once pools allow. |
| Days 31-60 | Scaling campaign with winners at $200/day; add creator-produced UGC ads; try Instagram-only vs Facebook placement splits. |
| Days 61-90 | Optimise on `FirstTrade`; incrementality test (geo or holdout); weekly creative refresh; begin app campaign prep for mobile launch. |

Increase budgets by 20-30% every few days only when cost per result holds (common practice; unofficial).

---

## 4. Organic

### 4.1 Short-form video

Platforms: TikTok, Instagram Reels, YouTube Shorts. Cross-post the same edit (remove watermarks). TikTok's own ad policy for financial services requires enhanced transparency (page updated Jan 2025; a June 2026 change-log entry exists whose content I could not read; unverified) ([TikTok policy](https://ads.tiktok.com/help/article/tiktok-ads-policy-financial-services)). Branded content rules for financial promotions on TikTok are stricter than for ordinary products (details unverified); read them before paying any creator there.

Pillars:
1. **Process over picks:** position size, stop-losses, risk-reward.
2. **Nova reviews:** the AI scores a trade and explains it.
3. **Beginner myths and glossary:** short definitions.
4. **Build in public:** founder story, product updates, challenge results.
5. **Community and challenges:** leaderboard and weekly challenge highlights.

Cadence: 4-5 short videos a week for 8 weeks (about 35), 1 YouTube long-form a week, 3 Reddit/X/Threads posts a week, a weekly email. For a solo founder, batch-record 8-10 clips in one session.

### 4.2 Fifteen post ideas tied to features

1. "The AI grades my worst trade" (Nova scores a 22/100).
2. "I broke every risk rule on purpose; here is what Nova flagged."
3. "What a stop-loss would have saved me" (simulated, labelled).
4. "Position sizing in 30 seconds" using the calculator.
5. "Your first paper trade, step by step" (onboarding walkthrough).
6. "Nova's 5 emotional red flags" (revenge trading, FOMO, averaging down).
7. "I paper-traded for 30 days; my discipline score went from 41 to 78."
8. "Can a beginner beat a random trade? We scored both." (process, not returns)
9. "Reading a simulated news headline: should you trade it?" (news module)
10. "Weekly challenge recap: who won on discipline, not profit?"
11. "Quiz time: spot the bad trade" (interactive).
12. "What does 1% risk per trade look like on $100K?"
13. "XP and levels: is gamified learning cheesy?" (honest take on the gamification backlash)
14. "Why a 90-score losing trade beats a 20-score winning trade."
15. "I built this app as a solo founder; here is what I got wrong" (build in public).

### 4.3 YouTube long-form

Monthly or weekly 8-15 minute videos: "How to paper trade (full walkthrough)", "Position sizing explained", "Backtesting your first strategy". Optimised titles for search, link in description to the matching lesson page. Good fits for AI search, which often cites YouTube transcripts (unverified).

### 4.4 SEO

- Make the 19 lessons public, server-rendered, with clean URLs, titles, FAQ schema, and a "start practicing" call to action (not paywalled; signing up unlocks quizzes and XP).
- Keyword themes (volumes not verified; check in Search Console/Ahrefs): "how to paper trade", "what is a stop loss", "position sizing calculator", "risk reward ratio calculator", "paper trading for beginners", "how much to risk per trade", "best stock simulator", "stock market simulator for students".
- **Link magnets:** the position-size calculator and the reward-to-risk calculator, each with a short explainer and embeddable widget; submit to educator and student-finance resource pages.
- Comparison pages ("Vantage vs Investopedia simulator") with accurate, sourced statements.
- Technical: sitemap, fast load, no gating of lesson text, canonical tags, internal links from every lesson to the next lesson and to a tool.

### 4.5 AI-search visibility

Make pages easy to quote: definition-first paragraphs, short answers under each H2, tables, dated updates, an author/about page, and an `llms.txt` (value unverified). Earn mentions on Reddit, YouTube and independent "best simulators" lists, since models draw heavily from these (unverified). Check weekly by asking ChatGPT, Claude and Perplexity target questions and logging whether Vantage appears. Do not engage in link spam or fake listicles.

### 4.6 Communities

| Channel | Approach | Rules |
|---|---|---|
| Reddit | Answer questions in r/investing, r/stocks, r/personalfinance, r/learnprogramming-style beginner threads; post in r/SideProject, r/startups for feedback | Self-promotion: a "9:1" ratio is a common norm, with each subreddit's sidebar controlling ([summary](https://redship.io/blog/reddit-self-promotion-rules-2026)). The finance subreddits' exact rules were not verified; read the sidebar first, assume app promotion is banned, and ask moderators before posting. |
| Discord | Own server for the community plus participation in student investing servers | Follow server rules, ask admins. |
| X / Threads | Daily build-in-public and short trade-review screenshots | Keep disclaimers. Threads can also carry Meta ads, since Meta placements include it. |
| LinkedIn | Founder posts, targeting career-starters and campus finance clubs | |
| Product Hunt, Hacker News (Show HN), Indie Hackers, BetaList | One launch event each, with an honest description | Do not mass-ask for upvotes. |

### 4.7 Partnerships, referrals, email, ASO

- **College investing clubs:** offer a free club leaderboard and a workshop kit (slides plus a club challenge). Low cost, high trust.
- **Creators:** micro-creators (5k-100k) in beginner finance. Contract must require clear disclosure of the material connection and forbid performance claims. The FTC Endorsement Guides were updated in 2023, and #ad-style disclosure must be clear and unavoidable ([FTC final rule on reviews, plus Guides context](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)).
- **Referral loop:** invite a friend; both get a cosmetic reward (badge, extra cosmetic XP), nothing with cash value.
- **Community challenges as content:** weekly challenge winners get a share card; reshared automatically to X, Reels cards, and Discord.
- **Email newsletter:** weekly "one lesson, one trade review, one challenge" with an unsubscribe and physical-address footer (CAN-SPAM).
- **ASO (after mobile ships):** keyword in title ("Paper Trading: Learn Investing"), screenshots showing Nova's score, a preview video, ratings prompt after a high-score trade; ask for ratings honestly (see section 7). Category benchmarks: [AppTweak finance report](https://www.apptweak.com/en/aso-blog/finance-app-benchmark-report-2025?format=md) (figures not extracted).

---

## 5. Positioning and messaging

### 5.1 Competitive landscape

| Competitor | What it is | Status |
|---|---|---|
| Investopedia Stock Simulator | Free virtual trading, games, widely known | Active as of a 2026 roundup ([WTOP](https://wtop.com/news/2026/08/5-of-the-best-sites-for-paper-trading-stocks/)) |
| Webull, thinkorswim paperMoney | Broker-linked paper trading | Exist (listed in roundups); current feature status unverified |
| Robinhood Learn, Public | Broker education content | Existence assumed; current status unverified |
| Zogo | Gamified financial literacy, rewards | Status unverified |
| Atom Finance | Research/analytics | Status unverified; check before naming |
| Older sims (StocksQuest, StockLinkU, UpDown) | Closed | Shut down ([HowTheMarketWorks](https://www.howthemarketworks.com/?p=8730)) |

Only Investopedia's activity is confirmed in my sources; check the rest manually before publishing comparisons.

### 5.2 Three positioning options

| Option | Statement | Strength | Risk |
|---|---|---|---|
| A. Process coach | "The only paper trading app that grades how you trade, not just what you made." | Differentiated; plays to Nova; safe from returns claims | Needs proof that scoring is useful |
| B. Safe practice | "Learn investing with $100K of fake money before risking real money." | Simple; broad appeal to nervous beginners | Crowded; same as every simulator |
| C. Gamified learning | "Duolingo for investing: lessons, XP, challenges." | Fun, social, shareable | Gamification backlash; invites "gambling" comparisons |

### 5.3 Recommendation

**Option A, with B as the entry hook.** Lead: "Practice the market before it counts" (your tagline) as the emotional promise; proof point: "Nova scores every trade on risk, stops and emotion."

### 5.4 Messaging hierarchy

1. **Promise:** Practice the market before it counts.
2. **Differentiator:** An AI coach scores the process behind every trade (0-100).
3. **Proof:** $100,000 virtual cash; 19 lessons; discipline leaderboard; weekly challenges.
4. **Reassurance:** Free. No real money. Educational, not advice.
5. **Call to action:** "Make your first practice trade."

Language to avoid: "beat the market", "profit", "returns", "get rich", "alpha", "signals".

---

## 6. Risks and guardrails

### 6.1 Do not

| Risk | Rule |
|---|---|
| Implied returns | Never show simulated P&L as a headline; label any simulated result "simulated"; do not compare simulated performance to real indices. |
| Investment advice | Nova explains process; it never says "buy X". Review Nova outputs for advice-like phrasing. |
| Finfluencer pitfalls | Creators must not promise returns or give personalised recommendations; require disclosure; keep approval rights over scripts; keep records. |
| Fake social proof | No invented testimonials, reviews, user counts, or leaderboard data. The FTC rule bans fake reviews and the buying or selling of fake social-media indicators (followers, views) with civil penalties for knowing violations ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)). Seeded demo leaderboard users must be labelled as demo accounts. |
| Buying followers or engagement | Never. |
| Review gating | Do not ask only happy users for store reviews, and do not pay for positive reviews. |
| Gamification backlash | Avoid streak-shaming, loss-aversion notifications and confetti-on-trade mechanics that encourage overtrading; reward process (stops, sizing), not volume. |
| Minors | 18+ only. Do not target under-18 audiences, do not feature school-age influencers, do not run campus-high-school tie-ins. Age-gate sign-up; set Meta age_min 18. Check COPPA and TikTok and Meta minor-protection implications with counsel. |
| Prizes | Cash or valuable prizes create sweepstakes/contest law issues; keep rewards cosmetic until counsel approves. |
| Competitor claims | No unsourced comparisons or trademark misuse. |

### 6.2 Required disclaimers

- **Ads (primary text or end card):** "Vantage is an educational simulator. Virtual money only. Not investment advice."
- **Landing page footer:** "Vantage is not a broker-dealer or investment adviser and does not provide investment advice. Simulated results do not reflect real trading and have no guaranteed relation to future results."
- **Creator content:** clear on-screen and spoken disclosure ("Paid partnership with Vantage" plus the platform's branded-content toggle), placed where viewers can't miss it, in the video itself, not just a hashtag buried in the caption.
- **Screenshots:** a "Simulated" label.
- Final wording to be approved by counsel (legal review under way).

---

## 7. Eight-week launch plan

KPIs (define in the analytics tool): **Activation** = first trade with a stop-loss within 48 hours of signup; **D7 retention** = returned on or after day 7; **Lessons completed** per activated user; plus cost per signup and cost per activated user.

| Week | Organic | Paid | Product / ops | Targets |
|---|---|---|---|---|
| 1 | Set up accounts, handles, link-in-bio; batch-record 10 clips; start waitlist page | None | Ship Pixel/CAPI events; privacy policy update; waitlist capture | Events firing; 100 waitlist |
| 2 | Post 4-5 shorts; first 3 Reddit comment contributions; open lesson pages | None | Public lesson pages live; position-size calculator | Indexed pages; 200 waitlist |
| 3 | Product Hunt prep; reach out to 10 college clubs and 10 micro-creators | None | Share cards; referral link | 300 waitlist; 5 clubs responding |
| 4 | Soft launch to waitlist; founder video; first YouTube long-form | Test campaign starts (see budget) | Fix top onboarding drop-offs | 40% waitlist activates; D7 baseline |
| 5 | Show HN / Indie Hackers / Reddit feedback posts; first weekly challenge | Continue tests, kill losers | Reward-to-risk calculator | Cost per signup under $10 |
| 6 | Product Hunt launch; creator posts go live (disclosed) | Winners to scaling campaign | Newsletter issue 1 | 1,000 signups cumulative |
| 7 | Club workshops; challenge #2 | Retargeting live; optimise on `FirstTrade` | Iterate Nova explanations from feedback | Activation 35%+ (target, not benchmark) |
| 8 | Review month; double down on top 2 channels | Decide budget for next quarter | Plan mobile app and ASO | D7 retention 20%+ (target); cost per activated user decided |

Budget (8 weeks, three scenarios; creators and tools are the same across scenarios except where noted):

| Item | Lean | Mid | Larger |
|---|---|---|---|
| Meta ads (weeks 4-8, about 5 weeks) | $1,200 | $3,500 | $10,000 |
| Creators and club sponsorships | $300 | $1,000 | $3,000 |
| Video tools, editing | $50 | $150 | $500 |
| Analytics, email tool | $0-50 | $100 | $300 |
| Legal review of ad/creator copy (estimate) | counsel's time | counsel's time | counsel's time |
| **Approx. total** | **about $1,600** | **about $4,800** | **about $13,800** |

---

## 8. Product changes that help marketing

| # | Feature | Why | Expected effect |
|---|---|---|---|
| 1 | Pixel/CAPI-ready events (`FirstTrade`, `FirstTradeWithStopLoss`, `LessonComplete`) | Lets Meta optimise on quality, not clicks | Lower cost per activated user; prerequisite for paid |
| 2 | Public lesson pages (SSR, indexable) | Durable search and AI-citation traffic | Compounding organic signups |
| 3 | Free calculators (position size, reward-to-risk), embeddable | Link magnets, high-intent keywords | Backlinks, top-of-funnel traffic |
| 4 | Share cards (trade score, discipline rank, challenge result) with OG images and referral link | Makes every user a distribution channel | Organic reach, k-factor above 0 |
| 5 | Referral loop with cosmetic rewards | Cheap acquisition from existing users | Lower blended CAC |
| 6 | Waitlist and email capture with double opt-in | Own the audience; feed Meta custom audiences (hashed, with consent) | Launch spike, retargeting |
| 7 | Onboarding that drives first trade with a stop-loss within the first session | Activation is the KPI | Higher activation, better optimisation signal |
| 8 | Weekly challenge pages and public leaderboard (opt-in, anonymised) | Shareable content and retention | D7 retention, repeat content |
| 9 | Disclaimers baked into every share card, screen and export | Compliance by default | Fewer rejections and legal exposure |
| 10 | Age gate (18+) at sign-up | Matches ad targeting and policy | Lower policy risk |
| 11 | Consent/cookie banner and privacy-policy disclosure of Pixel/CAPI | Required for lawful tracking | Fewer ad-account and legal problems |
| 12 | Demo-account labelling on seeded leaderboard entries | Avoids fake-social-proof claims | Trust, FTC risk reduction |

---

## 9. Open items and unverified points

- Whether Meta classifies Vantage under the Financial Products and Services special ad category (ask Meta support via a test ad; get counsel's view).
- Whether Lookalike audiences are available under that category.
- Finance-specific CPM benchmark and exact US-first CPI split by platform.
- Exact self-promotion rules in r/investing, r/stocks, r/personalfinance.
- Current status of Webull/thinkorswim paper trading, Robinhood Learn, Public, Zogo, Atom Finance.
- TikTok June 2026 financial-services policy change.
- Meta's explicit "get rich" examples under its deceptive-practices policy.
- Fetching Meta's policy site was blocked by this session's network settings (transparency.meta.com); allow it to confirm direct quotes.

## Sources

- Meta: [Financial and Insurance Products and Services](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/financial-services/), [Prohibited Financial Products and Services](https://transparency.meta.com/policies/ad-standards/deceptive-content/prohibited-financial-products-and-services/), [Personal attributes](https://transparency.meta.com/policies/ad-standards/objectionable-content/personal-attributes), [Special Ad Category docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category), [Advantage+ audience](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-expansion/advantage-audience/), [Advantage+ campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns.md), [Conversions API app events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/app-events), [CAPI best practices](https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices)
- FTC: [Final rule banning fake reviews](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)
- Benchmarks: [WordStream 2025](https://wordstream.com/blog/facebook-ads-benchmarks-2025), [WordStream 2026](https://www.wordstream.com/blog/facebook-ads-benchmarks-2026), [Superads finance CPL](https://www.superads.ai/facebook-ads-costs/cost-per-lead/finance), [Superads finance CPI US](https://www.superads.ai/facebook-ads-costs/cost-per-app-install/finance/united-states), [Digital Applied](https://digitalapplied.com/blog/facebook-ads-benchmarks-2026-cpc-cpm-ctr-industry)
- Other: [TikTok financial services policy](https://ads.tiktok.com/help/article/tiktok-ads-policy-financial-services), [WTOP paper trading roundup](https://wtop.com/news/2026/08/5-of-the-best-sites-for-paper-trading-stocks/), [Jon Loomer on personal attributes](https://www.jonloomer.com/qvt/personal-attributes-and-ad-rejections/), [Redship Reddit rules](https://redship.io/blog/reddit-self-promotion-rules-2026), [Stape CAPI vs Pixel](https://stape.io/tr/blog/facebook-conversion-api-vs-facebook-pixel), [AppTweak finance benchmark](https://www.apptweak.com/en/aso-blog/finance-app-benchmark-report-2025?format=md)
