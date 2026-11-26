# Brief templates

Fill the brackets. Keep briefs short: paths, not pasted history.

## Builder
You are [building <task>] for "Vantage" (Next.js 15 + Tailwind v4 paper-trading learning app) in [/home/user/stockpilot on branch `overhaul` | worktree <path> on branch <branch>].
Read first: CLAUDE.md ("Sources of truth"), docs/design/direction.md, and [the task section in docs/plans/2026-11-24-preflight-overhaul.md | the findings file].
Build: [numbered requirements with exact values].
Reuse: [the existing helpers it must call — money.ts, preflight.ts, sync.ts, lesson-widgets.tsx, BRAND, LEGAL].
Verify: add checks [list]; build + full verify pass [2|3] runs in a row; never delete a check.
Server: port [N] by port only (`fuser -k N/tcp`), never pkill.
Commit with explicit paths, attribution lines; don't push.
Report: write [report path]; reply with ONLY status, commits, verify N/M ×runs, concerns, report path.
You do not dispatch subagents.

## QA reviewer 1 (Sonnet) and reviewer 2 (Opus)
Review and test; never edit source or commit. Worktree [path] at [commit], served on [port] via the pkill-proof script. Inputs: [spec, reports]. Checks: [spec compliance per item; visual sweep 360/390/768/1440 × light/dark; a11y; regressions; for R2: money invariants over randomized sequences, privacy request interception, multi-tab, keyboard-only, hostile input]. Report to [path] with a findings table (severity, file:line, evidence, repro, fix) and a verdict. Reply with ONLY verdict, counts, top 3, verify N/M, report path.
