---
name: vantage-show-me
description: Shows the owner the current Vantage build — fresh screenshots of every main screen (desktop light/dark and phone), a short walkthrough video of a real session, and an updated build-log page — then emails a summary when asked. Use when the owner says "let me see it", "show me the site", "let me see the app", "send me screenshots", "record a video", or after any task ships.
---

# Show the owner the build

The owner can't run the code; they judge the product by what they see. Make it fast and real.

## 1. Serve the exact commit
In a demo worktree (`/home/user/vantage-demo`): `git checkout --detach <commit>`, `npm run build`, then start the pkill-proof `demo-server.cjs` on **port 3200** (`fuser -k 3200/tcp` first). Never use pkill.

## 2. Screenshots (deviceScaleFactor 2, reduced motion)
Onboard a user (name "Alex", tick the 18+ consent), place a disciplined NVDA bracket buy (thesis, −5%, +16%, "1% of account"), a KO buy, and a reckless TSLA buy, then capture: landing, first-run Home, NVDA ticket + review, Home, Journal, Markets, Learn, Coach (ask the sizing starter), Community, Home in dark mode, and phone (iPhone 14) Home, ticket and Journal. Look at a contact sheet yourself before sending; fix the script, not the screenshot, if something is off.

## 3. Walkthrough video
Record 1440×900 with Playwright `recordVideo`: landing scroll → onboarding with consent → ticket filling until the pre-flight score reaches the 90s → Buy → Home → Journal → a lesson quiz → Coach → Community post. Convert to MP4 (H.264, faststart), trim idle tails, check a contact sheet, then send.

## 4. Build log
Refresh `review/vantage-build-log.html` in the scratchpad (status counts, progress table, reviews-and-fixes, owner to-do) and republish it to the same artifact URL.

## 5. Tell and email
Send the files with a one-line caption. If the owner asked for email, send the summary to the owner's own address with the build-log and brand-canvas links. Never email anyone else without the owner's explicit yes.

## Never
Never fake a screen, mock a result, or show a build that didn't pass verify. If a step fails, say which.
