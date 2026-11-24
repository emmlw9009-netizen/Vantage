# Vantage Backend Research Report

Prepared 24 November 2026. Audience: a solo, non-technical founder. Goal: a secure, managed backend at $0/month for as long as possible, with minimal legal exposure.

**Method and caveats.** Figures come from web searches run on the date above. The search tool returned vendor pages and third-party summaries, and direct page fetches were blocked in this session. Anything I could not confirm on a primary source is marked "(unverified)". Prices and free tiers change often, so re-check each vendor page the day you sign up. This is a technical and commercial research report, not legal advice. Have a lawyer review your Terms and Privacy Policy before public launch.

---

## 1. Executive summary

**Recommendation (primary):** **Supabase** (hosted Postgres, Auth, Row Level Security, Storage, Edge Functions) as the backend, with the Next.js app on **Vercel Hobby** while the app is free, ad-free and non-commercial. Email goes through **Resend** (free tier). The AI coach runs as a server-side route that calls the Anthropic API.

**Fallback:** **Neon** (serverless Postgres) with **Neon Auth** (managed Better Auth), hosting the Next.js app on Netlify free or paid Vercel. Both options are Postgres, so a move between them is a data export and re-import, not a rewrite.

**Why Supabase.** It is the only candidate that covers auth, relational data, row-level access rules, file storage and server functions in one managed product. It has a published DPA and a SOC 2 Type 2 attestation. The relational model fits your data (leaderboards, reports, joins). It is plain Postgres, so leaving is realistic.

**The $0 plan, and where it stops**

| Item | $0 now | When money starts |
|---|---|---|
| Supabase Free | 500 MB DB, 1 GB files, 5 GB egress, 2 active projects; auth MAU reported as 50,000 | **Pro from $25/month** (daily backups, no pausing). I would pay this at public launch, not at 10,000 users. |
| Vercel Hobby | Free, non-commercial only | **Pro** the day you add subscriptions, ads or any revenue (price unverified; check vercel.com/pricing) |
| Resend | 3,000 emails/month, 100/day | Paid tier (price unverified) once signups exceed about 100/day |
| Anthropic API | Not free: usage is billed per token | You will pay for Nova from the first user. Set a hard monthly spend cap. |

The Anthropic API is the one cost that cannot be $0. Budget for it separately and cap it.

**The 5 most important security/legal must-dos**

1. **Turn on Row Level Security (RLS) on every table before any data goes in**, and write a policy for each. Never put the `service_role` key in browser code or in a `NEXT_PUBLIC_` variable.
2. **Sign and file the DPAs** (Supabase, Anthropic, Resend, hosting) and list every sub-processor in your Privacy Policy.
3. **Store consent and the 18+ confirmation server-side** (terms version, timestamp, confirmation of age), and build working account-deletion and data-export flows before launch.
4. **Plan for the free tier's missing backups and 1-week pause.** Run your own scheduled export, and move to Pro ($25) at public launch.
5. **Protect the AI coach**: server-only API key, per-user rate limits, a spend cap, no personal data in prompts, and a "this is education, not financial advice" disclaimer.

**Founder to-do list (accounts only you can create)**

| # | Action | Cost |
|---|---|---|
| 1 | Create a GitHub account and put the code in a private repo | $0 |
| 2 | Create a Supabase account and a project in an EU or US region (see section 5) | $0 |
| 3 | Create a Vercel account (Hobby), connect GitHub | $0 |
| 4 | Create an Anthropic Console account, create an API key, **set a monthly spend limit** | usage-based |
| 5 | Create a Resend account and verify your sending domain (needs a domain name you own, about $10-15/year, unverified) | $0 plus domain |
| 6 | Create a Google Cloud project for "Sign in with Google" (OAuth client ID) | $0 |
| 7 | Accept the DPAs listed in section 5 | $0 |
| 8 | Book a lawyer review of Terms, Privacy Policy and disclaimers | paid (section 4) |
| 9 | Later, for iOS: Apple Developer Program for Sign in with Apple (annual fee, unverified) | paid |

Claude can write all the code, SQL and configuration; you paste the keys into Vercel and Supabase settings yourself. Never paste keys into chat.

---

## 2. Requirements matrix

| Need | Backend capability | Supabase | Notes |
|---|---|---|---|
| Sign-in: email magic link/password, Google, Apple | Auth service with OAuth providers | Built in | Apple sign-in needs a paid Apple Developer account; defer until the mobile app (see section 8) |
| Profiles | Table linked to the auth user | Postgres + RLS | |
| Portfolios, orders, trades, progress | Relational storage with per-user access | Postgres + RLS | Server-side validation of trades avoids cheating |
| Community posts, comments, likes | Relational tables, public-read | Postgres + RLS | |
| Moderation: reports, hiding, blocking, admin review | Role-based access, admin-only tables | RLS + a role flag + server functions | Admin actions run server-side only |
| Leaderboard | Aggregate query over many users' data | Postgres view or function (`security definer`) | Expose only display name and score |
| Consent records | Append-only table | Postgres + RLS (insert and read own, no update/delete) | Evidence in a dispute |
| Account deletion and data export | Cascading deletes, export function | `on delete cascade` + server function | Privacy rights; see section 5 |
| AI coach proxy + rate limiting | Server code holding the secret key | Next.js route handler (or Edge Function) + counter table | Key never reaches the browser |
| Transactional email | SMTP/API provider | Custom SMTP (Resend) | Supabase's built-in email sender is not for production |
| Avatars later | Object storage with access rules | Supabase Storage | 1 GB on Free |
| Frontend hosting | Next.js 15 hosting | Vercel | See section 4 |
| Mobile later | SDKs or REST | JS, Flutter, Swift, Kotlin clients (per Supabase docs, unverified for each) | Postgres means any stack can reach it |

---

## 3. Provider comparison

### 3.1 Comparison table

Legend: "unv." = unverified. All figures are free-tier unless stated.

| Provider | DB / storage | Auth MAU | Other limits | Pausing / inactivity | Commercial use on free | Security / compliance | Backups on free | DPA on free | Regions |
|---|---|---|---|---|---|---|---|---|---|
| **Supabase** | 500 MB DB per project, 1 GB files | 50,000 reported (one older source says 10,000; confirm) | 5 GB egress, 2 active projects | **Paused after about 1 week of low activity** | Free plan terms do not appear to forbid it (unv., read the ToS) | SOC 2 Type 2; report only for Team plan and above; RLS; TOTP MFA included | **No automatic backups** (Pro: daily, 7 days) | Yes, self-serve DPA | EU and other regions; primary DB data stays in region |
| **Firebase** (Spark) | Firestore: 50K reads/day free; storage quotas (unv.) | Reported 50,000 MAU (Tier 1 providers) on Spark, 3,000 daily active user cap if upgraded to Identity Platform | **Cloud Functions need the Blaze (pay-as-you-go) plan**, though it has a no-cost quota (2M invocations/month) | None found | Yes (unv.) | Google Cloud certifications (unv. from this search) | Managed export is a paid-plan feature (unv.) | Google terms (unv. for free) | Multi-region choices (unv.) |
| **Convex** | 0.5 GB DB, 1M function calls, 1 GB DB bandwidth | Bring your own auth (Clerk, Auth0 etc.) | Free/Starter up to 6 developers, 20 projects | None found | Yes, Starter is pay-as-you-go beyond free (confirm) | SOC 2 Type 2 stated on its security page; HIPAA/GDPR status unclear | Not found | Not found (unv.) | US-centric (unv.) |
| **Appwrite Cloud** | 2 projects; 500K DB reads and 250K writes/month; bandwidth 5 GB (may be outdated) | Not confirmed | Free plan limited to one organization | "Projects will never be paused" per changelog | Not confirmed (unv.) | SOC 2 claimed as Type I in some pages, Type II in others (conflicting); HIPAA claimed; no ISO 27001 found | Not found | Yes, DPA downloadable in org settings | Not confirmed |
| **Neon + auth** | Reported 1 GB per project, up to 100 projects, 100 CU-hours/project | **Neon Auth (managed Better Auth): up to 60,000 MAU** | Compute scales to zero; hitting a monthly limit suspends compute until next month (older doc, may be outdated) | Scale-to-zero (cold starts), not data deletion | Not confirmed (unv.) | Not confirmed in search (unv.) | Not confirmed (unv.) | Not confirmed (unv.) | Multiple (unv.) |
| **Clerk** (auth only) | none | **50,000 monthly retained users free** (changed Feb 2026) | Pro: $25 + $0.02 per retained user above the free allowance | n/a | Yes (unv.) | SOC 2 not confirmed in my search (unv.) | n/a | unv. | unv. |
| **Cloudflare Workers + D1 + KV** | D1: 5 GB total, 500 MB per DB, 10 DBs; 5M rows read/day, 100K rows written/day. KV: 1 GB, 100K reads/day, 1K writes/day | **None built in**; you must add auth yourself | Workers: 100,000 requests/day, **10 ms CPU per request**, 50 subrequests | Over the daily limit, queries fail until reset (enforced from 1 Sep 2026) | Not confirmed (unv.) | Cloudflare is widely certified (unv. from this search) | D1 point-in-time recovery (unv.) | unv. | Global |
| **PocketBase** (self-hosted) | One SQLite file on a server you run | Built-in auth | You run the server, patching, backups | n/a | Yes, open source (MIT, unv.) | **You are responsible for all security**; no vendor certifications | Built-in backups to local disk or S3 | n/a (you are the host) | Wherever you host |
| **Nhost** | Starter: 1 GB DB, 1 GB storage, 5 GB egress | Built in (Hasura + Postgres) | 1 active project on free | **Paused after 1 week of inactivity** | Not confirmed (unv.) | Not confirmed (unv.) | Not confirmed (unv.) | unv. | unv. |
| **Turso** | 100 databases, 5 GB, 500M rows read, 10M rows written per month | **No auth product** | SQLite (libSQL) | None found | Not confirmed (unv.) | Not confirmed (unv.) | 1 day point-in-time restore (reported) | unv. | unv. |

Sources: [Supabase pricing](https://supabase.com/pricing), [Supabase pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq), [Supabase DPA page](https://supabase.com/legal/customer-resources/data-processing-addendum), [Supabase security](https://www.supabase.com/security), [Supabase pricing blog (MFA)](https://supabase.com/blog/pricing), [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Firebase Auth pricing explainer](https://supertokens.com/blog/firebase-pricing), [Convex pricing FAQ](https://www.convex.dev/pricing/faq), [Convex limits](https://docs.convex.dev/production/state/limits), [Convex security](https://www.convex.dev/security), [Appwrite free plan docs](https://appwrite.io/docs/advanced/billing/free), [Appwrite SOC 2 Type 1 post](https://appwrite.io/blog/post/appwrite-is-now-soc-2-type-1-compliant), [Neon free plan limits](https://neon.com/faqs/free-plan-limits-and-quotas), [Neon Auth docs](https://neon.com/docs/auth/about), [Clerk changelog Feb 2026](https://clerk.com/changelog/2026-02-05-new-plans-more-value), [Clerk pricing](https://clerk.com/pricing), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 enforcement notice](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits), [KV limits](https://developers.cloudflare.com/kv/platform/limits), [PocketBase going to production](https://pocketbase.io/docs/going-to-production/), [Nhost pricing](https://nhost.io/pricing), [Turso pricing](https://turso.tech/pricing).

### 3.2 Short notes

**Supabase.** Strongest all-in-one fit. Three honest drawbacks on the free plan: no automatic backups, projects pause after about a week of low activity (the database wakes when you restore it, but users see an outage), and the SOC 2 report itself is only downloadable on Team and above. The DPA is self-serve for all organizations. Supabase announced it is acquiring Turso on 2 October 2026 ([Supabase blog](https://supabase.com/blog/supabase-is-acquiring-turso)); that does not change your plan, but it shows the company is well funded (a $150M round was reported in the same coverage).

**Firebase.** Mature and Google-backed, but a poor fit here. Its Firestore is a document database, so leaderboards, reports and moderation joins get awkward and costly (reads are billed). Server code (your AI proxy) requires the Blaze billing plan, which means attaching a card and accepting uncapped billing risk unless you set budget alerts. Lock-in is high because data model and security rules are proprietary.

**Convex.** Excellent developer experience (TypeScript functions, realtime). It is not SQL, needs a separate auth provider, and its compliance and DPA position was not clear in my search. A reasonable fallback for a technical founder; less so for you.

**Appwrite Cloud.** Credible and says projects are never paused. Compliance claims conflict between pages (SOC 2 Type I versus Type II); ask them for the report before relying on it. Smaller ecosystem than Supabase.

**Neon + auth.** Neon is excellent Postgres; auth is the missing piece. Neon's managed Better Auth gives up to 60,000 MAU free. Clerk (50,000 retained users free) is the polished alternative but is a second vendor to disclose and a second bill. Auth.js is now maintained by the Better Auth team ([announcement](https://better-auth.com/blog/authjs-joins-better-auth)), and one 2026 article describes it as in maintenance mode, so prefer Better Auth for new work. Several secondary sources say Vercel acquired Better Auth in 2026; confirm in Vercel's own blog (unverified). Free Neon has no obvious uptime guarantee or SOC 2 report access (unverified).

**Cloudflare Workers + D1 + KV.** Cheap and fast, but it is a toolbox, not a backend: no auth, no row-level security (you hand-write all access checks), and the free Workers tier gives only 10 ms of CPU per request. One report shows a trivial Next.js route on the OpenNext adapter exceeding that ([forum post](https://answeroverflow.com/m/1361751268795617320)); treat that as anecdotal. Not recommended for a non-technical founder who wants to avoid hand-rolled security.

**PocketBase.** Free software, but it is a server you run, patch and back up. That contradicts "I'd rather not run servers or hand-roll security". Free hosting (for example Fly.io) was described in community posts but I could not confirm Fly's current free allowance (unverified). Skip.

**Nhost.** Hasura GraphQL on Postgres. Free plan pauses after a week and allows one active project; direct downgrade from paid to free is not available ([billing docs](https://docs.nhost.io/platform/cloud/billing)). Smaller company than Supabase.

**Turso.** Generous SQLite hosting but no auth, no RLS. A database, not a backend.

**Newcomers.** InstantDB (realtime, relational-ish): sources disagreed on whether it has a free plan (unverified), so I did not rank it. The most relevant development is Neon's managed Better Auth.

---

## 4. Frontend hosting

| Host | Free-tier terms for this app | Fit for Next.js 15 | Notes |
|---|---|---|---|
| **Vercel Hobby** | **Non-commercial, personal use only.** All commercial usage requires Pro or Enterprise ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Terms of Service say the same ([ToS](https://vercel.com/terms)). | Best (Vercel makes Next.js) | See analysis below |
| **Cloudflare Workers/Pages** | Commercial terms for free plan not confirmed (unverified). Free Workers: 100,000 requests/day, 10 ms CPU ([limits](https://developers.cloudflare.com/workers/platform/limits)). Static assets are free and unlimited. | Via OpenNext adapter; Node middleware (Next.js 15.2+) not yet supported ([OpenNext](https://opennext.js.org/cloudflare)) | Risky for server-rendered routes |
| **Netlify free** | Credit-based: 300 credits/month; sites pause when credits run out ([Netlify credit docs](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)). Commercial use: only a secondary source says it is allowed (unverified; read Netlify's terms). Forum reports of deploys blocked in mid-2026 despite credits remaining (unresolved). | Supported | Plausible alternative to Vercel |
| **Render free** | Web services **spin down after 15 minutes idle, about a minute to wake**; free Postgres **expires after 30 days and has no backups** ([Render free docs](https://render.com/docs/free)). | Works, but cold starts | Not suitable for a user-facing app |

**Does Vercel Hobby forbid commercial use?** Yes. Vercel restricts Hobby to non-commercial personal use. A community post quotes the guideline definition of commercial usage as any deployment used "for the purpose of financial gain of anyone involved in any part of the production of the project" (quoted second-hand; verify on the live page). Vercel staff rulings on borderline cases were sparse in what I found, and one community answer says that once you charge or intend to charge users, move to Pro (community view, not policy). My reading, which is not Vercel's: a free educational app with no ads, no subscriptions, no donations and no affiliate links is the easiest case to defend; anything with revenue is not.

**Implications of adding subscriptions or ads later.** Upgrade Vercel to Pro the same day revenue is switched on. Also expect: Stripe or app-store billing adds a payment processor to your sub-processor list; ads add ad-network cookies and consent banners; and a subscription changes the legal character of the "educational" disclaimer. The upgrade is a billing change, not a rewrite. Because you are legally cautious, ask Vercel support in writing whether a free, no-revenue public beta qualifies for Hobby and keep their reply.

---

## 5. "Hire a backend person" option

| Route | Typical cost | Notes |
|---|---|---|
| Freelance backend developer | Roughly $73-$135/hour mid-level US per several 2026 rate guides; the senior range reaches about $171/hour ([Secondtalent](https://www.secondtalent.com/cost-to-hire/backend-developer/), [ContractRates](https://www.contractrates.fyi/Backend-Engineer/hourly-rates?skillFilter=AWS), [Arc](https://arc.dev/employer-blog/freelance-developers-cost/)). These are marketing and crowdsourced figures, so treat them as rough. | A build of the data model, auth, moderation and AI proxy is plausibly weeks of work, which is thousands of dollars (my estimate, unverified). |
| Agency | Higher hourly or fixed bids (unverified, no source found) | Often adds project management overhead |
| Managed BaaS + Claude builds code + paid review | $0 now; a short review later is a few hours to a few days of senior time (my estimate; no source found for audit pricing) | Recommended |

**Risks of custom backend code.** You would own authentication, session handling, password storage, access checks and patching. Every endpoint is a place to forget an authorization check. With a single freelancer there is a bus-factor risk: if they leave, nobody else understands the system. Hiring costs real money, and the cost does not stop at delivery because someone must maintain it.

**Why managed BaaS plus a short paid review is better for you.** Authentication, encryption at rest, patching and backups (on paid plans) are done by a vendor with certifications. The code you own is mostly database rules and a few server routes, which are small enough for an independent reviewer to audit in a day or two. Budget for that review before you take real users or add payments. Be honest with yourself that this is not free; it is deferred and small.

---

## 6. Legal and security checklist (for Supabase + Vercel)

### 6.1 Day-one configuration

| Area | Do this |
|---|---|
| Row Level Security | Enable RLS on **every** table in the `public` schema. A table without RLS is readable by anyone with the public anon key. Write explicit policies (section 8.2). Test with two different test accounts. |
| Keys | The `anon`/publishable key may be in the browser. The `service_role` key bypasses RLS: keep it only in server environment variables (Vercel project settings), never in a variable starting with `NEXT_PUBLIC_`, never in git, never in the mobile app. |
| Least privilege | Admin features check a role stored in a table the user cannot edit. Use `security definer` functions sparingly and set a fixed `search_path`. |
| Auth settings | Require email confirmation; set a minimum password length; enable leaked-password protection if offered (unverified on free); set redirect-URL allowlist to your real domains only; enable TOTP MFA for your own admin account ([MFA is included free](https://supabase.com/blog/pricing)). |
| Auth emails | Configure custom SMTP (Resend). The built-in sender only delivers to your organization's team members and is not for production ([Supabase email limits](https://www.github.com/supabase/supabase/discussions/15896)). Customize templates to show your name, include a "ignore this if you did not request it" line, and use your own sending domain with SPF, DKIM and DMARC. Resend free is 100/day and 3,000/month ([Resend](https://www.resend.com/docs/knowledge-base/account-quotas-and-limits.md)). |
| Rate limits | Set Supabase auth rate limits in the dashboard; add your own limits on the AI route (section 8.3). |
| Backups | Free plan has **no automatic backups** ([Supabase pricing](https://supabase.com/pricing)). Until Pro ($25, daily backups, 7-day retention), run a scheduled `pg_dump` (Claude can write a GitHub Actions job) and store it encrypted in a private location. Test a restore once. |
| Logging | Turn on Supabase auth and API logs (retention on free is short, unverified). Log admin and moderation actions in your own `audit_log` table. Never log message contents or tokens. |
| Secrets | Store keys only in Vercel and Supabase settings. Rotate any key that was ever pasted into chat, email or a commit. |
| Spend caps | Anthropic Console: monthly limit. Vercel: spend management if available (unverified). Google Cloud: no billing account needed for basic OAuth. |
| Dependencies | Enable GitHub Dependabot alerts (free for private repos, unverified). |

### 6.2 Privacy policy: sub-processors to name

| Role | Vendor | Data they touch |
|---|---|---|
| Database, auth, file storage | Supabase (and its cloud hosting provider, listed on its sub-processor page) | All account and activity data |
| Frontend hosting | Vercel | IP addresses, request logs |
| Email | Resend | Email addresses, message content of auth emails |
| AI coach | Anthropic | The text a user types to Nova, plus the context you send |
| Sign-in | Google (and Apple later) | Identity and email at sign-in |
| Later | Stripe or app stores (payments), analytics tool, ad network | As applicable |

Also state: what you collect, why, the legal basis, retention periods, user rights (access, deletion, portability), how to contact you, international transfers, and that the app is 18+.

### 6.3 DPAs and terms to accept

| Vendor | Status |
|---|---|
| Supabase | Self-serve DPA available to all organizations ([DPA](https://supabase.com/legal/customer-resources/data-processing-addendum)); accept it and save the PDF. One third-party summary said not individually signed, so keep a dated copy (conflicting; verify). |
| Anthropic | Commercial Terms incorporate the Anthropic DPA by reference ([Commercial Terms](https://www.anthropic.com/legal/commercial-terms)). They state Anthropic may not train models on customer content from the Services. Standard API retention is 30 days, with zero data retention available for appropriately configured keys ([Claude data policies](https://docs.claude.com/en/docs/claude-code/data-usage)); that page is about Claude Code, so confirm the API-specific retention on the current API docs. |
| Vercel, Resend | DPA availability on free plans not confirmed (unverified). Request or download theirs; if none exists on the free plan, that is a reason to move that service to a paid plan. |

### 6.4 Breach-notification duties

If you have EU or UK users, GDPR Article 33 requires the **controller (you)** to notify the supervisory authority without undue delay and where feasible within **72 hours** of becoming aware, unless the breach is unlikely to risk people's rights; late notices need reasons, and you can provide details in stages ([UK ICO guide](https://ico.org.uk/for-organisations/guide-to-dp/guide-to-the-uk-gdpr/personal-data-breaches), [Article 33 text](https://www.legislation.gov.uk/eur/2016/679/article/33)). Processors must tell you without undue delay. US state breach laws apply by where users live; requirements vary (unverified; ask a lawyer). Write a one-page incident plan now: who you call, how you revoke keys, how you notify users. Save the contact details for the relevant authority.

### 6.5 Age gate, consent storage, deletion

- **18+ gate.** Ask users to confirm they are 18 or older at signup and record the confirmation. Do not collect more age data than needed (a date of birth is not required to meet an 18+ rule). Make the Terms say 18+. Self-declaration is a risk-reduction, not proof; consider how you will remove accounts you learn belong to minors.
- **Consent record.** Store terms version, privacy-policy version, timestamp, and the age confirmation in an append-only `consents` table. Re-prompt when you change versions.
- **Deletion.** One button deletes the auth user and cascades to every table. For community posts decide in your policy whether they are deleted or anonymized; do it consistently. Keep a minimal deletion log (a user ID hash and date) to show you honored the request.
- **Export.** A function returns the user's data as JSON.

### 6.6 Product-level exposure

You are teaching investing with virtual money. Say plainly in the Terms, onboarding and every Nova screen that the content is educational, not personalized financial advice, and that simulated results do not predict real ones. Whether your content triggers any investment-advice rules depends on jurisdiction and is a question for a lawyer (unverified). Add content rules and a report/takedown process for the community, and respond to reports quickly.

### 6.7 Risks of free tiers

| Risk | Effect | Mitigation |
|---|---|---|
| Pausing (Supabase, Nhost: about 1 week of inactivity) | App goes down; users see errors | Keep traffic or a scheduled health check going; move to Pro at launch |
| No SLA | No uptime guarantee or compensation (unverified for all vendors on free) | Pro/Team for a real launch; status page |
| No automatic backups (Supabase free) | One bad migration or delete loses data | Scheduled dumps; Pro |
| Quotas (500 MB DB, 5 GB egress) | Writes or reads fail when exceeded | Alerts; watch usage; archive chat history |
| SOC 2 report not downloadable on Free | Cannot show a customer or partner the report | Not needed for consumers; matters if you sell to schools or companies |
| Terms changes | Vendors reprice free tiers (Clerk, Neon and Cloudflare all changed limits in 2026) | Keep data portable; prefer Postgres |

---

## 7. Recommendation

| | Primary | Fallback |
|---|---|---|
| Backend | Supabase Free | Neon Free + Neon Auth |
| Frontend | Vercel Hobby (non-commercial period) | Netlify free (confirm terms) or Vercel Pro |
| Email | Resend free | Resend free |
| AI | Anthropic API (paid, capped) | Same |
| Monthly cost today | $0 plus Anthropic usage | $0 plus Anthropic usage |

**Why the primary.** One vendor covers auth, Postgres, RLS and storage; DPA is self-serve; SOC 2 Type 2 is claimed; TOTP MFA is free; EU regions exist; migration is a standard Postgres dump. It is the closest to "secure managed backend I do not have to hand-roll".

**Why the fallback.** Neon is Postgres, so the schema and RLS policies carry over largely unchanged. Its managed auth allows 60,000 MAU free. The cost is that you assemble more parts and the compliance posture for Neon is not confirmed in my research (unverified).

**When money starts**

| Trigger | Cost |
|---|---|
| Public launch with real users (backups, no pausing) | Supabase Pro **$25/month** |
| Any ad, subscription or donation | Vercel Pro (price unverified; I recall about $20/seat, so check) |
| About 50,000 auth users (unlikely in year one) | Supabase Pro includes 100,000 MAU, then $0.00325 per MAU |
| Over 100 auth emails/day | Resend paid (unverified) |
| DB beyond 500 MB or egress beyond 5 GB | Pro |
| Any day with a user | Anthropic usage |

Realistic first-year bill if you reach 10,000 users: $25/month for Supabase plus Anthropic usage, plus Vercel Pro if you monetize.

---

## 8. Architecture and migration plan

### 8.1 Data model (Postgres)

All tables have `id uuid primary key`, `created_at timestamptz`. `auth.uid()` is the signed-in user's id.

| Table | Key fields | Access rule (RLS) |
|---|---|---|
| `profiles` | `user_id` (fk auth.users, cascade), `display_name`, `avatar_url`, `role` ('user'/'moderator'/'admin'), `onboarded_at`, `is_banned` | Read: public fields for signed-in users; update own row but **not** `role` or `is_banned` (enforce with a trigger or separate admin table) |
| `consents` | `user_id`, `terms_version`, `privacy_version`, `age_confirmed_18` bool, `accepted_at`, `user_agent` | Insert own; select own; **no update/delete** |
| `portfolios` | `user_id`, `cash_balance`, `starting_balance`, `season` | Select own; writes only via server function |
| `positions` | `portfolio_id`, `symbol`, `quantity`, `avg_cost` | Select own; writes via server function |
| `orders` | `portfolio_id`, `symbol`, `side`, `type`, `quantity`, `limit_price`, `status` | Select own; insert via server function |
| `trades` | `order_id`, `portfolio_id`, `price`, `quantity`, `executed_at`, `score` | Select own; written by server only |
| `lessons_progress` | `user_id`, `lesson_id`, `quiz_score`, `completed_at`, `xp_awarded` | Select/insert/update own |
| `missions` | `user_id`, `mission_id`, `progress`, `completed_at` | Select/update own |
| `posts` | `user_id`, `body`, `status` ('visible'/'hidden'), `created_at` | Select visible posts (and own); insert own; update own body; moderators set `status` |
| `comments` | `post_id`, `user_id`, `body`, `status` | Same pattern as posts |
| `likes` | `post_id`, `user_id` (unique pair) | Insert/delete own; select counts via view |
| `reports` | `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `resolved_by` | Insert own; select own; moderators/admins see all |
| `blocks` | `blocker_id`, `blocked_id` | Own rows only; posts/comments queries exclude blocked users |
| `challenges` | `week_start`, `title`, `rules`, `ends_at` | Read for all signed-in users; write admin only |
| `leaderboard` (view) | `display_name`, `score`, `rank` | Public view exposing only display name and score, built with a `security definer` function; excludes banned users |
| `chat_messages` | `user_id`, `role`, `content`, `created_at` | Select/insert own via server only; delete on account deletion |
| `ai_usage` | `user_id`, `day`, `request_count`, `tokens_in`, `tokens_out` | Server-side only |
| `audit_log` | `actor_id`, `action`, `target`, `created_at` | Admin read; server insert |

**Important design rule.** Trades and scores are written by server-side functions, not directly by the browser, otherwise a user can edit their own score through the public API and corrupt the leaderboard. Use a `security definer` function (or a Next.js server action using the service key) that validates the order against the simulated price, then writes. Keep market simulation server-side or at least validate prices server-side.

### 8.2 RLS pattern

```sql
alter table public.posts enable row level security;
create policy "read visible posts" on public.posts for select
  using (status = 'visible' or user_id = auth.uid());
create policy "insert own posts" on public.posts for insert
  with check (user_id = auth.uid());
```

Claude can write and test these policies; you review the checklist in section 6.1.

### 8.3 AI coach proxy and rate limiting

1. Browser calls `POST /api/nova` on your Next.js server with the user's session.
2. The route verifies the session, checks `ai_usage` for today (for example 30 requests/day and a per-minute burst limit), and rejects with HTTP 429 if over.
3. It trims and sanitizes the message, sends only needed context (no email, no real name), and calls the Anthropic API with the key from a server environment variable.
4. It stores the exchange in `chat_messages`, increments `ai_usage`, and streams the answer back.
5. Safeguards: maximum input length, maximum output tokens, a global daily budget switch that disables Nova if spend exceeds a threshold, and the Anthropic Console monthly limit as a backstop. The limiter is a Postgres counter, so no extra vendor is needed (a separate Redis service such as Upstash is an option but adds a sub-processor; I did not verify its free tier).

### 8.4 Migrating localStorage data on first sign-in

1. Ship a one-time "Import my progress" step after first sign-in, never silently.
2. The client reads the existing localStorage keys, sends one JSON payload to a server function.
3. The server validates the shape, caps sizes, and recomputes derived values (XP, scores, balances) instead of trusting them; it rejects impossible values (negative cash, scores out of range).
4. It writes rows inside one transaction; the import is idempotent (a `migrated_at` flag on the profile).
5. Only after a success response does the client mark local data as migrated; keep a local backup until the next release. Chat history and community posts that were only local are imported as private history; posts are not auto-published.
6. Because anyone can fake localStorage, imported data is treated as unranked for the leaderboard (or imported only into a "practice" season).

### 8.5 Build order

| Step | Who | What |
|---|---|---|
| 1 | Founder | Create GitHub, Supabase, Vercel, Anthropic, Resend accounts (section 1) |
| 2 | Claude | Create Next.js project structure with Supabase client; environment variable template |
| 3 | Founder | Paste keys into Vercel and Supabase settings (never into chat) |
| 4 | Claude | SQL migrations: tables, RLS policies, leaderboard view, deletion cascade |
| 5 | Claude | Auth screens: magic link, password, Google; consent + 18+ gate |
| 6 | Founder | Configure Google OAuth client in Google Cloud and Resend SMTP in Supabase |
| 7 | Claude | Server functions for orders and trades; replace localStorage reads and writes |
| 8 | Claude | Nova proxy with rate limits and spend switch |
| 9 | Claude | Community, reports, blocking, admin review screens |
| 10 | Claude | Data export and account deletion |
| 11 | Claude | localStorage import flow |
| 12 | Claude | Scheduled backup job and a restore test |
| 13 | Founder | Lawyer review of Terms, Privacy Policy, disclaimers; accept DPAs |
| 14 | Founder (+ paid reviewer) | Short independent security review of RLS and the server routes; then public launch and upgrade to Supabase Pro |
| 15 | Later | Mobile app: Sign in with Apple (Apple Developer account), Supabase mobile SDK or REST |

**Steps needing the founder's own accounts or keys:** 1, 3, 6, 13, 14, 15.

---

## 9. Open items I could not verify

- Supabase free-plan auth MAU (50,000 versus an older 10,000 figure), Edge Function and Realtime limits, and whether the free plan's terms allow commercial use.
- SOC 2/ISO status and DPA availability for Neon, Clerk, Vercel, Resend, Cloudflare, Nhost, Turso and Firebase's free tier.
- Cloudflare free-plan commercial-use terms; Netlify commercial-use terms.
- Prices for Vercel Pro, Resend paid, Cloudflare Workers Paid, Apple Developer Program.
- Convex DPA and GDPR status; Appwrite SOC 2 level (Type I versus II).
- Security review pricing and agency rates.
- Whether Vercel acquired Better Auth (reported by secondary sources only).

Re-check these on each vendor's own page before you rely on them.
