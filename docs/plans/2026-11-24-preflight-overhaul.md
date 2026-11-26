# Vantage overhaul — design spec + implementation plan

Spec owner: main session (Opus). Implementers: Sonnet sub-agents, one task at a time, in order.
Repo: /home/user/stockpilot (branch `overhaul`). Read `CLAUDE.md` first; it is the architecture map.

## Why
v0.1 works (38/38 verify checks), but it looks like a generic AI-generated fintech app: near-black background with a single acid-lime accent, identical rounded cards with the same shadow, gradient glow washes, ALL-CAPS eyebrow labels, `A · B · C` meta strings, `→` appended to links. The overhaul gives it an identity drawn from its own subject and adds learning features. **No feature may need an API key** (the AI coach keeps its offline fallback; nothing new calls external services).

## Product name: Vantage
Owner-chosen name. Keep the name in ONE constant: `src/lib/brand.ts` exporting `BRAND = { name: "Vantage", tagline: "Practice the market before it counts." }` and use it everywhere instead of hard-coded strings.
The metaphor: a pilot never takes off without a pre-flight checklist, and a trader shouldn't buy without one. Use the metaphor in **exactly two places**: the order ticket's "Pre-flight check" and the landing hero. Everywhere else, plain words (no "cockpit", "hangar", "ground school" naming; nav stays Home, Markets, Learn, Coach, Community, Journal).

## Design system

### Audience and job
New investors (18–35) who are curious but nervous about losing money. The product's job is to make practice feel safe, structured and coached. The tone is a calm flight instructor: precise, encouraging, never hype.

### Color (CSS tokens in `src/app/globals.css`; light is the default, dark is "night flight")
| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#EDF1F3` chart paper (cool, not cream) | `#0B1726` night navy | page |
| `--panel` | `#FFFFFF` | `#102035` | level-1 surfaces |
| `--panel-2` | `#E3E9EC` | `#16283F` | level-2 insets, inputs |
| `--ink` | `#0F2A44` navy | `#E6EDF3` | primary text |
| `--ink-2` | `#45596C` | `#A9B8C7` | secondary text |
| `--muted` | `#6B7B8A` | `#7F92A5` | labels, axes (must keep ≥ 4.5:1 on `--panel` for text) |
| `--line` | `rgba(15,42,68,.12)` | `rgba(230,237,243,.10)` | hairlines |
| `--accent` | `#C4470B` international orange | `#FF7A3D` | primary actions, the live dot, focus ring |
| `--accent-ink` | `#FFFFFF` | `#0B1726` | text on accent |
| `--coach` | `#9B2C7E` chart magenta | `#E07BC6` | Nova's identity only (avatar, coach notes rule, coach badge) |
| `--series-1` | `#2a78d6` | `#3987e5` | price lines (dataviz reference palette, unchanged) |
| `--series-2` | `#eb6834` | `#d95926` | second series (moving average) |
| `--up` / `--down` | `#006300` / `#d03b3b` | `#0ca30c` / `#e66767` | gains/losses; always paired with arrow + sign |
| `--warn` | `#9A6200` | `#fab219` | caution state |
Keep the existing token *names* that components already use where possible (rename `--text`→`--ink` etc. only if you update every usage). Remove the lime accent, the `.glow` radial gradients and the `.grid-bg` everywhere. Black/near-black is never used as a fill.

### Type
- **Barlow** (DIN-inspired, the look of aviation and road signage) for all UI text and numbers. Weights 400/500/600/700. Numbers use `font-variant-numeric: tabular-nums` in tables and readouts.
- **Barlow Semi Condensed** 600/700 for display: page titles, big readouts (account value, price), hero headline. The type itself is the instrument-panel feel; no decorative gauges are needed for headings.
- **Source Serif 4** (variable) for long-form reading only: lesson body text and Nova's coaching notes (chat replies, review summaries). Nova "writes" in serif, the app "speaks" in Barlow.
- Install via npm `@fontsource/barlow`, `@fontsource/barlow-semi-condensed`, `@fontsource-variable/source-serif-4` (no Google Fonts network calls). Remove `geist`.
- Scale (px): 12, 14, 16, 18, 21, 24, 30, 36, 48, 60. Body 16/1.5 sans; serif body 17/1.65; max line length 72ch for prose.
- Sentence case everywhere. **No ALL-CAPS or tracked-out eyebrow labels**, no `·` middle-dot meta strings (use separate elements or commas), no `→` appended to link/button text, no single highlighted word in headlines.

### Surfaces and shape (hierarchy, not one card kit)
- Level 1 panel: `--panel`, 1px `--line` border, radius 14px, **no shadow**.
- Level 2 inset (inputs, stats, notes inside a panel): `--panel-2`, radius 8px, no border.
- Pills/chips: radius 999px. Buttons: radius 10px (not pills), height 40–48px.
- Only popovers, menus and toasts get a shadow.
- Prefer one panel with internal dividers over a grid of identical small cards.

### Motion
One orchestrated moment only: on the landing hero, the pre-flight checklist items tick in sequence once on load. In the app, motion only answers actions (price flash on change, checklist item ticking when the user satisfies it, toast in). Respect `prefers-reduced-motion` (disable the sequence and flashes).

### The signature element: the pre-flight checklist
The order ticket's check becomes a laminated-checklist block: five lines, each with a square checkbox that ticks live as the order satisfies it:
1. Reason written (thesis ≥ 40 chars)
2. Stop-loss set (buy only)
3. Risk under 2% of account (needs stop)
4. Target at least 2× the risk (needs stop + target)
5. Position under 25% of account
Above it, "Pre-flight check" and "3 of 5 complete". Unmet lines show a one-line fix ("Add a stop-loss below $177"). The derived score (from `analyzeTrade`) shows as a compact semicircle gauge with the label (Disciplined/Solid/Needs work/High risk). Buying is never blocked — the checklist advises, it does not gate.
This is where the boldness goes. Everything around it stays quiet.

### Layout
- Shell: left rail on desktop (logo, nav, at the bottom a "Simulated market" status line with the live orange dot and a theme toggle). Top bar: search, a compact ticker strip of the 5 watchlist symbols (price + arrow change, updates in place, no scrolling animation), account value readout. Phone: top bar (logo, search icon, account value) + bottom nav; no horizontal scroll at 390px.
- Home (dashboard): left-aligned. Row 1: one wide panel "Account" — big Barlow Semi Condensed value (48–60px), change vs start, chart; to its right "Nova's notes" — a paper note with a 3px `--coach` left rule and serif text (the coach brief). Row 2: one "Portfolio" panel with positions table and open orders separated by a divider. Row 3: latest review + news.
- Text alignment: left everywhere except numeric columns (right). No centered marketing blocks inside the app.

## Global constraints (bind every task)
- No API keys and no new network calls. Offline coach paths must keep working.
- `npm run build` passes and `npm run verify` passes (38+ checks) at the end of every task. If you change visible copy that `scripts/verify.cjs` selects on, update the selector in the same task. Never delete a check to make it pass; adapt it to the new UI.
- Light and dark both designed; phone (390px) and desktop (1440px) both checked.
- Tokens only in components (no raw hex outside `globals.css`, except chart SVG fallbacks via `var()`).
- Charts follow the `dataviz` skill: one y-axis, 2px lines, hover tooltip on every plot, legend when ≥ 2 series, deltas never color-only.
- Accessibility floor: visible `:focus-visible` ring (2px `--accent` + 2px offset), touch targets ≥ 40px, text contrast ≥ 4.5:1, `aria-label`s on icon-only buttons.
- Keep business logic in `src/store/*` and `src/lib/*` unchanged unless the task says otherwise.
- Commit at the end of the task with a descriptive message ending with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (newline) `Claude-Session: https://claude.ai/code/session_011gNDnU4TMQCRPb73D7GM94`

## Tasks

### Task 1: Brand + design foundation + shell
Files: `src/lib/brand.ts` (new), `src/app/globals.css`, `src/app/layout.tsx`, `package.json`, `src/components/ui.tsx`, `src/components/shell.tsx`, `src/components/onboarding.tsx`, `README.md`, `CLAUDE.md` (name only), `scripts/verify.cjs` (selectors only if needed).
1. Add `src/lib/brand.ts`; replace every user-visible "Stockpilot" with `BRAND.name` (grep the repo; also metadata title/description in `layout.tsx`, README title, CLAUDE.md title, package.json `name: "vantage"`).
2. Fonts: install the three @fontsource packages, import them in `layout.tsx`, remove `geist`, define `--font-sans` (Barlow), `--font-display` (Barlow Semi Condensed), `--font-serif` (Source Serif 4) in `@theme inline`, and expose Tailwind utilities `font-display`, `font-serif`.
3. Rewrite tokens per the Color table (light default + dark under both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`). Map Tailwind color names so existing class names keep working where sensible (`bg-panel`, `bg-panel-2`, `text-ink`, `text-ink-2`, `text-muted`, `border-line`, `bg-accent`, `text-accent-ink`, `text-up`, `text-down`, `text-warn`, `bg-series-1`) and add `coach` (`text-coach`, `bg-coach`, `border-coach`). Delete `.glow`, `.grid-bg`, the lime values, `--brand` (replace its usages with `--coach` for Nova or `--accent` for actions).
4. Base styles: body 16px Barlow; `.card` becomes the level-1 panel (radius 14, border, no shadow); add `.inset` (level-2); global `:focus-visible` ring; `prefers-reduced-motion` disables `.flash-up/.flash-down` and any animation.
5. `ui.tsx`: restyle `Pill`, `Segmented` (radius 10 container, not pill), `SectionTitle` (sentence case, 18px semibold, no eyebrow), `Toaster` (shadowed popover, accent dot), `Avatar` (Nova = `--coach` solid with a small "N" mark; members keep hue avatars), `ScoreRing` → replace with `ScoreGauge` (semicircle arc gauge 0–100 with numeric value and label underneath; keep exported name `ScoreRing` as an alias so callers don't break).
6. `shell.tsx`: new logo mark (a simple SVG: a check mark inside a rounded square drawn in `--accent`, wordmark in Barlow Semi Condensed); rail + top bar + ticker strip (watchlist symbols, from `useApp().watchlist` and `useMarket().prices/prevClose`) per Layout; bottom "Simulated market" status with live dot; level/XP readout without middle dots (e.g. "Level 2 Apprentice" on two lines or "Level 2, Apprentice"). Phone layout as specified. Add a "Journal" nav item pointing to `/journal` (the page arrives in Task 5; until then it may 404 — add `/journal` to the verify ROUTES only in Task 5).
7. Onboarding modal restyled to the new system (left-aligned, Barlow display heading, accent primary button, no glow).
Acceptance: build + verify pass; screenshots of `/dashboard` light + dark show the new palette/type; no lime anywhere (`grep -ri "b8f03a\|glow\|grid-bg" src` returns nothing).

### Task 2: The pre-flight checklist ticket + review card
Files: `src/components/order-ticket.tsx`, `src/components/review-card.tsx`, `src/lib/preflight.ts` (new), `scripts/verify.cjs`.
1. New pure module `src/lib/preflight.ts`: `preflightChecks({ side, qty, entry, stopLoss, takeProfit, thesis, equity, existingQty }) → { id, label, ok, fix?, applicable }[]` implementing the five lines in the spec (sell orders: only "Reason written" and "Position under 25%" → for sells mark stop/risk/target as not applicable). Include `fix` text with the concrete number (e.g. "Add a stop-loss below $177.20", "Cut to 84 shares to risk 2%").
2. Order ticket: restructure into sections separated by dividers (not nested cards): side switch, order type, shares/price, exit plan (stop + target + quick-set buttons + size-by-risk), reason textarea, then the **Pre-flight check** block (checkbox lines that tick live with a short scale/opacity transition, "N of M complete", gauge + label), then the summary (cost, % of account, risk, reward:risk), then the submit button. Keep all existing behaviour (touched/reset logic, validation messages, onFilled).
3. Review card: Nova's summary in serif with a 3px `--coach` left rule; "Did well / Improve" as sentence-case subheads; flags list keeps icon + text (never color-only); gauge instead of ring; actions "Ask Nova about this" and "Share to community" as secondary buttons. No uppercase labels.
4. Update `scripts/verify.cjs`: the check that used `getByText("Pre-trade check")` must now target the new heading "Pre-flight check"; add a check that the checklist shows "5 of 5 complete" for the disciplined NVDA order before submit, and that a TSLA order with no stop shows "Stop-loss set" unchecked (use `aria-checked` or a `data-ok` attribute on each line).
Acceptance: build + verify pass; screenshot of `/markets/NVDA` desktop + phone looks like a checklist, not a form of cards.

### Task 3: Home, Markets, Symbol pages + moving-average overlay
Files: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/markets/page.tsx`, `src/app/(app)/markets/[symbol]/page.tsx`, `src/components/price-chart.tsx`, `src/components/news-feed.tsx`, `scripts/verify.cjs`.
1. Home per Layout: "Account" panel (display readout, vs-start delta, chart, four stats as insets in one row), "Nova's notes" paper note (serif, `--coach` rule; this is the existing coach brief), single "Portfolio" panel (positions table + divider + open orders), latest review + journal snippet + news. Page title "Home" is not needed; greet with the name in display type ("Good evening, Alex").
2. Markets: a dense, scannable list (table on desktop: symbol, name, sector, sparkline, price, day change; stacked rows on phone), sector filter as a segmented control/chips row, movers row as compact list not cards.
3. Symbol page: price header in display type; range control; chart; **"50-day average" overlay toggle** for 1M/3M/1Y ranges: `PriceChart` accepts an optional `overlay?: { label: string; data: Bar[] }` drawn in `--series-2` 2px, a legend row ("NVDA" swatch + "50-day average" swatch) appears when the overlay is on, and the hover tooltip shows both values. Compute the MA from `getHistory(symbol)` (rolling 50 closes; only points where 50 closes exist). About panel stats as a definition list; "Volatility" note plain sentence.
4. News feed restyle (no uppercase tags; symbol as a small pill; "Why this moves stocks" link text without arrow).
5. verify: add a check that toggling "50-day average" on `/markets/NVDA` at 3M shows the legend.
Acceptance: build + verify pass; screenshots of the three pages, light + dark + phone.

### Task 4: Learn, Lesson (interactive), Coach, Community
Files: `src/app/(app)/learn/page.tsx`, `src/app/(app)/learn/[slug]/page.tsx`, `src/components/lesson-widgets.tsx` (new), `src/lib/course.ts` (add optional `widget` field only), `src/app/(app)/coach/page.tsx`, `src/app/(app)/community/page.tsx`, `scripts/verify.cjs`.
1. Learn page: a course map that reads as a sequence (it IS a sequence, so numbered modules are appropriate): module headers with progress bars, lessons as rows with status, the "Up next" lesson highlighted with the accent. Missions panel as a checklist. Stats (lessons done, XP, active days) as a quiet inline row, not boxed stat cards.
2. Lesson page: serif body (17/1.65, max 72ch), sans headings, key takeaways as a checklist, quiz restyled (options as full-width radio-like rows with letter keys; correct/incorrect use icon + text, not color alone).
3. Interactive widgets (new `lesson-widgets.tsx`), rendered after the lesson sections when `lesson.widget` is set:
   - `"position-size"` on `position-sizing`: inputs account size (default = user's current equity), risk % (slider 0.5–3), entry, stop → outputs shares, position value, % of account, dollar risk; live as you type.
   - `"reward-risk"` on `risk-reward`: entry/stop/target inputs → a horizontal bar diagram showing risk (down) vs reward (up) lengths to scale, the R multiple, and the break-even win rate `1/(1+R)`.
   - `"trend-spotter"` on `trends-and-candles`: shows 3 small generated price charts (use seeded data from `market-data.ts` helpers), user labels each Uptrend / Downtrend / Range, then reveals answers. Deterministic generation so answers are correct by construction.
4. Coach page: Nova's messages in serif with the coach avatar; user messages right-aligned on `--panel-2` (not black bubbles); starters as a simple list of suggestions; offline banner phrased plainly ("Nova is in offline mode. Answers come from the built-in playbook.").
5. Community: feed posts as rows separated by dividers inside one panel (not a stack of cards); kinds as small pills; Nova's comments with coach styling; leaderboard as a table; challenges as a list with join buttons. Keep the "demo members" notice.
6. verify: add checks that the position-size widget computes 200 shares for account 100000, risk 1%, entry 100, stop 95; and that the trend spotter reveals a score after answering all three.
Acceptance: build + verify pass; screenshots.

### Task 5: Journal page (trade analytics, no API)
Files: `src/app/(app)/journal/page.tsx` (new), `src/lib/journal-stats.ts` (new), `scripts/verify.cjs`.
1. `journal-stats.ts` (pure): from `trades` compute: total trades, entries, closed trades, win rate (closed with realizedPnl > 0), total realized P&L, average coach score, score trend (per entry trade, chronological), flag frequency (count of non-good flag ids with their titles' generic name, e.g. "No stop-loss", "No reason recorded", "Concentrated position", "Chasing a jump", "Averaging down", "Overtrading", "Sector concentration", "Thin thesis", "Low reward-to-risk"), and up to 3 plain-language "patterns" insights (e.g. "4 of your last 5 buys had no stop-loss. Review Stop-losses.") each with a lesson slug.
2. Page: header with 4 stats in one row; "Coach score over time" line chart (reuse `PriceChart` with formatValue as integer, baseline at 70 labelled "Solid"); "Most common mistakes" horizontal bar chart (single hue `--series-1`, value labels, hover tooltip, sorted desc, empty state); "Patterns Nova sees" list with lesson links; full trade history table with filters (All / Buys / Sells / Auto exits) and the thesis text.
3. Empty state when no trades: one sentence and a primary button "Place your first trade" to `/markets`.
4. Add `/journal` to verify ROUTES and a check that after the core flow the journal shows the correct trade count and that "No stop-loss" appears in mistakes.
Acceptance: build + verify pass; screenshots.

### Task 6: Landing page redesign
Files: `src/app/page.tsx` (and a small client component for the hero demo if needed).
1. Hero (left-aligned, two columns on desktop, stacked on phone): headline in Barlow Semi Condensed 60px "Practice the market before it counts." (no highlighted word), one-sentence subhead, primary button "Start with $100,000 in practice money", secondary text link "See the course". Right column: the pre-flight checklist itself as the hero object (static demo data for a NVDA buy), whose five lines tick in sequence once on load (the only orchestrated motion; disabled for reduced motion), ending with the gauge at 92 "Disciplined".
2. Below: three short sections that each show the product rather than describe it in cards: (a) a real-looking review note from Nova (serif, coach rule), (b) a slice of the course map (3 lessons with statuses), (c) the journal "most common mistakes" bars with demo numbers. Each with a sentence-case heading and one sentence. No feature-card grid, no numbered steps unless it is a true sequence.
3. Footer: brand, "Prices and news are simulated. Not financial advice." in plain text.
4. Uses `BRAND` constants. Must not import client stores (landing stays static except the hero demo component).
Acceptance: build + verify pass; landing screenshots desktop + phone, light + dark.

### Task 7: Accessibility + copy pass
Files: any UI file (copy and a11y only), `scripts/verify.cjs`.
1. Load the `design:accessibility-review` and `design:ux-copy` skills and audit every page from the verify screenshots + code: contrast (compute for `--muted` on `--panel` and `--panel-2` in both themes, fix tokens if < 4.5:1), focus order, focus ring visibility, labels on icon buttons, form labels, `aria-live` for price/toast updates where appropriate, headings order (one h1 per page), reduced motion.
2. Copy: sentence case, active verbs, buttons say what happens, errors say what happened and how to fix it, consistent vocabulary (e.g. "Buy"/"Bought", "Share"/"Shared"), no `→` suffixes, no middle-dot strings, no ALL-CAPS.
3. Add an automated a11y smoke check to verify: for every route, every `button` and `a` has an accessible name, and every `input`/`textarea` has a label or aria-label.
Acceptance: build + verify pass; report lists each fix.

### Task 8: Legal pages, consent and compliance fixes
Inputs: `docs/legal/research-report.md` (sourced risk research) is the authority for clause content. Not legal advice; every legal page ends with "Last updated" and the owner must have a lawyer review before public launch (say so in README, not on the pages).
Files: `src/lib/legal.ts` (new), `src/app/(legal)/layout.tsx` + pages `terms`, `privacy`, `disclaimer`, `community-guidelines`, `copyright`, `accessibility` (new, static server components), `src/components/onboarding.tsx`, `src/components/consent-gate.tsx` (new), `src/components/shell.tsx` (footer links), `src/app/page.tsx` (footer links, "Example" labels), `src/store/app.ts` (consent + data controls only), `src/lib/market-data.ts` (headline templates only), `src/lib/community-seed.ts`, `src/app/(app)/community/page.tsx`, `src/lib/course.ts` (citations only), `src/app/(app)/settings/page.tsx` (new), `scripts/verify.cjs`.
1. `src/lib/legal.ts`: one config object `LEGAL = { entityName: "[Company legal name]", contactEmail: "[legal@yourdomain.com]", dmcaAgent: "[Designated agent name and address]", governingLaw: "[State], United States", effectiveDate, termsVersion: "2026-11-24", minimumAge: 18 }`. Placeholders in square brackets are deliberate (the owner fills them); render them as-is. Nothing else hard-codes these values.
2. Legal pages (sentence case, readable, max 72ch, serif body like lessons; a shared `(legal)` layout with a sidebar of all legal pages and the brand header; linkable section anchors): Terms of Service, Privacy Policy, Investment & simulation disclaimer (also covers AI coach limitations), Community guidelines (incl. no market-manipulation/pump-and-dump talk, no real-money solicitation, report button), Copyright/DMCA policy, Accessibility statement (WCAG 2.2 AA target + contact). Content follows the research report's clause checklist exactly. The Terms also include a "Paid plans" section (see Task 10): plans and prices, automatic renewal until cancelled, how to cancel online in Settings (as easy as signing up), when cancellation takes effect, refunds policy placeholder `[refund policy]`, price-change notice, taxes, and that test mode involves no charge.
3. Clickwrap consent: onboarding's first step gets an unchecked checkbox "I'm 18 or older and I agree to the [Terms of Service] and [Privacy Policy]. I understand Vantage is an educational simulator, not investment advice." with links opening in a new tab; the continue button is disabled until checked; "Skip" may skip the questions but never the consent. Store `profile.consent = { version, acceptedAt }`. A `ConsentGate` in the app shell blocks the app (modal) when consent is missing or `version !== LEGAL.termsVersion` (re-consent on change).
4. Persistent disclaimers: a one-line footer in the app rail/phone menu ("Simulated prices and news. Educational only, not investment advice.") with links to Terms, Privacy, Disclaimer; the coach page and every review card label Nova as "AI coach" and link the disclaimer; Nova's community comments carry an "AI-generated" label.
5. Remove fake social proof: no fabricated like counts or participant counts anywhere (seeded posts show likes only from the real user; challenges show no participant number); every seeded member, post and leaderboard row carries a visible "Demo" label; landing mock content is labelled "Example". 
6. Simulated news about real companies: every headline is visibly labelled "Simulated"; remove templates that allege wrongdoing or specific events (regulator inquiries, executive departures, delays) and replace them with neutral, clearly hypothetical market-move templates (e.g. "{name} shares rise after strong quarterly results (simulated)"). Keep the learning value (earnings, guidance, analyst, macro kinds).
7. Course claims: add a "Sources" line to lessons that cite statistics (SPIVA for active managers, Barber & Odean 2000 for active traders, Kahneman & Tversky 1979 for loss aversion) with links.
8. Community: a "Report" action on every post/comment (marks it reported, hides it for this user, toast "Reported. Thanks for flagging it."), plus a link to the guidelines in the composer.
9. Settings page `/settings` (nav: in the rail footer and phone menu): "Export my data" (downloads JSON of all local state), "Delete all my data" (confirm dialog, clears both persisted stores, reloads to onboarding), theme choice, "Reset practice account".
10. AI data notice: before the first request that would send data to the AI provider (only when `/api/coach` GET reports mode "ai"), show a one-time notice: what is sent (profile name, simulated portfolio, trades, chat text), to whom (Anthropic, as the AI provider), and a link to the Privacy Policy; store `profile.aiNoticeAt`. In offline mode nothing is sent and no notice is needed.
11. verify: legal pages return 200 and contain their h1; the app cannot be used before consent (modal visible, continue disabled until the checkbox is ticked); export downloads a JSON file; delete clears state; no element on /community shows a seeded like count.
Acceptance: build + verify pass; screenshots of onboarding consent step, /terms, /privacy, /settings, /community (light + phone).

### Task 9: Growth features from the marketing research (no backend, no keys)
Inputs: `docs/marketing/research-report.md` §8 and §4.4. Only items that need neither a backend nor an API key; waitlist/email capture, referral rewards and public challenge pages wait for the backend.
Files: `src/lib/track.ts` (new), `src/components/cookie-consent.tsx` (new), `src/app/lessons/[slug]/page.tsx` (new, public, server-rendered), `src/app/lessons/page.tsx` (new), `src/app/tools/position-size-calculator/page.tsx`, `src/app/tools/reward-risk-calculator/page.tsx` (new, public), `src/app/sitemap.ts`, `src/app/robots.ts` (new), `src/app/share/score/page.tsx` + `src/app/share/score/opengraph-image.tsx` (new), `src/components/review-card.tsx` (share action only), `src/app/(app)/dashboard/page.tsx` ("Start here" activation block only), `src/store/app.ts` (referral capture only), `scripts/verify.cjs`.
1. Event layer `track(event, props)` with the Pixel/CAPI-ready names `CompleteRegistration` (onboarding + consent done), `FirstTrade`, `FirstTradeWithStopLoss`, `LessonComplete`, `ShareScore`. It is a no-op unless `NEXT_PUBLIC_META_PIXEL_ID` is set; when set, the Meta Pixel loads only after the user accepts a cookie-consent banner ("Allow marketing cookies" / "Only necessary"), and the choice is stored. No ID is configured now, so the banner never shows today. Wire the calls at the right places.
2. Public lesson pages `/lessons` and `/lessons/[slug]`: statically generated from `COURSE` (`generateStaticParams`), full lesson text and key takeaways (quiz excluded), per-page `metadata` (title, description, canonical, Open Graph), JSON-LD `LearningResource`, a "Practice this in Vantage" CTA to `/learn/<slug>`, and the simulator disclaimer in the footer. Same visual language as the landing page (no app shell, no consent gate, so crawlers can read them).
3. Free public calculators: `/tools/position-size-calculator` and `/tools/reward-risk-calculator`, reusing the widgets from `src/components/lesson-widgets.tsx` (Task 4), each with an explanation, the formula, metadata and a CTA. They're link magnets, so make them genuinely useful and fast.
4. `sitemap.ts` (landing, lessons, tools, legal pages) and `robots.ts` (allow all; disallow the logged-in app routes `/dashboard`, `/markets`, `/coach`, `/community`, `/journal`, `/settings`).
5. Share cards: the review card's "Share to community" gains a sibling "Share score" that opens the Web Share API (fallback: copy link) to `/share/score?s=<score>&l=<label>&sym=<SYMBOL>&side=<buy|sell>`. That public page shows the score card and a CTA, and its `opengraph-image.tsx` (next/og `ImageResponse`) renders a 1200×630 card: brand, symbol, side, score, label, and the line "Simulated trade. Educational only, not investment advice." No P&L or returns on share cards.
6. Referral capture: if the landing or any public page is opened with `?ref=<code>`, store it once in the profile (`referredBy`); the Settings page shows "Your invite link" (`/?ref=<handle>`) with a copy button. No rewards yet.
7. Activation: the Home page shows a "Start here" block until the user has placed a buy with a stop-loss: three steps (pick a stock, set a stop-loss with the quick buttons, write one sentence of reason) linking to `/markets/SPY`, ticking as each happens (reuse mission state).
8. verify: `/lessons/position-sizing` returns 200 with the lesson h1 and JSON-LD; `/tools/position-size-calculator` computes 200 shares for 100000 / 1% / 100 / 95; `/sitemap.xml` lists the lessons; `/share/score?...` renders the card; `track()` doesn't throw without a Pixel ID.
Acceptance: build + verify pass; screenshots of a public lesson, a calculator and the share page (desktop + phone).


### Task 10: Membership tiers and paywalls (no payment provider yet)
Owner decision: free to start, paywalls once users are engaged, three tiers. Prices: **Free $0**, **Premium $30/month** (badge "Most popular"), **Elite $60/month**. Payments are not live (Stripe arrives with the backend), so upgrades run in a clearly labelled test mode.
Legal guardrails (binding; see `docs/legal/research-report.md` §2.3 and the FTC dark-patterns guidance): no confirmshaming, no fake urgency or scarcity, no countdowns, no pre-checked boxes, renewal terms shown next to every buy button ("Billed monthly. Renews automatically until you cancel. Cancel anytime in Settings."), cancelling takes one click in Settings, and paid tiers list **only features that exist**.
Files: `src/lib/plans.ts` (new), `src/components/paywall.tsx` (new), `src/app/pricing/page.tsx` (new, public), `src/app/(app)/upgrade/page.tsx` (new), `src/app/(app)/debrief/page.tsx` (new, Elite), `src/lib/learning-plan.ts` (new, Elite), `src/store/app.ts` (plan + usage counters only), gated pages (learn, lesson, markets/[symbol], journal, coach, community, settings), `scripts/verify.cjs`.
1. `plans.ts`: `PLANS` (id, name, price per month, tagline, feature list in plain words, `popular` flag on Premium) and `can(plan, feature)` over these features:
   - Free: the simulator and all order types with **10 trades per day** (see rule below), lessons in modules 1–2, rules-engine trade reviews on every trade, 10 coach messages per day, community read/post/comment, journal stats (basic numbers + trade history).
   - Premium (everything in Free plus): unlimited trades, all 19 lessons and the interactive tools, unlimited coach messages, journal "Most common mistakes" and "Patterns Nova sees", 50-day average chart overlay, joining weekly challenges, CSV export of trades.
   - Elite (everything in Premium plus): Weekly debrief (a page summarising the last 7 days: trades, score trend, top mistakes, best and worst decision, and three focus points, computed locally from journal-stats), Personal learning plan (an ordered list of lessons and missions built from the user's most frequent flags, shown at the top of Learn), the Elite badge on community posts and the leaderboard.
2. Store: `profile.plan` (`"free" | "premium" | "elite"`, default free), `planChangedAt`, a daily coach-message counter and a daily trade counter (both reset at local midnight).
   Daily trade limit (owner decision): on Free, every order the user places (market, limit or stop; buy or sell) counts toward 10 per day. Automatic bracket exits (stop-loss/take-profit fills) never count and always execute. Selling to close or reduce an existing position is always allowed even at the limit (it still counts), so a user is never trapped in a position. At the limit, new buys and new limit/stop entries are blocked with the paywall. The ticket shows "N of 10 free trades left today" on Free.
3. `Paywall` component: shows what is locked and what the plan includes (plain language, one primary "See plans" button to `/upgrade`, a dismiss/back option). Partial previews are allowed (e.g. the first section of a lesson, a blurred chart with real axes). Copy is neutral and respectful.
4. Gates: the 11th opening order of the day on Free (paywall in the ticket); Learn (lessons in modules 3–6 show a lock and open a preview + paywall); lesson widgets; MA overlay toggle; journal mistakes chart + patterns; challenge "Join"; coach after 10 messages/day with a visible "N of 10 free messages left today"; CSV export; `/debrief` and the learning plan (Elite).
5. `/pricing` (public, landing style) and `/upgrade` (in app): three columns, Premium highlighted as "Most popular", feature comparison table, the renewal disclosure under every button, links to Terms. Buttons open a dialog: "Payments aren't live yet. You can preview this plan in test mode at no charge." → "Preview Premium" switches `profile.plan`. Settings shows the current plan and "Cancel plan" (one click, back to Free, toast "Plan cancelled. You're on Free.").
6. verify: the existing core flow runs on Premium test mode (set at the start) so it isn't capped; a separate free-plan check places 10 orders then sees the paywall on the 11th buy while a sell of a held position still goes through; free user hits the paywall on a module-3 lesson, the MA toggle and the journal mistakes; the coach shows the counter; previewing Premium unlocks them; Elite unlocks `/debrief`; cancel returns to Free in one click; `/pricing` shows three plans with the renewal disclosure.
Acceptance: build + verify pass; screenshots of /pricing, a paywall, /debrief (desktop + phone).

### Task 11: Key-ready integrations (fully built, switched on by environment variables)
Owner decision: everything that needs an API key is fully built now and waits for the keys, which the owner will add later. Rules for every integration: (a) all keys live in environment variables documented in `.env.example` (never in code, never in the browser except public IDs), (b) a server-side `src/lib/integrations.ts` reports which integrations are configured, (c) when a key is missing the app keeps working with today's fallback (local storage, offline coach, test-mode plans, no tracking), (d) a Settings → "Integrations" panel (visible in development and to the owner) lists each one as Connected / Not connected with a link to its setup guide, (e) `docs/setup/<integration>.md` explains, for a non-technical owner, where to get each key, what it costs, and where to paste it.
Integrations. Backend decision (from `docs/backend/research-report.md`): **Supabase** (Postgres + Auth + RLS + Storage) on the free tier, data model per the report's §7, `@supabase/ssr` for Next.js. Email: **Resend**. Hosting stays host-agnostic (no Vercel-only APIs), because Vercel Hobby forbids commercial use once paid plans exist; deploy target is decided at launch (Cloudflare via OpenNext, Netlify free, or Vercel Pro). Add a scheduled `pg_dump` backup recipe (GitHub Actions, free) to the setup docs, since the Supabase free tier has no automatic backups.
1. Backend + auth: provider client (server and browser), sign up / sign in (email + Google, Apple later), session handling in middleware, the schema as SQL/migration files with row-level security (or the provider's equivalent) for every table, consent and age stored server-side, account deletion and data export via the server, and a first-sign-in migration that uploads the user's local data. Local-only mode stays the default when keys are absent.
2. Payments (Stripe): server routes for Checkout (subscription, Premium and Elite price IDs from env), the Customer Portal (manage/cancel), and a signature-verified webhook that sets the user's plan in the database; `profile.plan` comes from the server when configured. The test-mode switch from Task 10 is hidden when Stripe is configured.
3. Email (provider per backend report, e.g. Resend): welcome email, plan receipts/cancellation confirmations, sent from server routes only; plain, compliant templates with a physical-address placeholder and unsubscribe for non-transactional mail.
4. Meta Pixel + Conversions API: the Task 9 `track()` layer also posts server-side events to CAPI (hashed identifiers, event deduplication IDs) only after marketing-cookie consent.
5. AI coach: already key-ready (`ANTHROPIC_API_KEY`); add per-user server-side rate limiting once the backend exists, and the AI data notice from Task 8.
6. `docs/setup/README.md`: one checklist of every key in the order to add them, with costs, plus how to set them on the hosting provider.
7. verify: with no keys set, every page works and the Integrations panel shows everything "Not connected"; unit-level checks that webhook signature verification rejects bad signatures (using a fake secret in the test).

### Task 11b: Background agents on eve (Vercel), key-ready
Per the owner's request to use `vercel:build-agents`. New server-side agents are built as an **eve** project in `agents/` (`npx eve@latest init vantage-agents`), following eve's versioned docs in `node_modules/eve/docs/` (never from memory). Nova's in-app coach stays on the Anthropic SDK (an established stack, per the skill's own rule).
1. **Moderation agent**: reviews community posts and comments that users Report (and new posts, when enabled) against `/community-guidelines`, with special attention to market manipulation / pump-and-dump talk, real-money solicitation, personal data and harassment. It never deletes on its own: it proposes hide / keep / escalate with a reason, and the owner (or a human moderator) approves. It writes an audit trail.
2. **Weekly debrief agent (Elite)**: a scheduled durable run that writes each Elite member's weekly debrief from their journal stats (the same numbers as the local `/debrief` page), plus Nova's three focus points, and emails it via Resend (Task 11) only to members who opted in.
3. Both are key-ready: they run only when deployed to Vercel with AI Gateway (and Supabase for data) configured, and they're documented in `docs/setup/agents.md` with cost notes (Vercel Hobby forbids commercial use, so Vercel Pro is needed once paid plans are live). Until then the app works without them: reports are hidden locally and Elite sees the local debrief page.
Owner: `opus-engineer`. Review: QA R1 + qa-final.
