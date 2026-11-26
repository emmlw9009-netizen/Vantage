# Task 4 (widgets) and Task 7 (accessibility and copy) report

## Task 4 item 3: lesson widgets
- `src/lib/widget-math.ts` (new, pure): `sizePosition` (whole cents, floor), `rewardRiskPlan` (uses `rewardRiskOf` and `meetsRewardRisk` from `money.ts`, so it agrees with the ticket and coach), seeded `trendRound` / `makeTrendChart`, `classifySwings`.
- `src/components/lesson-widgets.tsx` (new): `PositionSizeWidget`, `RewardRiskWidget`, `TrendSpotterWidget` (store-free, props only, exported for the public calculator pages) and `LessonWidget` (reads equity for the account default).
- `src/lib/course.ts`: optional `widget` on `Lesson` plus `WidgetId`; set on position-sizing, risk-reward, trends-and-candles. Rendered after the callout, before "What to remember".
- Reward-risk diagram: inline SVG, risk and reward bars to scale (verified: reward bar is 2.0x the risk bar for 100/95/110), direct labels (not colour only), hover readout, one axis, break-even win rate 1/(1+R), verdict with the exact target needed (`minTarget`).
- Trend spotter: swing pivots are fixed first and the line is eased and clamped between them, so the pivots are the true extremes and the label is correct by construction. 2000 rounds checked offline with an independent classifier: 0 mismatches. Each chart's aria-label lists the swing prices, so the answer is reachable without sight. Explicit "Check my answers" button, native radios, score in a status region, "Try three new charts" (next seed).
- Screenshots read: /learn/position-sizing (desktop light), /learn/risk-reward (desktop light), /learn/trends-and-candles (phone dark). Layout, tokens, sentence case and 40px targets hold. Known limitation: the reward-risk SVG is capped at 520px so it looks modest on desktop.

## Task 7: contrast table (computed from globals.css, now enforced by a verify check)
Text tokens, ratio on paper / sheet / well / field. All pass 4.5:1, so no token needed changing.

| Token | Light | Dark |
|---|---|---|
| ink | 15.21 / 16.73 / 14.07 / 17.38 | 14.22 / 13.04 / 11.81 / 15.13 |
| ink-2 | 7.26 / 8.00 / 6.72 / 8.30 | 8.75 / 8.02 / 7.26 / 9.30 |
| muted | 5.27 / 5.80 / 4.87 / 6.02 | 5.93 / 5.43 / 4.92 / 6.31 |
| pencil | 7.22 / 7.94 / 6.68 / 8.25 | 8.01 / 7.34 / 6.65 / 8.52 |
| red | 5.75 / 6.33 / 5.32 / 6.57 | 7.77 / 7.12 / 6.45 / 8.27 |
| on-ink on ink / on red | 16.73 / 6.33 | 14.22 / 7.77 |

Non-text (3:1): edge on field 4.01 light, 3.99 dark; lowest is edge on well, 3.25 light and 3.11 dark. series-1 (chart line) is 3.54 on paper in light, 5.87 dark. A live computed-style audit of 19 routes in light, dark and phone found no text below 4.5:1 (the only hits were the selected segmented option, a false positive: its fill is a sibling span). No text uses opacity or text-series tokens. The only dimmed control is the locked Buy button after a fill (opacity 60), an inactive state.

## Task 7: a11y fixes
1. M12 tabs: `Segmented kind="tabs"` takes `idBase`, adds `aria-controls`; new `TabPanel` (role=tabpanel, aria-labelledby the active tab, focusable). Applied to Markets sectors, Journal trade filter, Community sections.
2. M14 row links and targets: Markets and Dashboard positions rows are fully clickable (row onClick, link stays the keyboard target); symbol links have a 40px hit area; term links on the symbol page ("P/E ratio", "Beta", "50-day average"), "AI coach disclaimer" and the lesson "Course" breadcrumb got 40px hit areas without changing layout.
3. M16 onboarding: visible "First name" label (was aria-label only); experience and goal steps are a real `radiogroup` (role=radio, aria-checked, roving tabindex, arrow keys); the rounded-full dot is now a 3px-radius square.
4. Like button: constant name "Like this post" with `aria-pressed` (was a changing Like/Unlike name plus pressed). Verify selectors adapted, nothing deleted.
5. aria-live: toaster container is `aria-live="polite"`; the lesson quiz score is announced in a status region; widget results are live regions. Prices stay unannounced by design (2s ticks would be noise; the chart readout has its own throttled region).
6. Focus order and visibility: unchanged (2px ink ring everywhere, confirmed by the earlier keyboard run); reduced motion confirmed (CSS blanket rule, MotionConfig reducedMotion=user, GSAP gated).
7. Headings: audit found one h1 per page and no heading jumps on all 19 routes in 3 contexts.

## Task 7: copy fixes
- "No price available for that symbol." became "There is no simulated price for that symbol. Pick a stock from Markets."
- "Enter a whole number of shares." now ends "such as 10."
- "Set a trigger price." became "Enter a trigger price. A limit or stop order waits for that price before it fills."
- "Order could not be filled." became "The order was not filled. Check your cash and shares, then try again."
- Coach "Send" became "Send message". Scan for "!", middle dots, arrows, "Submit", "OK", "Oops", ALL-CAPS found none.

## Verify additions (scripts/verify.cjs, 203 to 224 checks)
Position-size 200 shares (plus $1,000 risk, 20.0%, stop-above-entry fix); reward-risk 2.0, 33%, to-scale bars, 1.5 verdict names $110.00, invalid stop shows no diagram; trend spotter: 3 charts, no score before checking, one of each kind, correct answers 3 of 3, a score appears after three answers, new charts reset, all-Range scores 1 of 3; token contrast; per-route a11y smoke (names, labels, one h1, unique ids, dangling aria refs, tab panels) in 4 contexts over 21 routes (two lesson routes added to ROUTES).

## Notes
- Two earlier full runs failed once each on "Undo in the toast restores the post" (it read localStorage right after the click). The check now waits up to 5s for the state to settle and prints the state on failure (same assertion, not removed). Final runs: 224/224 twice in a row.
- Not done: text-only phone tab bar and ticket scroll cue (M16 second half) remain open.
