---
name: vantage-ship-task
description: Ships one Vantage task end to end the way the owner wants it done — Opus leads, the right model builds, the change is verified, reviewed twice (Sonnet then Opus), fixed until it passes, merged, pushed to GitHub, and reported in plain words. Use whenever the owner asks to build, fix, or finish anything in Vantage ("build the paywalls", "finish the website", "fix what the reviewer found", "ship it", "make no mistakes").
---

# Ship a Vantage task

The owner's standing rules, learned from how they corrected the work: **make no mistakes**, **Opus leads and gets every hard task**, **check everybody's work twice**, **reuse everything already built**, **push when done**, **don't get sued**, and **show me** at the end. This skill is that loop.

## 1. Read before routing
Read `CLAUDE.md` (especially "Sources of truth" and the agent table) and the task's section in `docs/plans/2026-11-24-preflight-overhaul.md`. Never start from scratch: design = `docs/design/direction.md`, brand = `docs/design/brand.md` + `public/brand/`, legal = `docs/legal/research-report.md` + the legal pages, logic = `src/lib/analysis.ts`, `preflight.ts`, `money.ts`, `src/store/sync.ts`.

## 2. Route by difficulty
- Touches money, payments, auth/RLS/security, data integrity, cross-tab sync, entitlements, native-app architecture, or already failed review twice → **Opus** (`opus-engineer`).
- Visual direction or brand → **Opus designer, extra-high effort**, using `frontend-design:frontend-design`.
- Everything else → **Sonnet** (`feature-builder`, `ui-polisher`, `coach-ai`, `content-writer`).
Always set the model explicitly. Write the brief from `reference/prompts.md`; hand over file paths, not conversation history.

## 3. Isolate the work
- One builder per working tree. If anything else is editing `/home/user/stockpilot`, the builder gets its own git worktree and branch.
- Every server is started by port and killed by port (`fuser -k <port>/tcp`). **Never `pkill -f next-server`** — it kills other agents' servers. Reviewers and demos use `qa-server.cjs`-style custom servers on 3100/3200/3300/3400.

## 4. Build gate (the builder's own proof)
`npm run build` and the full `npm run verify` pass **twice in a row** (three times for concurrency or data-integrity work). Every behaviour change adds checks that fail before and pass after. No check is ever deleted — adapt selectors instead.

## 5. Review twice
1. **QA reviewer 1 (Sonnet)** in a separate worktree: spec compliance, visuals at 360/390/768/1440 light+dark, accessibility, regressions, verify N/M.
2. **QA reviewer 2 (Opus, `qa-final`)**: re-checks R1 with its own evidence, then attacks money integrity, privacy, multi-tab, keyboard-only, hostile input. Verdict: SHIP / SHIP AFTER FIXES / DO NOT SHIP.
Reviewers never edit source.

## 6. Fix loop
Send findings back to the **same** builder (resume it; it has the context). Fix every Critical and Important; Minors that are safe. Then a **scoped re-check** by the Opus reviewer on just those fixes. Stop only at SHIP. If a finding survives two rounds, escalate it to Opus.

## 7. Merge and push — approval already given
The owner asked for everything to be pushed when done. Merge feature branches into `overhaul` (resolve conflicts by keeping the newer UI and carrying over the newer logic), run build + verify on the merged tree, commit with the attribution lines, and push. Never force-push. Never push a tree that hasn't passed verify.

## 8. Show the owner
Run `vantage-show-me` (screenshots + walkthrough video + build-log refresh). Report in plain words: what changed, the test count, what the reviewers caught, and anything only the owner can do. If a usage limit stops agents, schedule a resume for the reset time and resume the same agents — never restart from scratch.

## Gates that stay with the owner
Anything that **spends money**, **publishes publicly** (deploys, app-store submissions, ads), **emails anyone but the owner**, or **changes legal terms** waits for the owner's explicit yes.
