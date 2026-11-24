# Vantage

Learn the stock market with an AI coach in your corner: paper trade a live simulated market, get instant feedback on every decision, take an interactive course, and grow with a community.

## Features (v0.1)
- **Live simulated market**: 18 real companies and ETFs, prices tick every 2s, news headlines move prices (scaled by beta), 1D/1M/3M/1Y charts with hover and trade markers.
- **Paper trading**: $100k start; market, limit and stop orders; bracket orders (stop-loss + take-profit, one-cancels-other); risk-based position sizing; realized/unrealized P&L; persistent portfolio.
- **AI coach (Nova)**: a pre-trade check scores the order live, and a post-trade review (rule engine + Claude) gives a 0–100 process score, flags and a next step. A streaming chat coach sees your portfolio, trades and progress, and Nova replies to your community posts.
- **Course**: 6 modules, 19 lessons, quizzes with explanations, 10 missions verified against your real simulator activity, plus XP and levels.
- **Community**: feed with posts, likes and comments, a leaderboard ranked on discipline or return, and weekly challenges.
- Light and dark themes, phone-first responsive layout, accessible deltas (arrow + sign as well as color).

## Run it
```bash
npm install
cp .env.example .env.local   # add your Anthropic API key to turn on the AI coach
npm run dev                  # http://localhost:3000
```
Without a key the coach runs in **offline mode** (rule-based reviews and canned answers), so everything still works.

## Verify
```bash
npm run build && npm start   # terminal 1
npm run verify               # terminal 2: 36 end-to-end checks + screenshots in ./verify-shots
```

## Working on it with Claude Code
See `CLAUDE.md` for the architecture map and the agent hierarchy (`.claude/agents/`): Opus plans and reviews, Sonnet agents build, and a Haiku agent runs the verification loop.

## Roadmap / not built yet
- Real accounts + shared database (Supabase/Postgres) so the community, leaderboard and portfolios are multi-user and cross-device. **The community currently uses demo members.**
- Optional real market data (Polygon / Alpaca / Finnhub) alongside the simulator.
- Candlestick charts, indicators (MA overlay, volume), short selling, options basics.
- Push/email streak reminders, weekly AI performance report, achievements.

## Legal pages (read before launch)

The legal pages (`/terms`, `/privacy`, `/disclaimer`, `/community-guidelines`, `/copyright`, `/accessibility`) are drafted from `docs/legal/research-report.md`. They are **not legal advice**. Have a lawyer review them before public launch. Fill in the bracketed placeholders in `src/lib/legal.ts` (entity name, address, contact email, DMCA agent, governing law, hosting provider, refund policy, arbitration provider, log retention). Register the DMCA agent with the U.S. Copyright Office. Bump `termsVersion` when the Terms or Privacy policy change materially, so users are asked to agree again.
