# Vantage — project guide for Claude

AI-coached paper-trading + learning app. Next.js 15 (App Router) · TypeScript · Tailwind v4 · zustand (localStorage persistence) · Anthropic SDK (Claude Opus 5.5) for the coach.

## Agent hierarchy (token budget rules)

The main session is the **architect**: it decides scope, writes the plan, delegates, and reviews. It should not hand-write bulk code or run long verification itself.

| Agent | Model | Use for | Never use for |
|---|---|---|---|
| main session (leader) | **Opus** | Product decisions, planning, routing, reviewing every result, merges, final sign-off | Bulk code, long test loops |
| `opus-engineer` | **Opus** | **Hard tasks**: payments, auth/RLS/security, data integrity and cross-tab sync, paywall/entitlement logic, native-app architecture, gnarly merges, bugs that survived two fix rounds | Routine UI or copy |
| Opus designer | **Opus (extra-high effort)** | Visual direction, brand, page redesigns | Business logic |
| `qa-final` | **Opus** | Independent second review and ship verdict for every finished task | Editing source |
| `feature-builder` | Sonnet | Scoped features with a clear plan | Open-ended design or anything in the "hard" list |
| `ui-polisher` | Sonnet | Layout, responsive, theming fixes from screenshots | Business logic |
| `coach-ai` | Sonnet | Claude API, prompts, coach context, offline fallback | UI |
| `content-writer` | Sonnet | Lessons, quizzes, missions, community copy | Code logic |
| QA reviewer 1 | Sonnet | First review of every finished task (spec, visuals, a11y, regressions) | Editing source |
| `verifier` | Haiku | Independent build + `npm run verify` confirmation after each task | Editing source |
| built-in `Explore` | — | "Where is X?" searches | Edits |

**Routing rule:** if a task touches money, security, data integrity, payments, auth, concurrency or cross-cutting architecture, or it already failed review twice, it goes to Opus. Everything else goes to the cheapest model that can do it well.

Delegation rules that save tokens:
1. Give each agent **file paths and the exact change**, not the whole conversation. This file is their map, so don't re-explain the architecture.
2. Independent tasks run **in parallel** (e.g. `content-writer` + `ui-polisher`); dependent tasks run in sequence.
3. After any code change, send the `verifier` agent. It returns a short report; the main session opens screenshots **only** for UI changes or failures.
4. Agents return **summaries** (what changed, file:line, anything unresolved), never full file dumps.
5. One fix → one verify. Don't batch unrelated changes into one agent run.

## Sources of truth (use these; never start from scratch)
Every agent building the website or the app must reuse what already exists:
- **Design**: `docs/design/direction.md` ("Blue Pencil": tokens, type, pencil marks, components, page wireframes, motion, copy rules). It overrides any older design notes.
- **Brand**: `docs/design/brand.md` and `public/brand/` (logo, monogram, icons, OG image; regenerate with `scripts/brand/build_brand.py` + `render.cjs`). Never redraw the logo by hand.
- **Legal**: `docs/legal/research-report.md` plus the legal pages in `src/app/(legal)/` and `src/lib/legal.ts`. Keep consent, disclaimers, Demo/Example/Simulated labels and the AI data notice intact on every surface, including the app.
- **Marketing**: `docs/marketing/research-report.md` (§8 product changes, guardrails: no implied returns, no fake social proof, 18+).
- **Backend**: `docs/backend/research-report.md` (Supabase + Resend, host-agnostic, RLS on every table).
- **Plan and decisions**: `docs/plans/2026-11-24-preflight-overhaul.md` (Tasks 9–11 still to build; owner decisions: Free has 10 trades/day, Premium $30, Elite $60, honest paywalls, key-ready integrations).
- **Logic you must reuse, not reimplement**: `src/lib/analysis.ts`, `src/lib/preflight.ts`, `src/lib/money.ts` (all reward/risk comparisons), `src/store/sync.ts` + `merge.ts` (the only way to persist state), `src/lib/course.ts`.
- **Quality bar**: `npm run verify` (203+ checks) must pass, and new features add checks. Two-reviewer QA before anything counts as done. Earlier QA reports are in `.superpowers/sdd/` (local only).
- **The phone app** reuses this same codebase (installable PWA first); a native app, if built later, must share `src/lib` and `src/store` logic, the brand assets and the legal flows.

## Commands

```bash
npm run dev            # dev server on :3000
npm run build          # production build (runs tsc + eslint)
npm start              # serve the build on :3000
npm run verify         # E2E verification loop against BASE_URL (default http://localhost:3000)
```
`npm run verify` needs a running server (`npm run build && npm start`). It exits non-zero on any failure and writes screenshots (every page × dark/light × desktop/phone) to `SHOTS` (default `./verify-shots`). **If you rebuild, restart the server** (`fuser -k 3000/tcp`; never `pkill -f next-server`, which kills other agents' servers); a stale server serves old chunk hashes and every page breaks with 400s.

## Architecture map

```
src/app/page.tsx                  landing (server component)
src/app/(app)/layout.tsx          wraps app pages in <AppShell> (providers, nav, onboarding)
src/app/(app)/dashboard|markets|markets/[symbol]|learn|learn/[slug]|coach|community
src/app/api/coach/route.ts        streaming chat (GET = mode probe: "ai" | "offline")
src/app/api/review/route.ts       structured post-trade review (JSON schema output)

src/lib/market-data.ts   tickers, seeded RNG, 1y history generator, news generator
src/lib/analysis.ts      rule engine: scores every trade 0–100 + flags (feeds the AI)
src/lib/course.ts        modules, lessons, quizzes, missions, levels
src/lib/missions.ts      mission completion predicates
src/lib/coach-prompt.ts  system prompts (keep byte-stable for prompt caching), schema, model id
src/lib/coach-context.ts plain-text user snapshot sent to the coach
src/lib/offline-coach.ts rules-based review + chat fallback when no API key
src/lib/community-seed.ts demo members/posts/challenges

src/store/market.ts  live prices; tick() every 2s; persisted
src/store/app.ts     account, orders (market/limit/stop, brackets w/ OCO), trades, XP, community, chat; persisted
src/store/toast.ts

src/components/providers.tsx  market clock, fill processing, review requests, mission watcher
src/components/shell.tsx      sidebar/topbar/mobile nav, search, theme toggle
src/components/order-ticket.tsx, review-card.tsx, price-chart.tsx, ui.tsx, news-feed.tsx, onboarding.tsx
scripts/verify.cjs            the verification loop
```

## Conventions
- Client pages render only after hydration (`AppShell` gates on `useHydrated`) because state lives in localStorage.
- Colors come from CSS tokens in `globals.css` (`bg-panel`, `text-ink-2`, `text-up`, `bg-series-1`…). Never hard-code hex in components. Light and dark are both required.
- Charts follow the dataviz skill: one axis, 2px lines, a hover layer on every plot, and gains/losses shown with arrow + sign as well as color.
- Claude API: model `claude-opus-5-5` (override with `COACH_MODEL`), `fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta, `effort: "low"` for chat/reviews. Load the `claude-api` skill before changing API code.
- Every AI feature must degrade gracefully when no key is set (offline coach).
- The simulator is educational: keep "simulated prices / not financial advice" messaging intact.
- Done means: `npm run build` passes **and** `npm run verify` passes. New features add a check to `scripts/verify.cjs`.
