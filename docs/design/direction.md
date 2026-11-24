# Vantage design direction: "Blue Pencil"

Status: Phase 1 complete (critique and direction). No source files were changed in this phase.
Author: design lead. Date: 2026-11-24.
Skills applied: frontend-design (two-pass plan and review), design-critique, design-system, ux-copy, accessibility-review, dataviz.
Owner tooling addendum folded in (§10): Motion (with Motion Primitives patterns) for in-app motion, GSAP for the single landing hero moment only, 21st.dev free components as source and reference, Watermelon UI, Coconut UI and 3ui as layout reference only, no Anime.js, and custom SVG charts.
Supersedes: the "Design system" section of `.superpowers/sdd/2026-11-24-preflight-overhaul/design-spec.md` and the duplicate in `docs/plans/2026-11-24-preflight-overhaul.md`. Product scope, legal rules and the task list in those files still stand.

This document is meant to be implemented from on its own. Section 13 is the Phase 2 build order.

---

## Contents

1. Critique of the current UI
2. How the direction was reached (two passes)
3. The direction in one page
4. Palette
5. Type
6. Layout system
7. The signature: Nova's blue-pencil marks
8. Components
9. Iconography
10. Motion and the motion stack (Motion, Motion Primitives, GSAP)
11. Copy voice
12. Page-by-page wireframes (desktop and phone)
13. Phase 2 implementation plan
14. What we removed and why
15. Accessibility contract
16. Open questions for the owner

---

## 1. Critique of the current UI

Sources: 37 screenshots in `/tmp/vantage-shots/` (every page, dark and light, desktop and phone, plus the review flow), `src/app/globals.css`, `shell.tsx`, `ui.tsx`, `order-ticket.tsx`, `review-card.tsx`, `price-chart.tsx`, `dashboard/page.tsx`, `page.tsx`, `markets/[symbol]/page.tsx`, `coach/page.tsx`, `community/page.tsx`, `settings/page.tsx`, the legal layout, and `scripts/verify.cjs`.

### Overall impression

The owner is right. Every screen is the same kit: rounded white (or navy) cards on a gray-blue page, a bright accent on the primary button, a sparkle icon for the AI, a semicircle gauge, and an icon in a tinted square at the start of every list item. The navy-and-orange "pre-flight" restyle changed the colors but not the structure, so it still looks like a template with a theme applied. Nothing on any screen could only belong to Vantage. The best idea in the product (every trade checked against five rules) is buried at the bottom of a long form and hidden by toasts.

### First impression (2 seconds)

| Screen | What the eye hits first | Should it? |
|---|---|---|
| Landing | The orange second line of the centered headline and the glowing orange pill button | No. It's the stock "accent one phrase" hero. The product's real idea (checking each trade) doesn't appear above the fold. |
| Home | `$100,150.47` in big type | No. For a coaching product, account value is the least instructive number. What to fix next, and how the last trade scored, are secondary. |
| Markets | Four identical "Biggest movers" cards | No. They duplicate rows from the list directly below. |
| Symbol (NVDA) | The orange Buy toggle, then the chart | Partly. The pre-flight check, the thing that teaches, is around 900px down the ticket and below the fold at 1440×1000. Toasts cover it. |
| Learn | The hero card with three boxed stats (1/19, 445 XP, 1) | No. The course map is the content, and the stats are filler. |
| Coach | The magenta sparkle tile and an almost empty white panel | No. |
| Community | Gradient avatar circles and like counts | No. They read as fake social proof (and the legal research says remove them). |

### Usability

| Finding | Severity | Recommendation |
|---|---|---|
| **Phone pages overflow horizontally.** Screenshot widths show the documents are wider than the 390px viewport: Home 917px (2751/3), Markets 748px, Learn 651px, NVDA and SPY 658px. Causes: grid children without `min-w-0`, so the journal's `truncate` thesis and the filter chip row widen the column (CSS grid blowout). | Critical | Give every grid track `minmax(0,1fr)` and every flex or grid child that holds text `min-w-0`. Fix the verify check too (next row). |
| **verify's overflow check can't see this.** It compares `scrollWidth` with `window.innerWidth`. Under iPhone emulation Chromium zooms out to fit wide content, so `innerWidth` grows with the page and the check always passes. | Critical | Compare `document.documentElement.scrollWidth` with `document.documentElement.clientWidth`. Land this together with the overflow fixes, or verify goes red. |
| Toasts stay on screen and cover key UI. On desktop they sit bottom-right over the ticket's pre-flight check and the coach send button. On phone they sit top-right over the header and page title. | Critical | Desktop: bottom-left, inside the content column. Phone: just above the tab bar. At most two visible, auto-dismiss after 6s (errors stay until dismissed), pause on hover or focus. |
| The pre-flight check, the product's teaching moment, sits after nine form sections. | Critical | Put each check in the ticket's margin beside the field that satisfies it, and keep a summary strip next to the submit button (§7, §8.7). |
| The offline coach shows debug text to users: "Offline coach mode — add an Anthropic API key to unlock full AI coaching. (User: Alex · experience: some · goal: learn · level 2 Apprentice (385 XP))". The coach header says "add an API key". | Critical (copy) | Users never see API-key or context text. Offline label: "Offline playbook. Answers come from built-in rules, and nothing is sent to an AI service." Key setup belongs in Settings > Integrations (owner only, Task 11). |
| `/journal` is in the nav but is a stub (an h1 only). | Moderate | Build it (Task 5) with the check record (§12.9). |
| The order type control uses `role="tab"` with no tab panels and no arrow-key handling. | Moderate | Make it a `radiogroup` of radios. Update the one verify selector in the same commit (§13). |
| The "Nova's brief" panel on Home stretches to the row height and leaves around 300px of dead space (desktop dark). | Moderate | Remove the row-matched cards. Nova's notes go in the margin column and take their natural height. |
| The review header says "Disciplined" three times (gauge label, pill, and the headline "Disciplined — exit on AMD"). | Moderate | Show the score mark and tier once. The headline says what happened. |
| Chart trade markers are 6px-radius colored dots with 8px white "B"/"S" letters: illegible, and the meaning rides on color. | Moderate | Use 10px ink triangles (up for buy, down for sell) with a 2px surface ring, a 24px hit area and a tooltip. |
| Completed missions are struck through, which reads as "cancelled". | Minor | Show a pencil tick and keep the text at normal weight in ink-2. |
| The disabled "Check answers" button is washed-out peach with no reason given. | Minor | Use the standard disabled style plus a hint: "Answer both questions to check." |

### Visual hierarchy

- **Reading flow:** the eye zigzags between same-weight cards. Every section title is 18px semibold, so nothing ranks. Card padding, not content, sets the rhythm.
- **Emphasis:** money and orange get the emphasis, while process and the next action are under-weighted. In a product that grades process, the process score and the next fix should be the loudest things after the page title.
- **Type:** only three sizes are in real use (14, 18, 30). Headings and body share one weight range (500–600), so it looks flat. Nova's serif at 17px is larger than the 14px sans around it inside the review card, which looks accidental.

### Consistency

| Element | Issue | Recommendation |
|---|---|---|
| Radius | 14px cards, 16px insets (`rounded-2xl`), 24px step cards (`rounded-3xl`), 10px nav, pill buttons, 8px insets in the spec. Five radii with no rule. | One policy by hierarchy (§6.5). |
| Buttons | Pills on Home ("Trade") and in reviews, 10px on the ticket, a gradient-shadow pill on the landing page | One button system, no pills (§8.4). |
| Links | Blue `series-1` links with an appended arrow ("Add a plan →", "Why this moves stocks →") | Links are ink and underlined. No arrows. |
| Color meaning | Orange marks primary actions, Buy, focus, the live dot, the level bar and XP. Magenta is Nova. Blue is links, chart lines and the "Solid" tier. | Each color has exactly one job (§4.3). |
| Meta strings | "Lv 3 · 445 XP", "Sold 5 @ $210.05 · -$6.25", "Apple · Technology", "@you · 7s ago" | Separate elements, commas or sentences. |
| Labels | "COACH REVIEW", "MODULE 1", "KEY TAKEAWAYS", "PRACTICE MISSION · +50 XP", "STICKER" | Sentence case, and no label at all unless it carries information. |

### Accessibility (current)

- **Contrast:** text tokens pass (ink-2 and muted are at least 4.5:1 on their panels). Chart axis text is 10.5–11px. The B/S marker letters are about 8px. The bottom nav labels are 11px.
- **Touch targets:** most are 40px or more. The quick-set buttons (−3%, −5%…) are 40px tall but about 36px wide. The community composer ticker field is 28px tall.
- **Semantics:** `role="checkbox"` sits on non-interactive list items without `aria-readonly`. The segmented "tabs" have no panels. The chart has no keyboard access and no table alternative.
- **Motion:** `animate-ping` runs forever on the live dot, alongside `animate-pulse` skeletons and bouncing typing dots. Reduced motion is respected globally, which is good.

### What works (keep it)

- The five pre-flight rules and their fix text ("Add a stop-loss below $177.20") are excellent product copy, and the core of the new signature.
- Gains and losses always carry a sign plus an arrow. The rule stays.
- The legal layout (sidebar of six pages, linkable anchors, 72ch serif) is structurally right. It gets restyled, not rebuilt.
- Token-only colors and light/dark parity are in place, so the reskin can start with a token swap.
- `analyzeTrade` flags link to the lesson that fixes them. That's a strong coaching loop to make visible.

### The AI tells, by category

These are the specific reasons the UI reads as generated. Each one is resolved in §14.

1. **Layout:** a centered hero with a badge pill. A 2×2 feature-card grid. 01/02/03/04 step cards where "Level up" isn't really a step. A closing CTA card. A bento dashboard of 2/3 + 1/3 rows repeated three times. A "Biggest movers" card row.
2. **Card kit:** everything is a rounded panel, insets are rounded panels inside rounded panels, stat tiles everywhere (Cash/Invested/Open/Realized, Lessons/XP/Days), dashed-border boxes for empty states, and a dashed-border notice.
3. **Type:** Barlow at 500–600 for everything, so it reads Inter-adjacent. A condensed display face used only for big numbers. Few sizes.
4. **Color:** navy dark mode (the default "fintech dark"), international orange on every action, magenta for the AI, green and red gains/losses, a gradient area fill under every line, oklch gradient avatars, and a glowing CTA shadow.
5. **Iconography:** Lucide everywhere. Sparkles for AI (the most common AI tell). An icon in a tinted square on features, "Up next" and missions. Arrows appended to links.
6. **Copy:** "with a coach in your corner", "Future-you will thank you", "Hey Alex, what are we working on?", "Your first trade is on us", "The loop that builds real skill", "Level up", "Boring is beautiful", em-dash labels ("Disciplined — exit on AMD"), and an emoji in seed posts.
7. **Density:** 69px market rows showing two data points each. 20px card padding plus 16px gaps on every block. Only 13 of 18 tickers fit above the fold.
8. **Hierarchy:** account value ranks above process. Every section title is the same.
9. **Motion:** a perpetual ping, red/green price flashes on every 2-second tick, a pulse skeleton, bouncing dots. Busy, but there is no single moment.
10. **Empty states:** dashed boxes with centered gray text ("Your account chart builds as the market moves.").

### Priority recommendations

1. **Replace the card kit with a ruled ledger.** Content sits directly on the page and is structured by rules and space. Only the order ticket and floating surfaces (dialogs, menus, toasts) are raised sheets.
2. **Make the five checks the visual identity.** Nova marks every trade in blue pencil: five tick cells and a circled score, on the ticket, the review, the journal, community posts, share cards and the landing hero.
3. **Give every color one job.** Ink for content and actions, blue pencil for Nova only, red pencil for losses and risk only. Gains are written "in the black": ink plus ▲ plus sign.
4. **Fix the four critical bugs** (phone overflow and its blind check, toasts covering UI, the debug copy leak, the buried pre-flight check) before any polish.

---

## 2. How the direction was reached (two passes)

### Pass 1: draft plan ("Ledger")

- Color: green columnar-pad paper, money-green primary buttons, green gains and red losses, Nova in green "auditor's ink".
- Type: a grotesk for UI and a monospace for every figure (ledger entries look typed).
- Layout: broadsheet-style hairline rules everywhere, zero radius, dense columns, a faint ruled-paper background on every page.
- Signature options considered: (a) a parametric guilloche "seal" per trade, engraved like a stock certificate; (b) a rubber stamp with the score; (c) the five-check strip.
- Motion: ticker tape scrolling across the top bar.

### Review: "what would any AI produce for a stock-learning app?"

The defaults I'd expect: dark navy or near-black with neon green, a purple AI sparkle, Inter or Geist, glass cards, gradient area charts, bento dashboards, XP bars, a centered hero with one accented word, feature cards, 01–04 steps, a "Most popular" glowing pricing card. The alternative "serious" defaults: cream paper with a serif and terracotta, or a black terminal with amber monospace.

| Draft element | Verdict | Revision |
|---|---|---|
| Money-green buttons and green gains | Default. "Finance means green" is the first association. Nova in green would also read as "gain". | Primary actions are **ink**. Gains are written **in the black** (ink + ▲ + sign), losses in **red pencil**. Green survives only as ledger *rule* color and the paper tint. |
| Monospace figures | Tell #5 (monospace for data). | **Archivo** with tabular figures. Width is used as the structural device: expanded for display, semi-condensed for dense tables. |
| Broadsheet hairlines, zero radius, dense columns, ruled background | Tell #3 (broadsheet). | Rules follow **accounting grammar** (column rules in numeric tables, a single rule above a total and a double rule below it) in ledger green, not black. Radius is set by hierarchy (controls 6px, sheets 10px). There is no background pattern anywhere. |
| Guilloche seal | Ornamental. It encodes the five checks badly and drifts toward crypto-certificate kitsch. | Cut. |
| Rubber stamp | Skeuomorphic kitsch. Grunge textures read as "theme". | Cut. Kept only the idea of the coach *marking* the work. |
| Ticker tape in the top bar | Trading-app cliché, and perpetual motion. | Cut from the shell. The watchlist lives on Markets and Home. |
| Five-check strip | Specific to this product, encodes real data, shareable (like a Wordle row, but about process, not outcome). | **Kept, and made the signature**, drawn as **blue-pencil marks**: an overshooting tick in each cell and a hand-drawn loop around the score. |
| Nova as a chat bubble with an avatar | Default chat UI. | Nova writes **in the margin**: a double vertical rule in blue pencil, serif text, a byline with the "AI coach" label. A teacher's margin notes, not a chat bot. |
| Text in a left icon rail | Default SaaS shell. | **Text-only top navigation** on desktop, plus a quiet **status bar** at the bottom that carries the legal line. Text-only tab bar on phone. |
| The pre-flight aviation metaphor | It no longer matches the visual world. | The feature keeps the plain-English name "Pre-flight check" (owner-approved, and verify depends on it). There are no aviation visuals anywhere. |

The revised plan is the direction below. Chanel check: I removed the ruled-paper background and the perforated ticket edge. The pencil marks and the margin rule are enough.

---

## 3. The direction in one page

**Name:** Blue Pencil.

**Concept:** Vantage is a practice ledger that a coach marks up. Your trades are written in ink on ruled paper, and Nova checks every one in blue pencil.

**Why it fits:** accountants, auditors, editors and teachers all mark work with the two-ended red/blue pencil: blue for "checked", red for errors. Beginners know a marked-up page from school, and pros know a blotter and a ledger. The pencil also gives the AI coach a visible hand. Everything Nova produces is in blue pencil, sits behind a blue double rule and carries the "AI coach" label, so AI-generated content is always identifiable at a glance. That's a legal requirement turned into the design language.

**The signature (spend all boldness here):** Nova's blue-pencil marks.
1. **The check cell:** a small square, ticked in blue pencil with a stroke that overshoots the box's top-right corner, the way a real tick does.
2. **The check strip:** the five cells in a fixed order (Reason, Stop, Risk, Target, Size). It is the visual fingerprint of a trade's process.
3. **The score loop:** the 0–100 process score with a hand-drawn open loop around it, like a teacher's circled grade.

**Everything else is quiet:** ink on ledger paper, rules instead of boxes, one typeface family with a width axis, a serif only when Nova or a lesson is speaking, no icons in navigation, and no gradients, glows or pills.

**Principles**

1. **Process is loud, money is calm.** Gains are not celebrated in color. The pencil marks are the only saturated color most screens have.
2. **One color, one job.** Ink acts, blue pencil is Nova, red pencil is loss or risk. Nothing borrows another color's job.
3. **Rules, not boxes.** Group with space, separate rows and sections with rules, and raise a sheet only for things you hold (the ticket) or things that float (dialogs, menus, toasts).
4. **Accounting grammar is structure.** Numbers align right and use tabular figures. Totals get a single rule above and a double rule below. Negatives get a true minus (−).
5. **Write like a desk supervisor.** Numbers first, plain verbs, no hype, no emoji.

---

## 4. Palette

### 4.1 Core palette (6 named values)

| Name | Token | Light | Dark | Role |
|---|---|---|---|---|
| Ledger | `--paper` | `#EDF1EA` | `#131C17` | Page background. A pale, cool sage, the tint of a columnar accounting pad. Dark is "night ledger", a deep green-black. |
| Card | `--sheet` | `#FAFBF8` | `#1A241F` | Raised sheets: the order ticket, dialogs, menus, toasts, the consent card. |
| Ink | `--ink` | `#141C17` | `#E3EAE4` | All text, primary buttons, focus ring, gains ("in the black"), user-made marks. |
| Blue pencil | `--pencil` | `#2443B5` | `#97ACFF` | **Nova only:** check ticks, score loops, the margin rule, Nova bylines, "AI coach" tags, correct quiz answers. Never links or buttons. |
| Red pencil | `--red` | `#B42318` | `#FF8D80` | **Losses and risk only:** negative P&L, risk flags, form errors, destructive actions. |
| Rule green | `--rule` | `#C9D6C5` | `#26332C` | Hairlines between rows and sections. It's the ledger's printed rule. Never used for text. |

### 4.2 Support tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink-2` | `#45514A` | `#AEBBB2` | Secondary text, labels, table headers |
| `--muted` | `#59665E` | `#8C9A92` | Tertiary text, axis labels, timestamps, placeholders |
| `--well` | `#E3E9E0` | `#212C26` | Recessed areas: formula blocks, row hover, the "you" row, disabled fills |
| `--field` | `#FFFFFF` | `#0E1511` | Input backgrounds (a white box on the form, recessed in dark) |
| `--edge` | `#6F8475` | `#66796D` | Borders of interactive controls: inputs, check cells, secondary buttons, segmented controls (at least 3:1, see §4.4) |
| `--rule-strong` | `#8CA590` | `#3E5246` | Table header underline, total rules, the section-heading rule |
| `--on-ink` | `#FAFBF8` | `#131C17` | Text on ink-filled buttons |
| `--gain` | `var(--ink)` | `var(--ink)` | Gain text and triangles ("in the black"). Components use this, never `--ink` directly, so the choice can change in one place. |
| `--loss` | `var(--red)` | `var(--red)` | Loss text and triangles |
| `--series-1` | `#0B8E7F` | `#18A7A1` | Chart series 1: price and equity lines, journal bars ("ledger teal") |
| `--series-2` | `#A86800` | `#B77F31` | Chart series 2: 50-day average ("ochre") |
| `--grid` | `#D5DFD2` | `#233029` | Chart gridlines |
| `--shadow-float` | `0 1px 0 rgba(20,28,23,.04), 0 8px 24px rgba(20,28,23,.12)` | `0 1px 0 rgba(0,0,0,.3), 0 12px 28px rgba(0,0,0,.5)` | Floating sheets only (menus, popovers, toasts, dialogs) |

There are no `warn` or amber tokens. "Watch" states use ink with the query mark (§7.4).

### 4.3 Color rules

- **Ink acts.** Primary buttons are ink-filled. Links are ink and underlined. Focus rings are ink.
- **Blue means Nova, and only Nova.** If something blue isn't from the coach, it's a bug. Corollary: Nova's marks are blue and *user* marks are ink (a ticked consent box, a selected quiz answer, the pricing table's ticks).
- **Red means money lost or risk taken.** Sell buttons are not red. "Delete all my data" is red because it's destructive.
- **Gains are written in the black:** ink + ▲ + "+". Losses: red + ▼ + "−". Zero: muted, no arrow, "0.00%". The shape and sign always carry the meaning, so color never does it alone.
- **No gradients, glows, transparency washes or tinted backgrounds** for status. Status is a mark plus words.
- Legacy names map onto the new tokens during migration (§13, step 2).

### 4.4 Contrast (WCAG 2.x, computed)

Text pairs need at least 4.5:1. UI boundaries and graphics need at least 3:1.

| Foreground | Light on paper | on sheet | on well | on field | Dark on paper | on sheet | on well | on field |
|---|---|---|---|---|---|---|---|---|
| ink | 15.21 | 16.73 | 14.07 | 17.38 | 14.22 | 13.04 | 11.81 | 15.13 |
| ink-2 | 7.26 | 8.00 | 6.72 | 8.30 | 8.75 | 8.02 | 7.26 | 9.30 |
| muted | 5.27 | 5.80 | 4.87 | 6.02 | 5.93 | 5.43 | 4.92 | 6.31 |
| pencil | 7.22 | 7.94 | 6.68 | 8.25 | 8.01 | 7.34 | 6.65 | 8.52 |
| red | 5.75 | 6.33 | 5.32 | 6.57 | 7.77 | 7.12 | 6.45 | 8.27 |
| edge (non-text) | 3.51 | 3.86 | 3.25 | 4.01 | 3.75 | 3.44 | 3.11 | 3.99 |
| series-1 (non-text) | 3.54 | 3.90 | 3.28 | 4.05 | 5.87 | 5.38 | 4.87 | 6.24 |
| series-2 (non-text) | 3.95 | 4.35 | 3.66 | 4.52 | 5.05 | 4.63 | 4.19 | 5.37 |

On-ink text: 16.73 (light), 14.22 (dark).

Notes:
- Pencil against ink is only 2.11:1 (light) and 1.78:1 (dark). They differ by hue, not lightness. Nova's content is therefore **never identified by color alone**: it always has the byline "Nova" with the "AI coach" tag, the serif voice, and the double margin rule.
- `--rule` and `--rule-strong` are decorative separators. Rows stay distinguishable through alignment and spacing, so they aren't required to reach 3:1. Interactive boundaries use `--edge`, which does.

### 4.5 Chart palette (dataviz validator)

Run with `scripts/validate_palette.js` from the dataviz skill:

- Light, on `#EDF1EA`: `#0B8E7F, #A86800`. Passes lightness band, chroma floor (≥ 0.10), adjacent CVD ΔE 13.0 (target 8), normal-vision ΔE 19.1 (floor 15), contrast ≥ 3:1. Also passes on `#FAFBF8`.
- Dark, on `#131C17`: `#18A7A1, #B77F31`. Passes all checks (CVD ΔE 14.0, normal-vision 19.5). Also passes on `#1A241F`.
- Charts never need more than two series, so there is no third slot. If a third is ever needed, run the validator first.
- Status in charts (journal mistakes) uses series-1 for magnitude, not red. Red is reserved for money lost.
- Teal was chosen over blue so chart lines never look like Nova's pencil.

---

## 5. Type

### 5.1 Faces (verified on npm 2026-11-24, installed as npm packages, no network font calls)

| Package | Version | Axes (checked in the woff2) | Role |
|---|---|---|---|
| `@fontsource-variable/archivo` | 5.3.0 | `wght` 100–900, `wdth` 62–125 | Everything that isn't Nova's prose or a lesson: UI, numbers, display. Import `@fontsource-variable/archivo/wdth.css` (family name `"Archivo Variable"`, `font-stretch: 62% 125%`). |
| `@fontsource-variable/literata` | 5.3.0 | `opsz` 7–72, `wght` 200–900 | Nova's notes, chat replies, lesson bodies and legal text. Import `@fontsource-variable/literata/opsz.css` and `opsz-italic.css` (family `"Literata Variable"`). |

To remove: `@fontsource/barlow`, `@fontsource/barlow-semi-condensed`, `@fontsource-variable/source-serif-4`.

Why: Archivo (Omnibus-Type) is a grotesque built for technical print. Its **width axis is the design device**. Expanded widths give display type the feel of a printed form header or ticket. Semi-condensed widths let dense numeric tables fit a 390px phone without a second family. Literata is a contemporary book face designed for long screen reading, which gives the coach and the course a calm, literate voice distinct from the app's. Neither is among the current generated-design defaults (Inter, Geist, Space Grotesk, DM Sans, Manrope, Fraunces, Instrument Serif, Playfair).

Feature support (checked): Archivo has `tnum`, `pnum` and `frac`, but no slashed zero and no oldstyle figures. Literata (latin subset) has `tnum`, `pnum` and `frac`. **Neither has ▲ ▼ ✓**, so arrows and marks are inline SVG (§7, §8.3). Both have U+2212 (true minus) and U+00D7 (×).

### 5.2 Scale (Bringhurst's classic sequence)

`12, 14, 16, 18, 21, 24, 36, 48, 60, 72` px. No other sizes.

| Style (CSS utility) | Size / line height | Family, width, weight | Use |
|---|---|---|---|
| `t-hero` | 72/72 desktop, 40/44 phone | Archivo 125% 600, tracking −0.015em | Landing headline only |
| `t-readout-xl` | 60/60 desktop, 36/40 phone | Archivo 112.5% 500, tnum | Home account value |
| `t-title` | 48/52 desktop, 30/36* phone | Archivo 125% 600, tracking −0.01em | Page h1 (one per page) |
| `t-readout` | 36/40 | Archivo 112.5% 500, tnum | Symbol price, journal headline numbers |
| `t-h2` | 24/30 | Archivo 112.5% 600 | Section headings, dialog titles |
| `t-h3` | 18/24 | Archivo 100% 600 | Sub-sections, the ticket title, review trade line |
| `t-lead` | 18/28 | Archivo 100% 400 | Page subtitles, landing subhead |
| `t-body` | 16/24 | Archivo 100% 400 | UI body. Inputs are always 16px so iOS doesn't zoom. |
| `t-small` | 14/20 | Archivo 100% 400/500 | Labels, help and fix text, table cells (desktop) |
| `t-table` | 14/20 | Archivo 87.5% 400, tnum | Dense numeric tables (Markets, positions, journal) |
| `t-micro` | 12/16 | Archivo 87.5% 500 | Axis labels, tags, column headers, the status bar. ink-2 or muted only. |
| `t-note` | 16/26 | Literata 400, opsz auto | Nova's notes and chat replies |
| `t-prose` | 18/29 desktop, 17/27 phone | Literata 400, opsz auto | Lesson bodies and legal pages, max measure 66ch |

*30px is the one exception to the scale: phone titles at 36px expanded wrap badly at 390px. Document it as the phone step of `t-title`.

**Weights:** Archivo uses only 400, 500 and 600, never 700+. Hierarchy comes from size and width, not boldness. Literata uses 400 and 600 (for `<strong>`), plus italic 400.

**Widths as hierarchy:** 125% for display only (titles, hero, wordmark), 112.5% for readouts and h2, 100% for UI, 87.5% for dense tables and micro text. Never go below 87.5% (legibility).

### 5.3 Numerals and number formatting

- `font-variant-numeric: tabular-nums` on every number in tables, readouts, the ticket, tooltips and toasts. `proportional-nums` in running prose.
- **True minus** U+2212: `−$1.70`, `−0.24%`. Never a hyphen.
- Currency: `$1,875.00` in tables and the ticket. Readouts show cents in ink-2: `$100,150` + `.47` at the same size, with the whole number in one `span.tnum` (verify reads it, §13).
- Percent: two decimals for daily moves (`+1.05%`), one for portfolio shares (`20.0%`), and none in prose ("2% of your account").
- Ratios: `3.2 : 1` with thin spaces (U+2009) around the colon.
- Times: "2 min ago" and "Nov 24" in UI. Chart axes show `9:41` without seconds unless the range is under 5 minutes.
- Large numbers in prose get no abbreviations ("$100,000"). Axes use `10K` style when they reach that scale.

### 5.4 Typographic rules

- Sentence case everywhere: buttons, headings, tabs, tags.
- No uppercase eyebrows, no letterspaced labels, no middle-dot meta strings, no "Label — fragment" em-dash constructions, no arrows appended to links or buttons, no single highlighted word in a headline.
- Left alignment everywhere in the app, numbers right-aligned in their columns. Center alignment only inside small symmetric controls.
- Measure: Archivo prose ≤ 72ch, Literata ≤ 66ch.
- `font-synthesis: none` (never fake bold or italic).
- `text-wrap: balance` on h1/h2, `text-wrap: pretty` on prose.

---

## 6. Layout system

### 6.1 Grid

| Breakpoint | Columns | Gutter | Outer margin | Max content |
|---|---|---|---|---|
| Phone < 768 | 4 | 16 | 16 | 100% |
| Tablet 768–1023 | 8 | 24 | 24 | 100% (phone shell: top bar plus bottom tabs) |
| Desktop ≥ 1024 | 12 | 24 | 32 | 1200px, left-aligned with the top bar's wordmark |

Two recurring desktop compositions:
- **Ledger + margin:** 8 columns of ledger and 4 columns of **Nova's margin**, separated by the blue double rule (§7.5). Used on Home, the Journal and Lesson (when Nova has a note).
- **Ledger + slip:** 8 columns of content and a 4-column **sheet** that sticks to the top (the order ticket). Used on Symbol.

Overflow rule: every grid uses `grid-template-columns: minmax(0,1fr)` at phone and `repeat(n, minmax(0,1fr))` above. Every flex or grid child holding text gets `min-w-0`. Horizontal scrollers (filter tabs, legal nav, wide tables) live in their own `overflow-x:auto` container that is a `min-w-0` child.

### 6.2 Spacing scale (4px base)

`4, 8, 12, 16, 24, 32, 48, 64, 96`. Tailwind steps `1, 2, 3, 4, 6, 8, 12, 16, 24` only. No 5, 7, 10, 14 or arbitrary values.

- Between page sections: 48 desktop, 32 phone.
- Section heading to content: 16.
- Table row height: 44 desktop, 52 phone (two-line rows).
- Inside sheets: 24 desktop, 16 phone.

### 6.3 Surface hierarchy

| Level | Surface | Border | Shadow | Radius | Used for |
|---|---|---|---|---|---|
| 0 | `--paper` | none | none | none | The page. All ledger content sits directly on it. |
| 0 well | `--well` | none | none | 6 | Formula blocks, row hover, the "you" leaderboard row, code-like readouts |
| 1 | `--sheet` | 1px `--edge` | none | 10 | Things you hold: the order ticket, the onboarding and consent card when embedded |
| 2 | `--sheet` | 1px `--edge` | `--shadow-float` | 10 | Things that float: dialogs (consent gate, AI notice, delete confirm, paywall dialog), the phone menu, search results, toasts, chart tooltips |

That's it. **No card grids.** A "section" is a heading plus a rule plus content on the paper.

### 6.4 Borders versus space

- Space groups things. Rules separate peers (rows, sections). Borders wrap only controls and sheets.
- **Section heading row:** h2 on the left, optional quiet action on the right ("See all", "Trade"), then a 1px `--rule-strong` line 8px below.
- **Table rows:** 1px `--rule` between rows. Header underline is 1px `--rule-strong`.
- **Totals:** a 1px ink rule above the total row and a double rule below (two 1px ink lines, 2px apart). This is real accounting notation and it appears only on genuine totals (portfolio value, journal column totals).
- **Vertical rules:** only between the cells of a stat row (Cash | Invested | Open P&L | Realized P&L) and in Nova's margin (blue double).

### 6.5 Radius policy (by hierarchy)

| Radius | Elements |
|---|---|
| 0 | Sections, tables, rules, the tab bar, the status bar |
| 2 | Check cells (inside the SVG) |
| 4 | Tags ("AI coach", "Demo", "Example", "Simulated", "Premium") |
| 6 | Buttons, inputs, segmented controls, wells, quiz options |
| 10 | Sheets: ticket, dialogs, menus, toasts, tooltips |
| 50% | Avatars only |

No pills anywhere. `rounded-full` is banned outside avatars.

---

## 7. The signature: Nova's blue-pencil marks

All marks are inline SVG components in a new `src/components/marks.tsx`. They use `currentColor` or tokens, and each gets `pathLength="1"` so it can draw in.

### 7.1 Check cell

viewBox `0 0 24 24`. The visual box is 14.5px inside a 24px frame so the tick has room to overshoot.

```
box   <rect x="2.75" y="6.75" width="14.5" height="14.5" rx="2" fill="none" stroke="var(--edge)" stroke-width="1.5"/>
tick  <path d="M5.5 14.5 L9.25 18.25 L21.5 2.5" fill="none" stroke="var(--pencil)" stroke-width="2.25"
            stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
n/a   <path d="M4.5 19.5 L15.5 8.5" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round"/>
```

- States: **done** (box plus pencil tick, the long arm leaving the box past its top-right corner), **to do** (box only), **not needed** (box plus a muted slash, used for checks that don't apply to sells).
- Sizes: 16px (tables, inline strips), 24px (ticket margin, review), 40px (landing, the journal legend).
- The overshoot is the signature detail. Don't "fix" it into a contained checkbox.

### 7.2 Check strip

Five cells in this canonical order, always: **Reason, Stop, Risk, Target, Size** (the order of `lib/preflight.ts`, and the order a disciplined trader plans: why, where I'm wrong, how much I can lose, what I can win, how big).

- Compact (16px cells, 4px apart): journal rows, community posts, toasts, share cards. Accessible name: "4 of 5 checks done. Missing: Target." (`role="img"`).
- Labeled (24px cells, labels under each cell in `t-micro` ink-2): review header, ticket summary, landing.
- A sell shows Stop, Risk and Target as "not needed".

### 7.3 Score loop

viewBox `0 0 72 48`. The number is centered (Archivo 112.5% 600, `--pencil`). The loop is an open, overrunning ellipse:

```
<path d="M60 15 C52 5 22 4 11 13 C2 21 6 36 24 41 C42 46 63 40 66 27 C68 18 61 10 49 8"
      fill="none" stroke="var(--pencil)" stroke-width="2" stroke-linecap="round" pathLength="1"/>
```

- Sizes: S 48×32 (number 16px) for rows, M 72×48 (number 24px) for review and ticket, L 120×80 (number 36px) for the landing hero.
- Tier label sits beside it, never inside: "Disciplined" (≥ 85), "Solid" (70–84), "Needs work" (50–69), all in ink. "High risk" (< 50) is red with the cross mark.
- `role="img"`, `aria-label="Process score 92 out of 100, Disciplined"`.
- The loop is the only hand-drawn shape in the product. Don't add more doodles.

### 7.4 Nova's mark vocabulary (replaces green/amber/red icon circles)

| Mark | Drawing | Color | Meaning | Visible word |
|---|---|---|---|---|
| Tick | the check-cell tick, no box | pencil | Good, done, correct | "Good" (sr-only in lists, visible in the legend) |
| Query | "?" in Archivo 600 inside the 14.5px box | ink | Worth a look | "Watch" |
| Cross | `M6 9 L15 18 M15 9 L6 18` in the box | red | Risk or error | "Risk" |

Shapes are distinct without color, which satisfies the no-color-only rule.

### 7.5 Nova's margin (the voice container)

Anything Nova writes sits behind a **blue double rule**: two 1px pencil lines, 3px apart, on the left edge, with 20px left padding.

- Byline row: "Nova" (Archivo 14/600 ink), tag "AI coach" (pencil border and text), optionally the "AI coach disclaimer" link (ink, underlined, already required by Task 8), and the time in muted.
- Body: `t-note` Literata 16/26 ink. Links inside are ink and underlined.
- Offline reviews add a quiet line: "Checked with the built-in playbook." Don't hide that Nova is the AI coach persona, and don't claim an AI wrote it.
- Used in: the review card, Home "Nova's notes", chat replies, community comments by Nova (with "AI-generated"), lesson "Nova's tip", journal "Patterns Nova sees", the landing example.
- The double rule is exclusive to Nova. No other callout gets a side rule.

---

## 8. Components

Each item gives anatomy, states and constraints. Token names refer to §4.

### 8.1 Shell and navigation

**Desktop (≥ 1024): top bar, 56px, on paper, with a 1px `--rule` below.**

```
Vantage   Home  Markets  Learn  Coach  Community  Journal        [Search stocks      ⌘K]   $100,150.47 ▲ +0.15%
```

- Wordmark: `BRAND.name` in Archivo 125% 600 at 21px, ink. No mark. (The favicon is the check cell with its tick.)
- Nav: text only, Archivo 16px/500 at 100% width, ink-2. The active item is ink with a 2px ink rule along the top bar's bottom edge under the label (it slides between items, §10.3), plus `aria-current="page"`. 44px hit height.
- Search: 240px field (`--field`, `--edge`, radius 6). `⌘K` hint in `t-micro`. Results open in a level-2 sheet.
- Account readout: a link to Home with `aria-label="Account value"`. Archivo 112.5% 500 at 16px tnum, then the delta.

**Desktop status bar: fixed at the bottom, 32px, `--paper`, 1px `--rule` top.** It is always visible and replaces the rail footer.

```
Simulated market   Simulated prices and news. Educational only, not investment advice.   Terms  Privacy  Disclaimer   |   Settings   Theme: System
```

- "Simulated market" is a `Simulated` tag (§8.5), with no animated dot.
- The disclaimer text is `FOOTER_DISCLAIMER` verbatim (verify reads it).
- Terms, Privacy and Disclaimer go in a `<ul aria-label="Legal">` with **exactly three links** (verify counts them). Settings and Theme sit **outside** that list.
- Theme opens a small menu (System, Light, Dark) as radios. Settings also has its own radio group.
- Content gets `padding-bottom: 48px` so nothing hides under the bar.

**Phone (< 1024): top bar, 56px.**

```
Vantage  [Simulated]                 [⌕]  [Menu]
```

- Width budget at 390px: wordmark at 18px/125% (about 92px), the Simulated tag (about 70px), search (40px), Menu (56px), plus 3 gaps of 8px, comes to about 282px of the 358px available. **The account value is not in the phone header.** It sits at the top of the Menu and on Home.
- The search icon button keeps `aria-label="Search stocks"`. It opens the full-width search row, with the input id `ticker-search-mobile` kept.
- `Menu` is a **text** button (no hamburger) and keeps the accessible name "Menu". It opens a level-2 sheet (`role="dialog"`) containing: account value, Settings link, theme radios, the disclaimer text, and Terms, Privacy and Disclaimer links. All of this exists today, so it's a restyle.
- Every header child must stay inside 390px (verify checks this).

**Phone tab bar: fixed bottom, 56px + safe area, `--paper`, 1px `--rule` top.** Six text labels with **no icons**: Home, Markets, Learn, Coach, Community, Journal. Archivo 87.5% 500 at 12px (labels 44–60px wide fit in 390px). Inactive is ink-2. Active is ink with a 2px ink bar on the top edge. Each target is at least 48px tall and the full column width.

**Page footer (phone and legal and public pages):** the disclaimer sentence plus Terms, Privacy and Disclaimer, above the tab-bar padding. This makes the full disclaimer reachable on every phone page in addition to the Menu.

### 8.2 Tables (the ledger)

- Header: `t-micro` ink-2, sentence case, bottom 1px `--rule-strong`. Numeric headers right-aligned.
- Rows: 44px min, 1px `--rule` separators, hover fills `--well`, and the whole row links when it has a destination (with the symbol as the real `<a>`).
- First column: symbol (Archivo 600 14 ink) with the name below it (`t-small` ink-2). No ticker "avatars".
- Numbers: `t-table`, right-aligned, tabular. Deltas use `Delta` (§8.3).
- Totals row: ink rule above, double ink rule below, label "Total" in 600.
- **Phone:** no horizontal scrolling. Rows become two lines: left is symbol plus name, right is value plus delta. Secondary columns (avg cost, shares) move to a second line in `t-micro` ink-2 ("107 shares at $186.54"), or to the symbol page.
- Sort (Markets only): a header button with a small ink triangle and `aria-sort`.

### 8.3 Readouts and Delta

- **Readout:** label above (`t-small` ink-2), number below (`t-readout` or `t-readout-xl`), cents in ink-2, delta line under it. The Home account value and the Symbol price use `AnimatedNumber` (§10.3). Everything else is static.
- **Stat row:** up to five cells in one row separated by 1px `--rule` vertical lines, no boxes. Label is `t-micro` ink-2 and the value is 18px Archivo 112.5% 500 tnum. On phone it becomes a 2×2 grid with rules between cells.
- **Delta:** `[▲|▼] +$1.00` or `−0.24%`. The triangle is an SVG at 0.62em, aligned to cap height. Gain is ink, loss is red, zero is muted with no triangle. Screen reader text: "up $1.00" or "down 0.24%" (the triangle is `aria-hidden`, plus sr-only words). The sign and the triangle are both always shown.

### 8.4 Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `--ink` fill, `--on-ink` text, radius 6, Archivo 600 15/16px, height 40 (desktop) or 48 (phone, and the ticket submit everywhere) | One per view: "Buy 10 NVDA", "Start trading", "See plans" |
| Secondary | transparent, 1px `--edge`, ink text | "Ask Nova about this", "Share to community", "Export my data" |
| Quiet | ink text, underline on hover and focus, no box, 40px hit area | "See the course", "Cancel", "See all" |
| Destructive | transparent, 1px `--red`, red text. Its confirm button is red fill with `--on-ink` text | "Delete all my data", "Delete everything" |
| Quick-set | 40×44 minimum, 1px `--edge`, radius 6, `t-table` | "−3%", "−5%", "+16%", "1% of account" (labels unchanged, since verify clicks them) |

- Hover: primary uses `color-mix(in oklab, var(--ink) 88%, var(--paper))`. Secondary fills with `--well`. No scale transforms, no brightness filters.
- Disabled: `--well` fill, `--muted` text, `--edge` border, `cursor: not-allowed`, plus a visible reason nearby.
- Focus (everything focusable): `outline: 2px solid var(--ink); outline-offset: 2px`.
- No icons inside buttons except Search and Close icon-only buttons (with `aria-label`). No arrows.

### 8.5 Tags

20px tall, radius 4, 1px border, `t-micro` 500, sentence case, padding 0 6px.

- "AI coach": pencil border and pencil text.
- "AI-generated": pencil border and pencil text.
- "Demo", "Example", "Simulated": `--edge` border, ink-2 text.
- "Premium", "Elite": ink border and ink text.
- "Most popular": ink fill and on-ink text. This is the only filled tag.

### 8.6 Inputs

- Label above (`t-small` 500 ink-2). Field: `--field` background, 1px `--edge`, radius 6, height 44, text 16px tnum where numeric.
- Prefix or suffix inside the field in muted: "$" before prices, "shares" after the quantity.
- Help or fix text below in `t-small`. When the field relates to a pre-flight check, the fix text comes from `preflightChecks().fix`.
- Error: red border, red help text starting with the cross mark, `aria-invalid`, and `aria-describedby` pointing at the help.
- Textarea: same treatment, 3 rows, resize vertical.
- Checkbox (user-made, for example consent): 20px box, `--edge` border, **ink** tick when checked (the same overshooting geometry in ink), with the native input visually hidden but focusable.
- Radio and segmented: a row of 40px options with a 1px `--edge` outer border, radius 6. The selected option is ink-filled with on-ink text. Use real `role="radiogroup"` and radios with arrow-key navigation. Exception: community Feed, Leaderboard and Challenges stay **tabs** (`role="tablist"`, with tab panels), styled as underlined text tabs.

### 8.7 Order ticket (the slip)

A level-1 sheet, 4 columns wide, sticky under the top bar on desktop. On phone it sits directly under the chart.

The form reads top-down in the canonical check order. Each check's **cell sits in a 32px left margin of the ticket, level with the field that satisfies it**, the way an auditor ticks the lines of a form.

```
┌───────────────────────────────────────────┐
│ Buy NVDA                         $187.50  │  t-h3 + live price (tnum)
│ [  Buy  |  Sell  ]                         │  radiogroup, selected = ink fill
│ ( Market )  Limit                Cash $58,995 │  radiogroup (was tabs)
│───────────────────────────────────────────│
│ □  Why are you making this trade?         │  Reason cell, label
│    [I expect … because … I'm wrong if …]  │  #thesis
│    Write at least 40 characters (12 so far)│  fix text
│ □  Stop-loss                              │  Stop cell
│    [$ 177.17      ]  [−3%][−5%][−8%]      │  #stop
│ □  Shares                                 │  Risk cell
│    [10      shares]  [Max]                │  #qty
│    Size by risk  [0.5% of account][1% of account][2% of account]
│    Risk if stopped  $1,002.59 (1.00%)     │
│ □  Take-profit                            │  Target cell
│    [$ 216.34      ]  [+6%][+10%][+16%]    │  #target
│    Reward to risk  3.2 : 1                │
│ ☑  Order value  $20,063.00  20.0% of account │  Size cell, on the computed line
│═══════════════════════════════════════════│
│ Pre-flight check     5 of 5 complete  (92)│  heading + count + score loop M
│ ☑ ☑ ☑ ☑ ☑                     Disciplined │  labeled strip (aria-hidden)
│ Reason Stop Risk Target Size              │
│ [            Buy 107 NVDA               ] │  primary, 48px, exact label
│ 8 of 10 free trades left today            │  Free plan only (Task 10)
│ Practice trade. Simulated prices, no real money. │
└───────────────────────────────────────────┘
```

Rules that protect verify and accessibility:
- The **five margin cells** carry `role="checkbox" aria-readonly="true" aria-checked={ok}`, an accessible name equal to the check label ("Stop-loss set"), and `data-check-id` / `data-ok`. They are not focusable. **Only these five** carry `role="checkbox"`. The summary strip is `aria-hidden="true"` with a sibling sr-only sentence, otherwise verify counts 10.
- The heading text stays exactly "Pre-flight check", and the count stays "N of M complete" in an `aria-live="polite"` region.
- Keep the reset behavior: after a fill, hide the margin ticks and the summary until the next edit (verify asserts that "Pre-flight check" disappears).
- Keep the ids `#qty`, `#stop`, `#target`, `#thesis`, `#trigger`, the quick-set labels, `Buy {n} {SYM}` / `Sell {n} {SYM}` / `Place limit buy`, and the error texts containing "Not enough cash" and "only hold" (`role="alert"`).
- Sell side: the Reason and Size cells apply. Stop, Risk and Target show "not needed" and their fields are hidden.
- Limit or stop orders: the trigger price field appears directly under the order type. The ticket title becomes "Limit buy NVDA".
- Success after a fill: a status line in ink with the pencil tick: "Bought 107 NVDA at $186.54. Nova is reviewing it." Then the review appears in the page column.
- The cell ticks draw in with a 160ms stroke (§10). Unticking is instant.

### 8.8 Coach review (the marked ticket)

It sits on the paper as a ruled block, not a card.

```
Coach review                                             2 min ago
Bought 107 NVDA at $186.54                         (98) Disciplined
☑ ☑ ☑ ☑ ☑   Reason  Stop  Risk  Target  Size
─────────────────────────────────────────────────────────────────
║║ Nova  [AI coach]  AI coach disclaimer
║║ Clean process. You sized from your stop, risked 1.00% of the
║║ account and wrote down what would prove you wrong.
║║
║║ ✓ You wrote a thesis. Lesson: Your trading journal
║║ ✓ Sized from your stop: 20% of your account
║║ ? Earnings in 6 days can jump past a stop. Lesson: Stop-losses
║║
║║ Next: repeat this setup on your next trade, then compare both
║║ in your journal.
[Ask Nova about this]   [Share to community]   [Share score]
```

- Keep the text "Coach review" (verify). The trade line is `t-h3`. The score loop is M size with the tier once.
- Realized P&L, for exits only, goes on the trade line as a Delta.
- Flags use the mark vocabulary (§7.4) plus the title, detail, and a lesson link as plain underlined ink text: "Lesson: Stop-losses".
- "Did well" and "Improve" become a single list ordered by mark: crosses, then queries, then ticks. Fewer subheads.
- Pending state: "Nova is reviewing this trade." in muted inside the margin rule, with no pulse.
- Compact variant (Home and journal expansions): strip, score loop and Nova's first sentence only.

### 8.9 Charts (dataviz rules)

**Price and equity line (`PriceChart`):**
- Line 2px `--series-1`, round joins. **No area fill.**
- One y-axis, on the right, with 4 clean ticks in `t-micro` muted tnum. 1px solid `--grid` gridlines. X-axis has 3–4 labels.
- Reference line (previous close, starting balance): 1px **solid** `--rule-strong` (gridlines are never dashed) with a direct label at the left in `t-micro` ink-2 ("Previous close $186.50", "Starting balance $100,000").
- End dot: r 4 `--series-1` with a 2px surface ring. No pulsing.
- Trade markers: 10px ink triangles (▲ buy below the point, ▼ sell above) with a 2px surface ring and a 24px hit target. Tooltip: "Bought 107 at $186.54. Score 98."
- Hover: 1px ink-2 crosshair, r 4 dot with a ring, and a level-2 tooltip sheet showing time (muted), value (16px 600 tnum) and change from range start as a Delta. With two series, both values and their swatches.
- Keyboard: the plot is focusable (`tabindex=0`). Left and right arrows move the crosshair, Home and End jump to the ends. Announce the value through a visually hidden live region, throttled.
- Table view: a quiet "Show table" toggle under each chart reveals the last 20 points (time, value) as a ledger table.
- Two series (the 50-day average overlay, Task 3 and Task 10): `--series-2`, 2px, direct label at the line end ("50-day avg"). A legend row above the plot with line swatches: "NVDA" and "50-day average". The toggle is an ink checkbox: "Show 50-day average".
- Ranges: 1D, 1M, 3M, 1Y as a radiogroup.
- Collecting state: the axes render with a single muted line of text in the plot, "The chart fills in as prices update." No dashed box.

**Sparkline:** 2px line in **`--ink-2`** (a de-emphasis hue, because these are context, not the story), no fill, and a 1px `--grid` hairline at the previous-close level. Direction comes from the Delta beside it. `aria-hidden`.

**Journal: process score over time:** a single series (`--series-1`), y fixed at 0–100, a reference line at 70 labeled "Solid", end-value label, hover tooltip "Trade 7, Buy NVDA, score 98".

**Journal: most common mistakes:** horizontal bars at most 24px thick, 4px rounded data end, square at the baseline, `--series-1`, sorted descending. Value at the tip ("6 of 12 trades") in ink, per-bar hover tooltip, table view. This chart is a Premium preview on Free (Task 10): render the real axes with bars replaced by `--well` blocks, plus the paywall. No blur filter, because blur reads as a dark pattern.

**Charts never use red or blue pencil.** Not even for losses: the polarity lives in the Delta text.

### 8.10 Toasts

- A level-2 sheet, 360px wide (phone: full width minus 32), radius 10.
- Desktop position: bottom-left of the content column, 16px above the status bar. Phone position: 8px above the tab bar.
- At most 2 visible. The oldest leaves first.
- Auto-dismiss at 6s, paused on hover or focus within. Error toasts persist. Close button: 40px, `aria-label="Dismiss"`.
- Content: title `t-small` 600, body `t-small` ink-2, an optional link ("View in journal"). Losses appear as Delta. Nova-related toasts ("Mission done") show the pencil tick before the title. Other toasts show no mark and no colored dot.
- `role="status"` and `aria-live="polite"`. Errors use `role="alert"`.
- Copy pattern: title = what happened, body = the numbers. "Stop-loss filled" / "Sold 5 AMD at $210.05. Realized ▼ −$6.25."

### 8.11 Dialogs (consent gate, AI notice, confirmations, phone menu, paywall dialog)

- Level-2 sheet, max 480px, radius 10. Scrim: `color-mix(in oklab, var(--ink) 40%, transparent)` with no blur.
- Title `t-h2`, body `t-body`. Actions right-aligned (full-width stack on phone), the primary last.
- Focus is trapped, Escape closes (except the consent gate, which can't be dismissed), and focus returns to the trigger. The existing `dialog.tsx` already does this, so restyle it only.

### 8.12 Paywall and pricing (Task 10)

**Inline paywall** (replacing locked content, never covering the whole page):

```
─────────────────────────────────────────────────────────
[Premium]  The interactive tools are part of Premium
You've read the first section of this lesson. Premium includes all 19 lessons,
the interactive tools, unlimited coach messages and the journal's pattern analysis.
[See plans]   Not now
─────────────────────────────────────────────────────────
```

- A ruled band (rules above and below), not a card. Tag plus `t-h3` title plus one or two sentences plus primary "See plans" plus quiet "Not now". No lock icons, no blur, no countdowns, no "You're missing out".
- Free counters are plain text near the action: "8 of 10 free trades left today", "3 of 10 free messages left today".

**Pricing / Upgrade:** a comparison ledger, not three cards.

```
                       Free            Premium [Most popular]     Elite
Price                  $0              $30 a month                $60 a month
                       [Current plan]  [Preview Premium]          [Preview Elite]
                       ...             Billed monthly. Renews automatically until you cancel.
                                       Cancel anytime in Settings.   (under EVERY purchase button)
─────────────────────────────────────────────────────────────────────────────
Trades per day         10              Unlimited                  Unlimited
Lessons                Modules 1–2     All 19                     All 19
Interactive tools      —               ✓                          ✓
...
Weekly debrief         —               —                          ✓
```

- Ticks are **ink** (system facts, not Nova's marks). "—" means not included, with sr text "Not included".
- On phone, a plan selector (radiogroup: Free, Premium, Elite) shows one column at a time with the renewal text under its button.
- Test-mode dialog: "Payments aren't live yet. You can preview this plan in test mode at no charge." Buttons: "Preview Premium" and "Cancel".

### 8.13 Empty states

Empty is an invitation to act. Show the empty **ledger itself** (the real column headers and two blank ruled rows), then one sentence and one button.

| Place | Copy | Action |
|---|---|---|
| Positions | "No positions yet. Your first buy will be recorded here." | "Find a stock" goes to /markets |
| Open orders | Hidden when empty | |
| Journal | "Your record starts with your first trade. Every trade you place is checked and filed here." | "Place your first trade" goes to /markets |
| Coach | "Ask Nova about a trade, a term, or your last mistake." plus 4 suggestions as a plain list | |
| Community, filtered | "No posts here yet. Write the first one." | focuses the composer |
| Equity chart (no data) | "The chart fills in as prices update." | |
| Search, no results | "No match for 'xyz'. Try a symbol like NVDA or a name like Apple." | |

### 8.14 Other recurring pieces

- **Avatars:** 32px circles, `--well` fill, ink initials in Archivo 600. No gradients. Nova's avatar is a pencil-bordered circle with a pencil "N", used only where people have avatars (community, chat).
- **News row:** symbol tag, headline (`t-body` ink), then `t-micro` muted line "Simulated. 14 min ago. Analyst note." Impact appears as a Delta. Link: "How news moves prices".
- **Course row:** a check cell (pencil tick when done), lesson title (`t-body` 500), one-line description (`t-small` ink-2), minutes (`t-micro` muted, right). The "Up next" row gets a 2px ink bar on the left plus the text "Up next". Locked rows carry a "Premium" tag, no lock icon.
- **Mission row:** a check cell (Nova verifies these, so the tick is pencil), title, XP on the right as "40 XP" in muted. Done rows stay in ink-2, never struck through.
- **Quiz option:** a 48px row, radius 6, 1px `--edge`, with a letter key in a 24px box. Selected uses an ink fill on the key and an ink border. After checking: correct gets a pencil tick plus "Correct", incorrect gets a red cross plus "Not quite. The answer is B, 100 shares." Keep `fieldset` and `button` (verify).
- **Level / XP:** one text line plus a 2px ink progress rule on a `--rule` track: "Level 3, Trader. 355 XP to Level 4." Appears on Learn and Home only, not in the shell.

---

## 9. Iconography

**Policy: words first. Marks are drawn by us. Icons only where a word would be worse.**

- **Allowed icons (Lucide, strokeWidth 1.5, 16 or 20px, ink-2):** Search (magnifier), Close (×), and the chevron on disclosures (`details` summary). That's all.
- **Custom inline SVG (`marks.tsx`):** check cell, tick, query, cross, score loop, gain and loss triangles, chart markers, the 50-day line swatch.
- **Banned:** Sparkles (and any "AI magic" glyph), icons in navigation, icons in tinted squares, icons before section titles, decorative lightbulbs, trophies, targets, stars (watchlist becomes a "Watch" / "Watching" text toggle with `aria-pressed`), arrows after link text, emoji in UI and seed content.
- Icon-only buttons always have `aria-label` and a 40px hit area.

---

## 10. Motion and the motion stack

### 10.1 Rules (bind every animation)

1. **Motion answers an action or carries data.** The single exception is the landing hero moment (§10.4).
2. **No decorative entrances:** no fade-up on sections, no staggered card entrances, no hover lifts, no perpetual animation, no parallax. At most **one** in-view reveal in the whole product (the landing's record example, §10.3).
3. **Reduced motion everywhere.** Wrap the app and landing in `<MotionConfig reducedMotion="user">`. This turns off transform and layout animations for users who ask. Components that animate other properties (pathLength, numbers, opacity, height) also check `useReducedMotion()` and jump to the final state. GSAP runs inside `gsap.matchMedia()` under `(prefers-reduced-motion: no-preference)` only. The global CSS reduced-motion reset stays as a backstop.
4. **Timing:** UI responses take 120–220ms, draws ≤ 480ms, the hero ≤ 2.4s in total. Easing for enters and draws is `[0.2, 0.7, 0.3, 1]`. Springs are used only for animated numbers and the hero tilt.
5. **Lean bundle:** Motion loads through `LazyMotion` with `m` components from `motion/react-m`, with features loaded asynchronously (`domMax`, needed for `layoutId`). GSAP is imported dynamically **on `/` only**, after hydration, and never ships to app routes.
6. **Charts don't animate.** No draw-ins and no tweened axes. The crosshair follows the pointer directly. Charts stay custom SVG validated with dataviz (§8.9).
7. **Prices in lists don't animate.** Table cells update in place. Only the three readouts listed below tween.

### 10.2 Tools: what is allowed where

| Tool | Package / source | Allowed for | Not allowed |
|---|---|---|---|
| **Motion** | `motion@14.14.0` (already in `package.json`, not yet used) | All in-app motion in §10.3, plus the in-view reveal and hero tilt on the landing page | Section entrances, hover effects on rows or cards |
| **Motion Primitives** (motion-primitives.com) | Patterns built on Motion: Animated Number, Transition Panel, In View, Tilt, plus a sliding indicator built on `layoutId`. In Phase 2, first try to fetch the registry JSON (`https://motion-primitives.com/c/<name>.json`). If the proxy blocks it, re-implement the equivalents in `src/components/motion/`. If source is copied, keep its MIT notice in a header comment and restyle it to our tokens. | Only the components mapped in §10.3 | Text shimmer, glow, spotlight, morphing dialogs, infinite sliders, cursor effects |
| **GSAP** | `gsap@3.15.1` (free "standard no-charge" license; SplitText and DrawSVGPlugin ship in the package, verified in the tarball). `@gsap/react` is **not** needed (see §10.4). | **Only** the landing hero timeline (§10.4) | Anywhere else, including the app shell, the ticket, charts, other landing sections, public lessons and tools |
| **21st.dev** | Free components only, as source or reference. Check each component's license (MIT or similar) before copying and note the source in a header comment. | Structural references (for example accessible tabs, a command menu) and re-skinned free code | Paid or "pro" components, and their look as-is |
| **Watermelon UI, Coconut UI, 3ui** | Layout reference only | Studying spacing, density and composition | Copying any code, markup, copy or assets, or cloning templates (legal risk) |
| **Anime.js** | Not added | | It duplicates GSAP |

### 10.3 Component-by-component motion map

| Component | File (Phase 2) | Tool / primitive | Behavior | Reduced motion |
|---|---|---|---|---|
| Landing hero headline and example ticket | `src/components/landing/hero-motion.tsx` (client, renders no markup) | **GSAP** timeline (SplitText, DrawSVGPlugin) | §10.4 | No timeline. The final state is the server-rendered markup. |
| Landing hero ticket tilt (the signature element only) | `src/components/motion/tilt.tsx` | Motion `useSpring` (Tilt pattern) | At most 2.5° rotateX/Y following the pointer inside the ticket, only on `(hover: hover) and (pointer: fine)`, spring stiffness 150 and damping 20, resets on pointer leave. Not magnetic, no glare. | Off |
| Landing "Your record shows the pattern" example (the one in-view reveal) | `src/components/landing/record-example.tsx` | Motion `useInView({ once: true, amount: 0.6 })` with `m.path` pathLength | Ticks draw column by column (Reason, then Stop, and so on), 160ms per column. The empty Stop cells are the point the example makes. | Final state |
| Home account value | `src/components/motion/animated-number.tsx` | Motion `useSpring` + `useTransform` (Animated Number pattern) | Springs between values (stiffness 280, damping 32, about 300ms). Tabular figures, formatted every frame with `Intl.NumberFormat`, cents in ink-2. No color flash. | Shows the new value at once |
| Symbol price readout | same | Animated Number | Same spring on each 2-second tick | At once |
| Score number (ticket summary as checks change, review header on arrival) | same plus `ScoreLoop` | Animated Number plus `m.path` pathLength | Number tweens to the new score. The loop draws (0 to 1, 360ms) only when a review first arrives, never on re-render. | At once |
| Pre-flight margin cells | `src/components/marks.tsx` `CheckCell` | `m.path` pathLength | The tick draws 0 to 1 in 160ms when `ok` flips true. Clearing is instant. | At once |
| Ticket sections (switching to Sell hides Stop, Risk and Target; Limit or Stop reveals the trigger price) | `src/components/motion/transition-panel.tsx` | `AnimatePresence` + height auto (Transition Panel pattern) | Height and opacity, 180ms | At once |
| Radio groups (Buy/Sell, order type, ranges, theme) and tabs (Community, Journal filters) and the desktop nav's active rule | `src/components/motion/sliding-indicator.tsx` | Shared `layoutId` | The ink fill (radios) or 2px ink underline (tabs, nav) slides to the selected option, 200ms | Jumps (via MotionConfig) |
| Community tab panels, Journal history filter results | Transition Panel | `AnimatePresence mode="popLayout"` | Cross-fade 160ms, no slide | At once |
| Onboarding steps 1 to 3 | Transition Panel (direction-aware) | `AnimatePresence custom={direction}` | 12px horizontal offset plus opacity, 200ms, direction follows Continue or Back | Opacity only, 0ms |
| Toasts | `src/components/ui.tsx` `Toaster` | `AnimatePresence` + `layout` | Opacity plus 4px y, 140ms in and 120ms out. The stack reflows with `layout`. | At once |
| Dialogs, consent gate, AI notice, phone Menu, search results | `src/components/dialog.tsx` | `AnimatePresence` | Opacity 120ms on scrim and sheet. The sheet doesn't scale. | At once |
| Disclosures ("Show table", journal row to compact review) | Transition Panel | height auto | 180ms | At once |
| Charts, sparklines, table prices, the top-bar account readout | none | | No animation | |

### 10.4 The one orchestrated moment: Nova marks the example ticket (landing hero, GSAP)

**Markup** is server-rendered in `src/app/page.tsx` in its final state: headline, subhead, buttons, the example ticket with all five ticks and the score loop present. Hooks: `data-hero-line`, `data-hero-tick="1..5"`, `data-hero-loop`, `data-hero-note`.

**No flash of the final state:** an inline script placed just before the hero sets `document.documentElement.dataset.hero = "pending"`, but only when `matchMedia("(prefers-reduced-motion: no-preference)").matches`. CSS under `[data-hero="pending"]` hides the hero lines (`visibility: hidden`) and sets the tick and loop paths to `stroke-dashoffset: 1`. The same script sets a **1500ms safety timer** that removes the attribute if the timeline hasn't started, so content is never stuck hidden if GSAP fails to load.

**`hero-motion.tsx`** (client, `"use client"`, returns `null`), in `useEffect`:
1. `const [{ gsap }, { SplitText }, { DrawSVGPlugin }] = await Promise.all([import("gsap"), import("gsap/SplitText"), import("gsap/DrawSVGPlugin")])`, then `gsap.registerPlugin(SplitText, DrawSVGPlugin)`.
2. `const mm = gsap.matchMedia(); mm.add("(prefers-reduced-motion: no-preference)", () => { /* timeline */ })`. Clear the safety timer and `data-hero` when it starts. Call `mm.revert()` on unmount.
3. The timeline:

| t (ms) | Tween |
|---|---|
| 0 | `SplitText` on the h1 by **lines** (not characters), `mask: "lines"`. Each line moves from `yPercent: 100` to `0`, 520ms, `power3.out`, stagger 90ms. |
| 250 | Subhead and buttons: opacity 0 to 1, 240ms (no movement) |
| 600 | Tick 1 (Reason): `drawSVG: "0%"` to `"100%"`, 220ms, `power2.out` |
| 760, 920, 1080, 1240 | Ticks 2–5, the same tween (160ms stagger) |
| 1540 | Score loop: `drawSVG` 0 to 100%, 480ms, `power2.inOut` |
| 2060 | Nova's margin note: opacity 0 to 1, 200ms |
| ≈ 2260 | Done. `SplitText.revert()` restores the original h1 markup for screen readers and selection. |

Accessibility: the h1 keeps its full text (SplitText's `aria` option is on by default, and we revert after the run). The timeline runs once per page load and never loops. Nothing else on the page moves until the user acts, apart from the one in-view reveal.

**Removed:** the perpetual ping dot, red/green price flashes on every tick, pulse skeletons, bouncing typing dots, transition-all on cards, scale on checkboxes. The "simulated" status is a tag, not a heartbeat.

---

## 11. Copy voice

**Voice:** a calm desk supervisor who's also a good teacher. Specific, numeric, short. Encouraging through precision, not praise. Nova speaks in the first person only in chat and margin notes. The interface speaks in plain imperatives.

**Rules**
1. Numbers first: "You risked 1.00%", not "Great job managing risk!"
2. Buttons say exactly what happens, and the result echoes the verb: "Buy 10 NVDA" leads to "Bought 10 NVDA", "Share to community" leads to "Shared to community".
3. Errors say what happened and how to fix it, with the numbers. They never apologize.
4. No hype, no "level up", no "future-you", no "in your corner", no exclamation marks, no emoji.
5. Say "practice money" and "practice trade" in UI. Explain "paper trading" once, in the course.
6. Vocabulary is fixed: Buy/Bought, Sell/Sold, Stop-loss, Take-profit (the order) and target (its price), Process score (the 0–100 number), Pre-flight check (the five checks before an order), Coach review, Nova (always with "AI coach").
7. Legal phrasing is never softened: "Simulated prices and news. Educational only, not investment advice."

### Before and after

| Where | Before | After |
|---|---|---|
| Landing hero | "Learn the market with a coach in your corner." (second line orange) | "Practice the market before it counts." (`BRAND.tagline`, one color) |
| Landing badge | "AI-coached paper trading" pill with a sparkle | Removed |
| Landing subhead | "Paper trade a live market, get instant AI feedback on every decision…" | "Trade a simulated market with $100,000 in practice money. Nova, an AI coach, checks every trade for the five habits that keep beginners in the game." |
| Landing CTA | "Start with $100k paper money →" | "Start with $100,000 in practice money" |
| Landing small print | "Free · no sign-up needed to try · not financial advice" | "Free to start. Prices are simulated. Nothing here is investment advice." |
| Landing closer | "Your first trade is on us." | Removed (the hero CTA repeats in the footer) |
| Home title | "Good morning / Alex's portfolio" | "Alex's practice account" |
| Home readout label | "Total value" | "Account value" (update verify, §13) |
| Nova brief | "Coach Nova's brief" / "Decide now where you'd admit you're wrong. Future-you will thank you." / "Add a plan →" | "Nova's notes" / "TSLA and KO have no stop-loss. Pick the price where your reason stops being true and put the stop there." / "Set a stop on TSLA" |
| Review byline | "Nova, rules engine" | "Nova" + [AI coach] + "Checked with the built-in playbook." |
| Review headline (prompt and offline templates) | "Disciplined — exit on AMD" | "Your AMD exit went to plan" |
| Coach header (offline) | "Offline mode · add an API key for full AI coaching" | "Offline playbook. Answers come from built-in rules, and nothing is sent to an AI service." |
| Coach empty | "Hey Alex, what are we working on?" | "Ask Nova about a trade, a term, or your last mistake." |
| Coach offline reply tail | "Offline coach mode — add an Anthropic API key… (User: Alex · experience: some…)" | Removed entirely |
| Toast | "Stop-loss filled · AMD" / "Sold 5 @ $210.05 · -$6.25" | "Stop-loss filled" / "Sold 5 AMD at $210.05. Realized ▼ −$6.25." |
| News link | "Why this moves stocks →" | "How news moves prices" |
| Path meta | "Lv 3 · 445 XP" / "Trader · 355 XP to next level" | "Level 3, Trader. 355 XP to Level 4." |
| Up next | "Up next · 4 min" | "Up next" (label) and "4 min" (separate, right-aligned) |
| Lesson label | "KEY TAKEAWAYS" | "What to remember" |
| Mission | "PRACTICE MISSION · +50 XP" | "Practice this in the simulator" and "50 XP" |
| Learn hero | "The Vantage course" / "From zero to a real trading plan." | h1 "Course", subtitle "19 short lessons. Each one ends with something to try in the simulator." |
| Quiz disabled | (no reason) | "Answer both questions to check." |
| Ticket error | "Order rejected." | "Not enough cash. This order costs $19,955.50 and you have $12,040.00. Lower the shares or press Max." (keeps "Not enough cash") |
| Sell error | (store text) | "You only hold 50 TSLA. Sell 50 or fewer." (keeps "only hold") |
| Composer | "Share a trade idea, a question or a lesson…" | "Write a post. A trade idea, a question, or something you learned." |
| Empty positions | "No positions yet. Start with SPY, the whole market in one trade." | "No positions yet. Your first buy will be recorded here." + "Find a stock" |

---

## 12. Page-by-page wireframes

Conventions: `║║` is Nova's blue double margin rule, `☑` a pencil-ticked cell, `☐` an empty cell, `(92)` the score loop, `▲`/`▼` the SVG triangles, `[Text]` a button or tag, `═══` a total's double rule, `───` a ledger rule. Desktop frames are drawn at 1440px (content 1200px). Phone frames are 390px.

### 12.0 Shell (all app pages)

Desktop:
```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Vantage   Home  Markets  Learn  Coach  Community  Journal     [⌕ Search stocks  ⌘K]  $100,150.47 ▲ +0.15% │
│           ────                                                                                 │ active = ink rule
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                     (page content, max 1200)                                   │
│                                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Simulated] Simulated prices and news. Educational only, not investment advice.  Terms  Privacy  Disclaimer │ Settings  Theme │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```
Phone:
```
┌────────────────────────────────────┐
│ Vantage [Simulated]       ⌕   Menu │ 56px
├────────────────────────────────────┤
│ (page)                             │
│ …                                  │
│ Simulated prices and news.         │ page footer
│ Educational only, not investment   │
│ advice.  Terms  Privacy  Disclaimer│
├────────────────────────────────────┤
│Home Markets Learn Coach Community Journal│ text tabs, 56px
└────────────────────────────────────┘
Menu (dialog):  Account value $100,150.47 ▲ +0.15%
                Settings
                Theme  (System) Light  Dark
                Simulated prices and news. Educational only, not investment advice.
                Terms   Privacy   Disclaimer
                [Close]
```

### 12.1 Landing (`/`, public, server component)

Desktop:
```
Vantage                                                            Course   Pricing   [Open the app]
──────────────────────────────────────────────────────────────────────────────────────────────────
Practice the market                                    ┌ [Example] ───────────────────────────┐
before it counts.                                      │ Buy NVDA                    $186.52  │
(t-hero, 72, Archivo 125%, ink, left)                  │ ☑ Why: AI data-center demand keeps   │
                                                       │     rising; I'm wrong below $177.    │
Trade a simulated market with $100,000 in practice     │ ☑ Stop-loss  $177.20                 │
money. Nova, an AI coach, checks every trade for the   │ ☑ Shares 107. Risk if stopped 1.0%   │
five habits that keep beginners in the game.           │ ☑ Take-profit $208.90  2.4 : 1       │
                                                       │ ☑ Order value 19.9% of account       │
[Start with $100,000 in practice money]  See the course│══════════════════════════════════════│
Free to start. Prices are simulated. Nothing here is   │ Pre-flight check  5 of 5 complete (92)│
investment advice.                                     │ ║║ Nova [AI coach]                    │
                                                       │ ║║ Risk is 0.9% and the target is     │
                                                       │ ║║ 2.4 times the risk. That's a plan. │
                                                       └──────────────────────────────────────┘
                                                        (GSAP, once: headline lines rise, ticks draw
                                                         1→5, the loop draws, the note appears. §10.4.
                                                         Ticket tilts ≤ 2.5° under a fine pointer.)
──────────────────────────────────────────────────────────────────────────────────────────────────
Every trade gets the same five checks
   ☑ Reason          ☑ Stop             ☑ Risk               ☑ Target            ☑ Size
   Write why you're  Decide where you   Lose no more than    Aim to win at least Keep one stock under
   buying and what   get out before     2% of the account    twice what you risk 25% of the account
   proves you wrong  you get in         if the stop hits
──────────────────────────────────────────────────────────────────────────────────────────────────
Nova writes back                                   │ Your record shows the pattern          [Example]
║║ Nova [AI coach]                    [Example]    │ Trade             R  S  R  T  S   Score
║║ You bought TSLA after a 7% jump with no stop    │ Buy NVDA          ☑  ☑  ☑  ☑  ☑   (98)
║║ and 30% of your account in it. That's three     │ Buy TSLA          ☑  ☐  ☐  ☐  ☐   (31)
║║ risks at once. Next time, set the stop first.   │ Buy KO            ☑  ☑  ☑  ☐  ☑   (74)
║║ Lesson: Stop-losses                             │ ─────────────────────────────────────
                                                   │ Checks kept       3  2  2  1  2   of 3
                                                   │ ══════════════════════════════════════
──────────────────────────────────────────────────────────────────────────────────────────────────
A course that follows your mistakes                                         [See the course]
1  Market foundations      ☑ What a stock really is   ☑ How the market moves   ☐ Order types
2  Risk first              Up next: Stop-losses, 5 min
──────────────────────────────────────────────────────────────────────────────────────────────────
Vantage    Simulated prices and news. Educational only, not investment advice.
           Terms  Privacy  Disclaimer  Community guidelines  Copyright  Accessibility
```
Phone (390): the headline (40px) is followed by the subhead, a full-width primary button, the "See the course" link and the small print. The example ticket comes next, full width (the motion still plays). The five checks stack as rows (cell, word, one line). The "Nova writes back" and "record" examples stack, with the record table showing four columns: Trade, strip (compact), Score. The course slice and footer follow.

All example content carries the "Example" tag (legal). No feature cards, no numbered steps (the five checks are labeled by name, not numbers), no closing CTA card.

### 12.2 Home (`/dashboard`)

Desktop (ledger 8 + margin 4):
```
Alex's practice account                                              ║║ Nova's notes
(t-title)                                                            ║║ Nova [AI coach]
                                                                     ║║ TSLA and KO have no stop-loss.
Account value                                    S&P 500 today       ║║ Pick the price where your reason
$100,150.47                                      ▼ −0.79%            ║║ stops being true and put the
▲ +$150.47  ▲ +0.15%  since you started                              ║║ stop there.
[equity line, teal, no fill ─────────────────────────────── $100,200]║║ Set a stop on TSLA
[Starting balance $100,000 ─────────────────────────────── $100,000] ║║
                                                                     ║║ KO is 41% of your account.
Cash        │ Invested   │ Open P&L    │ Realized P&L │ Avg score    ║║ One headline could sink the
$58,995     │ $41,155    │ ▲ +$161.52  │ ▼ −$11.05    │ (65)         ║║ month. Lesson: Position sizing
                                                                     ║║
Positions                                                [Trade]     ║║ Up next
──────────────────────────────────────────────────────────────────── ║║ ☐ Stop-losses: decide where
Symbol        Today      Shares   Avg cost    Price      Value     P&L║║   you're wrong        5 min
NVDA NVIDIA   ~~~~~~~     107     $186.54   $187.50   $20,063  ▲ +$102.72║║ Level 3, Trader.
TSLA Tesla    ~~~~~~~      50     $406.71   $407.92   $20,396  ▲ +$60.50 ║║ 355 XP to Level 4. ──────
KO Coca-Cola  ~~~~~~~      10      $69.86    $69.69      $697  ▼ −$1.70  ║║
──────────────────────────────────────────────────────────────────── ║║ Missions
Total                                                 $41,156  ▲ +$161.52║║ ☑ Place your first trade 40 XP
═════════════════════════════════════════════════════════════════════║║ ☐ Hold 3 different sectors 60 XP
Open orders                                                          ║║
Stop-loss    Sell 107 NVDA at $177.17      now $187.50     [Cancel]  ║║ (margin ends; news continues
Take-profit  Sell 107 NVDA at $216.34      now $187.50     [Cancel]  ║║  below in the right column,
                                                                     ║║  single rule, not Nova)
Latest review                                                        │ Market news [Simulated]
──────────────────────────────────────────────────────────────────── │ LLY  Eli Lilly cut to Neutral
(coach review, §8.8)                                                 │      ▼ −4.20%  7 min ago
Recent trades                                         See journal    │ …
Buy 5 AMD at $211.30           ☑☑☑☑☑ (82)                           │
Sell 30 TSLA at $406.55        ☑☐☐☐☑ (64)   ▼ −$4.80               │
```
Phone: title (30), readout (36), delta, chart (200px), stat row as 2×2 with rules. Then **Nova's notes** (margin rule, full width) come right after the readout, before positions, because they're the next action. Then positions as two-line rows, the total with its double rule, open orders as two-line rows with a 40px "Cancel" button, the latest review (compact), recent trades, missions and news.

"Start here" (Task 9, until the first buy with a stop) replaces the readout block for new users: h2 "Start here", three rows with check cells (pencil ticks as each happens): "Pick a stock", "Set a stop-loss with the quick buttons", "Write one sentence about why", then [Open SPY].

### 12.3 Markets (`/markets`)

Desktop:
```
Markets
Real companies, simulated prices. Prices update every 2 seconds, and the simulated news moves them.

All  Watchlist  Index ETFs  Technology  Communication  Consumer  Financials  Healthcare  Energy
───                                                                       (underlined radio tabs)
Symbol  Name                Sector        Today        Price       Day change     ▾          │ Movers today
──────────────────────────────────────────────────────────────────────────────────────────  │ TSLA  ▼ −2.62%
SPY     S&P 500 ETF         Index ETF     ~~~~~~~      $676.98     ▼ −0.79%   [Watching]   │ AMD   ▼ −1.94%
QQQ     Nasdaq-100 ETF      Index ETF     ~~~~~~~      $609.80     ▼ −0.34%   [Watch]      │ V     ▼ −1.35%
AAPL    Apple               Technology    ~~~~~~~      $251.53     ▲ +1.30%   [Watching]   │ AAPL  ▲ +1.30%
… 18 rows, 44px each, all visible at 1440×1000 …                                            │
                                                                                            │ Headlines [Simulated]
                                                                                            │ …
```
Phone: the title, the filter tabs in their own horizontal scroller (a `min-w-0` container, so the page never scrolls sideways), then 52px two-line rows: `SPY / S&P 500 ETF` on the left, `$676.98 / ▼ −0.79%` on the right, a 64px sparkline between them. The Watch toggle moves to the symbol page. Movers become a single line above the list: "Biggest moves: TSLA ▼ −2.62%, AMD ▼ −1.94%, AAPL ▲ +1.30%". Headlines go below the list.

### 12.4 Symbol + order ticket (`/markets/[symbol]`)

Desktop (content 8 + slip 4):
```
Markets /                                                           ┌ ticket sheet, sticky ─────────────┐
NVDA  NVIDIA                                      [Watching]        │ (§8.7 in full)                    │
(t-title 48)                                                        │ Buy NVDA                 $187.50  │
$187.50                                                             │ [ Buy | Sell ]                    │
▲ +$1.00  ▲ +1.05%  today                                           │ (Market) Limit      Cash $58,995  │
1D  1M  3M  1Y                       ☐ Show 50-day average          │ ☐ Why are you making this trade?  │
[ NVDA ── 50-day average ── ]  (legend, only when overlay is on)    │ ☐ Stop-loss                       │
[price line teal ──────────────────────────────── $188]             │ ☐ Shares … Size by risk …         │
[Previous close $186.50 ───────────────────────── $186]             │ ☐ Take-profit                     │
[▲ buy marker]                                    $184              │ ☑ Order value … % of account      │
9:30            11:00            12:30            14:00             │ Pre-flight check 1 of 5 complete  │
Show table                                                          │ ☐☐☐☐☑                    (32)     │
                                                                    │ [Buy 10 NVDA]                     │
Coach review   (your last NVDA trade, or the one just placed)       │ Practice trade. Simulated prices, │
──────────────────────────────────────────────────────────────────  │ no real money.                    │
(§8.8)                                                              └───────────────────────────────────┘
About NVIDIA                         │ Your position
───────────────────────────────────  │ ─────────────────────────────
Designs the GPUs that power most AI  │ Shares 107     Avg cost $186.54
training. High growth, high swings.  │ Value $20,062.50   ▲ +$102.72
Sector Technology   Market cap $4.50T│ News [Simulated]
P/E ratio 48        Dividend None    │ NVIDIA cut to Neutral …
Beta 1.70           50-day avg $155.07│
Volatility: very high. Can move 5% or more in a day. Trading above its 50-day average.
```
Definitions are a `dl` in two columns. Terms that have a lesson (P/E ratio, Beta, 50-day avg) are underlined ink links.

Phone order: back link, title row, price readout, range radios, chart (220px), **the ticket** (full width, sheet), then the coach review, about, position, news. The submit button is 48px full width. Quick-set rows wrap at 390 (−3/−5/−8 on one line, the three "% of account" buttons on the next).

### 12.5 Learn (`/learn`)

Desktop (map 8 + margin 4):
```
Course                                                               ║║ Your plan  (Elite: personal plan)
19 short lessons. Each one ends with something to try in the         ║║ Nova [AI coach]
simulator.                                                           ║║ You skipped the stop on 3 of
1 of 19 lessons done.  445 XP.  Level 3, Trader.  Active 1 day.      ║║ your last 5 buys. Start with
                                                                     ║║ Stop-losses.
1  Market foundations                                    1 of 3      ║║
──────────────────────────────────────────────────────────────────── ║║ Missions
☑  What a stock really is                                    4 min   ║║ ☑ Place your first trade  40 XP
   A share is a slice of a real business.                            ║║ ☑ Protect a trade with a
☐  How the market moves                                      5 min   ║║   stop-loss               50 XP
   Bid, ask, volatility and why everything falls at once.            ║║ ☐ Hold 3 different sectors
☐  Order types that protect you                              5 min   ║║                           60 XP
                                                                     ║║
2  Risk first                                            1 of 4      ║║
──────────────────────────────────────────────────────────────────── ║║
☑  Position sizing: the 1–2% rule                            6 min   ║║
▌☐ Stop-losses: decide where you're wrong   Up next          5 min   ║║
☐  Reward-to-risk                                            4 min   ║║
…
3  Reading charts   [Premium]                                0 of 3
☐  Trends: higher highs, higher lows          [Premium]      4 min   (row opens preview + paywall)
```
The modules really are a sequence, so they're numbered (1–6). Lessons aren't numbered (the check cell shows status). Stats are one inline sentence, not boxes. Missions are Nova-verified (pencil ticks).

Phone: same order. Missions follow the map, and the plan note (if any) comes first.

### 12.6 Lesson (`/learn/[slug]`)

Desktop (prose column 8, centered within the 12-column grid's left 8 + margin 4):
```
Course / Risk first
Position sizing: the 1–2% rule                                      ║║ Nova's tip
(t-title)                                                           ║║ Nova [AI coach]
Lesson 4 of 19.  6 min.  ☑ Completed                                ║║ The ticket does this math for
                                                                    ║║ you. Set a stop and it shows
Survive first                                       (t-h2)          ║║ your risk as you type.
Lose 50% and you need a 100% gain to get back to even…              ║║
(Literata 18/29, 66ch)                                              ║║
                                                                    ║║
┌ well ──────────────────────────────────────────┐
│ Shares = (Account × Risk %) ÷ (Entry − Stop)    │  formula: Archivo tnum, real × ÷ −
└────────────────────────────────────────────────┘
[Position size widget (Task 4), ruled, inputs §8.6, output readouts]

What to remember                                     (t-h3)
☑ Risk is what you lose if the stop hits.           (pencil ticks, because Nova teaches these)
☑ Risk 1–2% of your account per trade.
☑ Let the stop distance decide the share count.
Sources: …                                           (t-micro, ink-2 links)

Check your understanding                             (t-h2)
1. $50,000 account, 1% risk, entry $100, stop $95. How many shares?
   [A  50 ] [B  100 ] [C  500 ] [D  1,000 ]          (48px rows, fieldset)
2. …
[Check answers]  Answer both questions to check.

Practice this in the simulator                                 50 XP
☑ Protect a trade with a stop-loss. Place a buy with a stop-loss attached.   [Open SPY]

[Ask Nova about this lesson]                        Previous lesson   [Next lesson]
```
Phone: one column. Nova's tip moves below the first section, inside its margin rule.

### 12.7 Coach (`/coach`)

Desktop (single column, max 760, left-aligned under the title):
```
Nova  [AI coach]
(t-title)
Offline playbook. Answers come from built-in rules, and nothing is sent to an AI service.
AI coach limits and disclaimer                                 [New conversation]
──────────────────────────────────────────────────────────────────────────────
                                   ┌ well, radius 6 ─────────────────────────┐
                                   │ How do I figure out how many shares to  │  (user, Archivo 16, right)
                                   │ buy?                                    │
                                   └─────────────────────────────────────────┘
║║ Nova [AI coach]   just now
║║ Size from your stop, not your gut: shares = (account × 1%) ÷ (entry − stop).
║║ On a $100,000 account with a $5 stop distance, that's 200 shares. The ticket
║║ shows your account risk as you type. Lesson: Position sizing
──────────────────────────────────────────────────────────────────────────────
[ Message Nova                                                     ] [Send]
Nova is an AI coach. It can be wrong. Not investment advice.
(AI mode adds: Your portfolio, trades, name and messages are sent to our AI provider. Privacy policy)
3 of 10 free messages left today   (Free plan)
```
Empty state: the sentence "Ask Nova about a trade, a term, or your last mistake." then four starters as plain underlined rows ("How do I figure out how many shares to buy?" stays verbatim for verify). Streaming shows the text "Nova is writing…" with no bouncing dots.

Phone: same, with the composer fixed above the tab bar. Starter rows are 48px.

### 12.8 Community (`/community`)

Desktop (feed 8 + side 4):
```
Community
Share ideas and lessons. Ranked on process, not profit.
Feed   Leaderboard   Challenges                    (real tabs, underlined)
────                 
[Demo] Members, posts and the leaderboard are demo content until accounts launch. Your posts
and Nova's replies are real.                                          Community guidelines
──────────────────────────────────────────────────────────────────────── │ Leaderboard (top 5)
(A) [Write a post. A trade idea, a question, or something you learned.] │ 1 Maya Chen [Demo]   91
    Idea  Question  Win  Lesson   (radios)   [$ Ticker]        [Post]   │ 2 Priya Nair [Demo]  88
──────────────────────────────────────────────────────────────────────── │ …
(SO) Sam Okafor [Demo]  @samokafor  3 h ago  [Lesson]  TSLA            │ 9 You                72
Lesson learned: bought TSLA after a +7% day with no stop and 30% of my  │
account. Down 9% in an hour. Coach gave me a 31…                       │ Guidelines
☑☐☐☐☐ (31)    (shared trade strip, when attached)                      │ Share your reasoning, not
Like   Comment   Report                         (no seeded counts)      │ just your result. …
  ║║ Nova [AI coach] [AI-generated]  1 h ago
  ║║ The 31 came from three risks at once…
──────────────────────────────────────────────────────────────────────── │
```
Leaderboard tab: a ledger table (Rank, Member, Avg process score, Trades), every seeded row tagged "Demo", and the "You" row on `--well`. Challenges tab: rows with title, the rule in one sentence, dates, and [Join] (Premium on Free, with the tag). No participant counts.

Phone: one column. The side content follows the feed under the tabs (Leaderboard and Guidelines are reachable by tab and link). Action buttons are 40px.

### 12.9 Journal (`/journal`)

Desktop:
```
Journal
Every trade you place, checked and filed.

Trades 12 │ Closed 5 │ Win rate 60% │ Realized P&L ▼ −$11.05 │ Avg process score (65)

Check record                                                      ║║ Patterns Nova sees  [Premium]
───────────────────────────────────────────────────────────────── ║║ Nova [AI coach]
Trade                    Reason Stop Risk Target Size  Score  P&L  ║║ ✕ 4 of your last 5 buys had no
Buy 107 NVDA $186.54       ☑    ☑    ☑    ☑     ☑    (98)        ║║   stop-loss. Lesson: Stop-losses
Buy 80 TSLA $406.71        ☐    ☐    ☐    ☐     ☐    (26)        ║║ ? You trade more after a loss.
Sell 30 TSLA $406.55       ☑    ⟋    ⟋    ⟋     ☑    (64) ▼ −$4.80║║   Lesson: Overtrading
Buy 10 KO $69.86           ☐    ☑    ☑    ☐     ☑    (54)        ║║
───────────────────────────────────────────────────────────────── ║║
Checks kept                9/12 7/9  7/9  4/9   11/12             ║║
═════════════════════════════════════════════════════════════════ ║║

Process score over time                │ Most common mistakes  [Premium]
[teal line, 0–100, ref line 70 "Solid"]│ No stop-loss      ████████████  6 of 12
                                       │ Thin thesis       ██████        3 of 12
                                       │ Concentrated      ████          2 of 12

Trade history              All  Buys  Sells  Auto exits        [Export CSV] [Premium]
Date   Trade   Price   Score   P&L   Reason (thesis text, wraps)
```
Check-record columns are 40px. Each cell has an sr label ("Stop-loss: not set"). Clicking a row expands the compact review. Column totals use the double rule. This table is the signature at scale: the empty columns show the habit to fix.

Phone: the stat row becomes 2×2 plus 1. The check record keeps its strip (compact cells) as one line per trade: "Buy 80 TSLA" on the left, then the strip and score loop S on the right, with P&L on a second line. Totals become a single row of five labeled counts. Charts are full width. History rows are two lines.

Empty: the check-record header with two blank ruled rows, then "Your record starts with your first trade. Every trade you place is checked and filed here." and [Place your first trade].

### 12.10 Settings (`/settings`)

Desktop (single column, max 760):
```
Settings
────────────────────────────────────────────────────────────────────
Membership                                                  (t-h2)
Plan: Free                                                [See plans]
────────────────────────────────────────────────────────────────────
Your data
Export my data          A JSON file of everything stored  [Export my data]
                        in this browser.
Delete all my data      Removes trades, lessons, posts    [Delete all my data]  (destructive)
                        and settings from this browser.
────────────────────────────────────────────────────────────────────
Practice account
Reset practice account  Back to $100,000. Your lessons     [Reset practice account]
                        and XP stay.
────────────────────────────────────────────────────────────────────
Appearance
Theme      ( System )  Light  Dark            (radiogroup "Theme", radios keep names)
────────────────────────────────────────────────────────────────────
Your invite link (Task 9)    vantage.app/?ref=alex        [Copy link]
Integrations (Task 11, owner only) …
────────────────────────────────────────────────────────────────────
Legal
Terms of service   Privacy policy   Investment and simulation disclaimer   …
```
Each row: title (`t-body` 600) and description (`t-small` ink-2) on the left, the action on the right. Phone stacks the action under the description. Dialogs: "Delete all your data?" with the "Type DELETE to confirm" field and [Delete everything] (red fill, disabled until it matches) and [Cancel]. "Reset your practice account?" with [Reset account]. Every label is unchanged from 99a267e.

### 12.11 Legal pages (`/terms`, `/privacy`, `/disclaimer`, `/community-guidelines`, `/copyright`, `/accessibility`)

Desktop:
```
Vantage                                                                    [Open the app]
───────────────────────────────────────────────────────────────────────────────────────────
Legal pages                     Terms of service
Terms of service      ▌         (t-title 48)
Privacy policy                  Last updated November 24, 2026. Version 2026-11-24.
Investment and simulation       ┌ well ─────────────────────────────────────────────┐
  disclaimer                    │ In plain language                                 │
Community guidelines            │ Vantage is a practice simulator…                  │
Copyright and DMCA policy       └───────────────────────────────────────────────────┘
Accessibility statement         1. Who we are                                 (t-h2, anchor)
                                Literata 18/29, 66ch …
                                ─────────────────────────────────────────────────────
                                Simulated prices and news. Educational only, not
                                investment advice.
```
The nav is a `nav[aria-label="Legal pages"]` with six links (unchanged). The active one gets the 2px ink bar on the left and `aria-current`. Legal h2 headings may be numbered because they are a real sequence of clauses. Tables in policies use the ledger table style and wrap in their own scroller.

Phone: brand header, then the legal nav as a horizontal scroller inside its own `min-w-0` container (current behavior), then the article. The footer disclaimer and links come at the end.

### 12.12 Onboarding with consent, ConsentGate, AI notice

Onboarding dialog (level-2 sheet, 480px):
```
Nova [AI coach]                                                  Step 1 of 3
Welcome to Vantage. You have $100,000 in practice money.          (t-h2, keep "Welcome to Vantage")
I'm Nova, your AI coach. I check every trade you make and point you to the lesson that
helps. What should I call you?
[ Your first name                         ]
☐ I'm 18 or older and I agree to the Terms of Service and Privacy Policy. I understand
  Vantage is an educational simulator, not investment advice.      (ink checkbox, links open new tab)
Skip                                                                  [Continue]
```
- Skip and Continue stay disabled until consent is ticked (current logic). Steps 2 and 3 are radiogroups of 56px options (selected: ink border plus an ink-filled key).
- ConsentGate: same sheet, title "Our terms have changed" or "Please agree to continue", the checkbox, [Agree and continue]. It can't be dismissed.
- AI notice: title "Nova uses an AI service", a short list of what's sent and to whom (Anthropic), a "Privacy Policy" link, [I understand].

### 12.13 Pricing (`/pricing`, public) and Upgrade (`/upgrade`, in app)

See §8.12. Desktop: the comparison ledger with three plan columns and the renewal disclosure under every button. Phone: plan radiogroup on top, then one column of features, with the button and disclosure for the selected plan.

### 12.14 Public lessons and tools (Task 9)

These use the landing shell (wordmark, Course, Pricing, Open the app) and the lesson layout from §12.6 without the app shell. The calculators reuse the widget styling, and each ends with "Practice this in Vantage" (primary) and the footer disclaimer. Share score page: a 1200×630 card showing wordmark, "Bought NVDA", the labeled check strip, the score loop L, the tier, and "Simulated trade. Educational only, not investment advice." No P&L.

---

## 13. Phase 2 implementation plan

Ground rules for every step:
- Each step ends with `npm run build` passing, then restarting the server (`fuser -k 3000/tcp`, never `pkill -f next-server`), then `npm start`, then `npm run verify` passing, then a screenshot review of the touched pages (light, dark, phone), then one commit with the attribution lines.
- Before step 1, re-read `scripts/verify.cjs` in full. Other engineers are editing it, and the line references below are from commit 99a267e.
- Don't change business logic in `src/store/*` or `src/lib/*`. Copy-only edits to user-visible strings in lib or store files are fine when listed here, and must keep any substring verify matches.
- Never delete a verify check. Adapt it in the same commit as the UI change.

### Step 0: baseline
- `npm run build`, restart, `npm run verify`. Record the pass count (it was 41 at Task 2 and is larger after 99a267e). Copy the screenshots to `docs/design/before/` (optional, untracked).

### Step 1: overflow bugs and the verify blind spot (one commit)
- `scripts/verify.cjs` (route loop, around line 384): measure `document.documentElement.scrollWidth - document.documentElement.clientWidth`. Optionally also assert that no element's `getBoundingClientRect().right` exceeds `clientWidth + 1`.
- Fix the causes so the hardened check passes: `dashboard/page.tsx`, `markets/page.tsx`, `markets/[symbol]/page.tsx`, `learn/page.tsx`. Give every `grid` a base `grid-cols-[minmax(0,1fr)]`, add `min-w-0` on grid and flex children, keep the filter chip row inside its own `overflow-x-auto min-w-0` box, and stop `truncate` text from sizing the track.
- Verify impact: the stricter check. Nothing else.

### Step 2: fonts and tokens, with legacy aliases (pure reskin, no markup changes)
- `package.json`: add `@fontsource-variable/archivo@^5.3.0`, `@fontsource-variable/literata@^5.3.0` and `gsap@^3.15.1` (used only in step 14). Remove `@fontsource/barlow`, `@fontsource/barlow-semi-condensed` and `@fontsource-variable/source-serif-4`. Keep `motion` (14.14.0). Don't add `@gsap/react` or `animejs`. Run `npm install`.
- `src/app/layout.tsx`: import `@fontsource-variable/archivo/wdth.css`, `@fontsource-variable/literata/opsz.css` and `@fontsource-variable/literata/opsz-italic.css`. Update `themeColor` to `#EDF1EA` / `#131C17`.
- `src/app/globals.css`: add the new tokens (§4) for light, `prefers-color-scheme: dark` (guarded with `:root:not([data-theme="light"])`) and `[data-theme="dark"]`. **Alias the legacy names** so every component keeps working:

  | Legacy | New |
  |---|---|
  | `--bg` | `var(--paper)` |
  | `--panel` | `var(--sheet)` |
  | `--panel-2` | `var(--well)` |
  | `--line` | `var(--rule)` |
  | `--line-strong` | `var(--rule-strong)` |
  | `--accent` | `var(--ink)` |
  | `--accent-ink` | `var(--on-ink)` |
  | `--accent-soft` | `var(--well)` |
  | `--coach` | `var(--pencil)` |
  | `--coach-ink` | `var(--sheet)` |
  | `--up` | `var(--gain)` |
  | `--down` | `var(--loss)` |
  | `--warn` | `var(--ink)` |
  | `--good-bg`, `--warn-bg`, `--risk-bg` | `transparent` |
  | `--series-1` / `--series-2` | new teal and ochre |
  | `--chart-surface` | `var(--paper)` |
  | `--shadow` | `var(--shadow-float)` |

  Fonts: `--font-sans: "Archivo Variable", system-ui, sans-serif`. `--font-display` is the same family (width set by the utilities). `--font-serif: "Literata Variable", Georgia, serif`. Add `@utility` classes `t-hero … t-prose` (§5.2), `font-synthesis: none`, the focus ring, and `body { background: var(--paper) }`.
- Verify impact: none. The visual impact is immediate (orange and navy disappear).

### Step 3: primitives
- New `src/components/marks.tsx`: `Tri`, `CheckCell`, `CheckStrip`, `ScoreLoop`, `Mark` (tick, query, cross), `Tag`, `NovaByline`, `NovaNote` (the margin container).
- `src/components/ui.tsx`: rewrite `Delta` (SVG triangle, U+2212, ink for gains, sr text). `LivePrice` loses the flash (keep the component and its `span.tnum`). Add `Button`, `Field` and `RadioGroup`. Rewrite `Segmented` as a radiogroup but keep a `variant="tabs"` path that emits `role="tab"` for community. Make `Avatar` flat. Restyle `Toaster` (position, max 2, auto-dismiss, pause). Export `ScoreGauge` and `ScoreRing` as aliases of `ScoreLoop` so callers compile.
- `src/store/toast.ts` may need a duration field. That's UI state, not business logic, so it's allowed.
- Verify impact: none if names are kept. Delete the `.flash-*` keyframes from globals.

### Step 3b: motion primitives (Motion, Motion Primitives patterns)
- Try fetching the Motion Primitives registry JSON for `animated-number`, `transition-panel`, `in-view` and `tilt`. If the network proxy blocks it, re-implement them (§10.3 gives each behavior).
- New `src/components/motion/`:
  - `features.ts` (`export default domMax`)
  - `provider.tsx` (`LazyMotion features={() => import("./features").then(m => m.default)} strict` + `MotionConfig reducedMotion="user"`)
  - `animated-number.tsx`
  - `transition-panel.tsx`
  - `sliding-indicator.tsx`
  - `tilt.tsx`
  - `draw-path.tsx` (an `m.path` with pathLength and a reduced-motion jump)
- Mount the provider in `AppShell` (inside `Providers`) and around the landing's tilt and in-view components. Use only `m.*` from `motion/react-m` (strict mode throws if `motion.*` sneaks in, which keeps the bundle lean).
- Wire `CheckCell` and `ScoreLoop` (step 3) to `draw-path`, and `Toaster` and `Dialog` to `AnimatePresence`.
- Verify notes: Playwright treats `opacity: 0` as visible and `click()` waits for stable elements, so 120–220ms transitions don't affect existing checks. Assertions expecting something to disappear ("Pre-flight check" after a fill) run after a 15s wait. Exit animations must unmount within 200ms. If flakiness appears, add `reducedMotion: "reduce"` to verify's browser contexts. That's a legitimate test setting, and it also exercises the reduced-motion paths.

### Step 4: shell
- `src/components/shell.tsx`: desktop top bar (§8.1), fixed status bar (the `FOOTER_DISCLAIMER` text, a `ul[aria-label="Legal"]` with exactly Terms, Privacy and Disclaimer, then Settings and the theme menu outside the list), phone header (wordmark, Simulated tag, "Search stocks" icon button, account value, text "Menu" button), `PhoneMenu` restyle (keep the Settings link, disclaimer text and the three link names), a text-only tab bar, and the page footer. Remove `TickerStrip`, `LevelReadout`, the ping dot and nav icons.
- Verify dependencies: "rail shows the simulated-data disclaimer and legal links" (desktop 1440, text plus list count 3), the phone menu check, "phone search opens and navigates" (`#ticker-search-mobile`), "phone header fits the screen", and the broken-links crawl (keep `/terms`, `/privacy`, `/disclaimer`, `/settings` links). Optionally rename the check label "rail shows…" to "status bar shows…", keeping its assertions.

### Step 5: the signature (order ticket and review card)
- `src/components/order-ticket.tsx`: the §8.7 layout. Reason first, margin cells with `role="checkbox" aria-readonly data-check-id data-ok`, the summary block with the heading "Pre-flight check" and the "N of M complete" live region, an `aria-hidden` strip, `ScoreLoop` M, and the order type as a radiogroup.
- `scripts/verify.cjs` line 139: `getByRole("tab", { name: "Limit" })` becomes `getByRole("radio", { name: "Limit" })` (same commit).
- `src/components/review-card.tsx`: §8.8. Keep the text "Coach review", the "AI coach disclaimer" link and `/coach?trade=` links. Replace the "rules engine" byline with "Nova [AI coach]" plus "Checked with the built-in playbook." for offline reviews.
- Verify dependencies: lines 84–135 (quick-set labels, `#thesis`, "Pre-flight check", "5 of 5 complete", exactly five `[role=checkbox][data-ok=true]`, `[data-check-id="stop"]`, submit labels, alert texts, "Coach review").

### Step 6: charts
- `src/components/price-chart.tsx`: §8.9 (no area fill, solid reference line with label, triangle markers, tooltip sheet, keyboard crosshair, "Show table"). Add the optional `overlay` prop with legend if Task 3 hasn't landed (then add the Task 3 check: the legend is visible after toggling at 3M). `Sparkline` in ink-2 with a prev-close hairline.
- Verify impact: none, unless the overlay is added (new check).

### Step 7: Home
- `src/app/(app)/dashboard/page.tsx`: §12.2. Rename "Total value" to "Account value", **keep the whole number (with cents nested) in the first `span.tnum`** inside the label's parent, and update verify line 207 to `text=Account value` in the same commit. Add Nova's notes in `NovaNote`, the positions ledger with a totals row, open orders, the compact review, recent trades with strips, missions, news.
- Copy-only: `useCoachBrief` strings (§11).

### Step 8: Markets and Symbol
- `markets/page.tsx` and `markets/[symbol]/page.tsx` (§12.3, §12.4). The watchlist star becomes a text toggle ("Watch" / "Watching") with `aria-pressed`. Its visible text is its name, so the old `aria-label="Toggle watchlist"` goes. Restyle `src/components/news-feed.tsx` (Simulated tag, "How news moves prices").
- Verify impact: none (the routes and ticket are unchanged).

### Step 9: Learn and Lesson
- `learn/page.tsx`, `learn/[slug]/page.tsx`, `lesson-widgets.tsx` if present (§12.5, §12.6). Keep `fieldset` > `button` for quiz options and the "Check answers" button label.
- Verify: the lesson XP check (answers by button index, so keep the option order).

### Step 10: Coach
- `coach/page.tsx` (§12.7). Keep `aria-label="Message Nova"`, the starter text "How do I figure out how many shares to buy?", the link "AI coach limits and disclaimer" pointing to `/disclaimer`, and the AI-mode notice behavior.
- Copy-only in `src/lib/offline-coach.ts`: remove the "add an Anthropic API key" tail and the context dump from user-visible replies (coordinate with the coach-ai owner and keep the logic).
- Verify: "coach replies", "coach pre-fills trade question", the coach disclaimer link check, and the AI notice checks.

### Step 11: Community
- `community/page.tsx` (§12.8). Keep `aria-label="Post text"`, the "Post" button, real tabs (Leaderboard). Add "Demo" tags on every seeded member, post and leaderboard row, keep "AI-generated" on Nova's comments, show no seeded like counts, add Report.
- Verify: "community post gets a Nova reply", "leaderboard includes you", plus any Task 8 community checks present.

### Step 12: Journal
- `journal/page.tsx` plus `src/lib/journal-stats.ts` (Task 5, if not built) with the check record (§12.9). Add `/journal` to `ROUTES` and Task 5's checks (trade count, "No stop-loss" in mistakes).

### Step 13: Settings, onboarding, consent gate, AI notice, dialog, legal layout
- `settings/page.tsx`, `onboarding.tsx`, `consent.tsx`, `ai-notice.tsx`, `dialog.tsx`, `(legal)/layout.tsx`, `legal-nav.tsx`, `legal-doc.tsx`, and the `.prose-legal` CSS (§12.10–12.12). **Every label is frozen:** "I'm 18 or older…" (with `label[for="consent"]` holding two `_blank` links to `/terms` and `/privacy`), "Continue", "Skip", "Start trading", "Agree and continue", "Nova uses an AI service", "I understand", "Privacy Policy", "Plan: Free", "Export my data", "Reset practice account", "Reset account", "Delete all my data", "Type DELETE to confirm", "Delete everything", the radios "Light", "Dark" and "System", "Welcome to Vantage", `nav[aria-label="Legal pages"]` with 6 links, h1 texts, "Last updated …".
- Verify: all consent, gate, AI notice, settings and legal checks (lines 225–352).

### Step 14: Landing
- `src/app/page.tsx` stays a server component and renders the hero in its final state (§12.1). Add the inline pending-state script and CSS (§10.4), `src/components/landing/hero-motion.tsx` (GSAP, dynamically imported, `gsap.matchMedia`, `SplitText.revert()` at the end), `record-example.tsx` (the one in-view reveal) and the `Tilt` wrapper on the example ticket. Use `BRAND.name` and `BRAND.tagline`. Tag the example content "Example", keep the footer legal links, and import no client stores.
- Bundle check: after `npm run build`, confirm `gsap` appears only in the `/` route chunks (search `.next/static/chunks` for `SplitText`; it must not be referenced from any `(app)` route). Note the First Load JS for `/` and `/dashboard` in the commit message.
- Verify: "/" renders with no overflow, the link crawl passes, and there are no console errors (GSAP plugin registration must not warn). Add a check that `/` has no `[data-hero="pending"]` attribute 3s after load (so content can never get stuck hidden).

### Step 15: Paywall and pricing (when Task 10 lands, or as specs for its builder)
- `paywall.tsx`, `pricing/page.tsx`, `upgrade/page.tsx` per §8.12. The renewal text goes under every purchase button.

### Step 16: cleanup and audit
- Remove the legacy token aliases (search for `bg-panel`, `text-up`, `accent` and replace them with new utilities), unused Lucide imports, and dead CSS.
- Run the Task 7 accessibility smoke checks (accessible names, labels, one h1 per page).
- Review every screenshot (all routes × light/dark × desktop/phone) against §15 and §14.
- Suggest to the architect (not done by the implementer) that the CLAUDE.md "Conventions" token examples be updated to the new names.

### Verify selectors and copy that this redesign touches (summary)

| Item | Action |
|---|---|
| Route overflow measurement | Changed to `scrollWidth - clientWidth` (step 1) |
| `getByRole("tab", { name: "Limit" })` | Becomes `radio` (step 5) |
| `text=Total value` + `span.tnum` | Becomes `text=Account value`, and the number stays in the first `span.tnum` (step 7) |
| "rail shows the simulated-data disclaimer…" | Assertions unchanged. Satisfied by the desktop status bar, label optionally renamed (step 4) |
| `[role="checkbox"][data-ok]`, `[data-check-id]` | Kept on the five margin cells only (step 5) |
| "Pre-flight check", "N of M complete", "Coach review" | Kept verbatim |
| Quick-set and submit labels, `#qty #stop #target #thesis #trigger` | Kept verbatim |
| "Not enough cash", "only hold" | Kept as substrings |
| All consent, settings, legal and menu labels | Kept verbatim |

---

## 14. What we removed and why

| Removed | Why |
|---|---|
| International orange accent (buttons, Buy, focus, live dot, level bars, XP) | One color doing six jobs. Orange reads as warning in a market app, and orange on navy was the second generic theme. |
| Magenta coach color and the Sparkles icon | Purple or magenta plus sparkle is the most common "AI" tell. Nova is now identified by pencil marks, the margin rule, the serif and the "AI coach" label. |
| Navy dark mode | The default fintech dark. Replaced by the green-black "night ledger". |
| Barlow, Barlow Semi Condensed, Source Serif 4 | Barlow at medium weights reads like any UI sans, and the condensed display face was the "terminal" cliché. Replaced by one width-variable family plus a reading serif. |
| The card kit: rounded panels, insets inside panels, stat tiles, bento rows | The single biggest "template" signal. Replaced by ruled ledger sections on the paper and sheets only for the ticket and floating surfaces. |
| Gradient area fills, gradient avatars, glowing CTA shadow | Decoration posing as data. Charts are line-only, avatars are flat. |
| Semicircle gauge and score ring | Generic dashboard widgets. Replaced by the pencil score loop. |
| Icons in nav, buttons and tinted squares; arrows after links | Template chrome. Words carry meaning, and the custom marks carry state. |
| Pills (buttons, chips, tags) | Pills everywhere is the SaaS default. 6px controls and 4px tags. |
| Centered hero, badge pill, accented second headline line, feature grid, 01–04 step cards, closing CTA card | The landing template. Replaced by a left-aligned hero with the real product moment (Nova marking a ticket). |
| Header ticker strip | Trading cliché and constant motion. The watchlist lives on Markets and Home. |
| Left icon rail with the level bar | The default SaaS shell. Replaced by text navigation and a status bar. XP appears where it's relevant (Learn, Home). |
| Ping dot, price flashes, pulse skeletons, bouncing dots | Perpetual motion competes with the content. One orchestrated moment and responsive motion remain. |
| Green for gains | Color shouldn't reward outcomes in a product that grades process. Gains are written in the black. |
| Uppercase eyebrows, middle-dot meta strings, em-dash labels | Copy-level template tells. |
| "Biggest movers" cards and ticker avatars | They duplicate list rows. Movers become one line. |
| Star icons for the watchlist | Icon ambiguity. Replaced by a "Watch" / "Watching" toggle. |
| Dev-facing copy ("add an API key") and the context dump in offline replies | It confuses users and leaks internals. |
| Fake like counts and emoji in seed posts | Fabricated social proof (legal) and tone. |
| Strikethrough on done missions | Reads as "cancelled". Done is a pencil tick. |
| Dashed-border empty boxes | Generic. Empty states show the empty ledger plus one action. |
| Toasts that cover the ticket and send button | They hid the product's key moment. |

---

## 15. Accessibility contract (WCAG 2.2 AA)

| Requirement | How this direction meets it |
|---|---|
| 1.4.3 Text contrast ≥ 4.5:1 | Every text token passes on every surface in both themes (§4.4). Micro text (12px) uses only ink-2 or muted, both ≥ 4.87. |
| 1.4.11 Non-text contrast ≥ 3:1 | Control borders use `--edge` (≥ 3.11). Chart series ≥ 3.28. Focus ring is ink (≥ 11.8). |
| 1.4.1 Use of color | Gains and losses use a triangle plus sign. Nova uses a byline, tag, serif and margin rule. Marks use distinct shapes (tick, ?, cross). Tiers have words. Charts have legends, direct labels and a table view. |
| 2.4.7 / 2.4.11 Focus visible, not obscured | 2px ink outline with 2px offset on everything focusable. Sticky bars get `scroll-padding-top: 72px` and `scroll-padding-bottom: 56px`, so a focused element is never hidden under the top bar, status bar or tab bar. |
| 2.5.8 Target size (minimum 24px, aim 40) | Buttons 40–48px, quick-set 40×44, tab bar items 48px tall, check-cell rows 44px, chart markers have 24px hit areas, close buttons 40px. |
| 2.3.3 / reduced motion | One landing sequence plus responsive draws, all disabled under `prefers-reduced-motion`. No perpetual animation. |
| 1.3.1 Info and relationships | Real tables with `th scope`, `dl` for definitions, radiogroups for exclusive choices, tabs only with panels, `aria-current` in nav, read-only checkbox semantics for the five ticket checks, `role="img"` with full sentences for strips and score loops. |
| 2.1.1 Keyboard | Charts are focusable with arrow-key crosshairs and a table view. Radiogroups use arrow keys. Dialogs trap and return focus. ⌘K focuses search. |
| 3.3.1 / 3.3.3 Errors | Field-level errors in red with the cross mark, `aria-invalid` and `aria-describedby`, and fix text with numbers. Ticket errors use `role="alert"`. |
| 4.1.3 Status messages | "N of M complete" is `aria-live="polite"`, toasts are `role="status"`, chart hover readouts are a throttled live region. |
| 1.4.10 Reflow (390px, no horizontal scroll) | The §6.1 overflow rule, phone table patterns, and the hardened verify check. |
| 1.4.4 Resize text | Rem-based sizes. Layouts tested at 200% zoom in step 16. |
| 2.2.1 Timing | Toasts auto-dismiss only for non-essential info (also logged in the journal), pause on hover or focus, and errors persist. |

---

## 16. Open questions for the owner

1. **Gains in ink ("in the black") instead of green.** This is a deliberate, product-specific choice (process over outcome), and it's fully accessible. If you want green gains back, it's a one-token change if Phase 2 routes gains through a `--gain` token (recommended). The green would need its own validation against the paper tint and the teal chart line.
2. **Text-only phone tab bar.** It's distinctive and fits the voice. If testing shows people miss icons, add 20px custom line icons above the labels. Never Lucide defaults.
3. **The name "Pre-flight check"** survives as plain-English feature naming (and verify depends on it). If you'd rather drop the aviation idiom, "Before you buy" is the alternative. That's a copy change plus two verify strings.
