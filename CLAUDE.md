# Vantage — project guide for Claude

AI-coached paper-trading + learning app. Next.js 15 (App Router) · TypeScript · Tailwind v4 · zustand (localStorage persistence) · Anthropic SDK (Claude Opus 5.5) for the coach.

## Agent hierarchy (token budget rules)

The main session is the **architect**: it decides scope, writes the plan, delegates, and reviews. It should not hand-write bulk code or run long verification itself.

| Agent | Model | Use for | Never use for |
|---|---|---|---|
| main session | Opus | Product decisions, cross-cutting design, reviewing diffs, final sign-off | Routine edits, running test loops |
| `feature-builder` | Sonnet | Implementing a scoped feature or fix across named files | Open-ended design questions |
| `ui-polisher` | Sonnet | Visual/layout/responsive fixes from screenshots, design-token work, charts | Business logic |
| `coach-ai` | Sonnet | Anything touching `/api/*`, prompts, `lib/coach-*`, Claude API usage | UI |
| `content-writer` | Sonnet | Lessons, quizzes, missions, community copy (`lib/course.ts`, `lib/community-seed.ts`) | Code logic |
| `verifier` | Haiku | Build + `npm run verify` loop; reports pass/fail and screenshot paths | Editing source files |
| built-in `Explore` | — | "Where is X?" searches across the repo | Edits |

Delegation rules that save tokens:
1. Give each agent **file paths and the exact change**, not the whole conversation. This file is their map, so don't re-explain the architecture.
2. Independent tasks run **in parallel** (e.g. `content-writer` + `ui-polisher`); dependent tasks run in sequence.
3. After any code change, send the `verifier` agent. It returns a short report; the main session opens screenshots **only** for UI changes or failures.
4. Agents return **summaries** (what changed, file:line, anything unresolved), never full file dumps.
5. One fix → one verify. Don't batch unrelated changes into one agent run.

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
