export type MissionId =
  | "first-trade"
  | "use-stop"
  | "write-thesis"
  | "diversify"
  | "rr-2"
  | "buy-etf"
  | "ask-coach"
  | "post-community"
  | "score-85"
  | "limit-order";

export interface Mission {
  id: MissionId;
  title: string;
  detail: string;
  xp: number;
  href: string;
}

export const MISSIONS: Record<MissionId, Mission> = {
  "first-trade": { id: "first-trade", title: "Place your first trade", detail: "Buy any stock with paper money.", xp: 40, href: "/markets" },
  "use-stop": { id: "use-stop", title: "Protect a trade with a stop-loss", detail: "Place a buy with a stop-loss attached.", xp: 50, href: "/markets" },
  "write-thesis": { id: "write-thesis", title: "Journal a thesis", detail: "Write at least one full sentence explaining why you're buying.", xp: 40, href: "/markets" },
  diversify: { id: "diversify", title: "Hold 3 different sectors", detail: "Own positions in at least three sectors at once.", xp: 60, href: "/markets" },
  "rr-2": { id: "rr-2", title: "Plan a 2 : 1 trade", detail: "Place a bracket order whose target is at least twice your risk.", xp: 60, href: "/markets" },
  "buy-etf": { id: "buy-etf", title: "Own the whole market", detail: "Buy SPY or QQQ.", xp: 40, href: "/markets/SPY" },
  "ask-coach": { id: "ask-coach", title: "Ask your coach a question", detail: "Start a conversation with your AI coach.", xp: 30, href: "/coach" },
  "post-community": { id: "post-community", title: "Share with the community", detail: "Post an idea, a question or a lesson learned.", xp: 30, href: "/community" },
  "score-85": { id: "score-85", title: "Earn a Disciplined rating", detail: "Get a coach score of 85 or higher on a trade.", xp: 80, href: "/markets" },
  "limit-order": { id: "limit-order", title: "Use a limit order", detail: "Place a limit order instead of a market order.", xp: 40, href: "/markets" },
};

export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  sections: { heading: string; body: string[] }[];
  keyPoints: string[];
  callout?: { title: string; body: string };
  quiz: QuizQ[];
  mission?: MissionId;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const COURSE: Module[] = [
  {
    id: "foundations",
    title: "Market Foundations",
    description: "What you actually own when you buy a stock, and how prices move.",
    lessons: [
      {
        slug: "what-is-a-stock",
        title: "What a stock really is",
        minutes: 4,
        summary: "A share is a slice of ownership in a real business — its profits, its risks and its future.",
        sections: [
          {
            heading: "You're buying a piece of a business",
            body: [
              "When you buy one share of Apple, you own a tiny fraction of the company: its factories, its cash, its brand and, most importantly, its future profits. There are about 15 billion Apple shares, so one share is a very small slice — but it's a real claim on a real business.",
              "Companies sell shares to raise money to grow. After that first sale (the IPO), shares trade between investors on an exchange. The company isn't involved in your trade; you're buying from another investor who wants to sell.",
            ],
          },
          {
            heading: "Why prices go up and down",
            body: [
              "In the long run, a stock follows the business's earnings. If a company makes more money every year, its shares tend to become worth more. In the short run, prices move on expectations: news, interest rates, fear and excitement.",
              "That's the key mental model: the price is what people will pay today, and the value is what the business will earn over time. Investing is the work of telling those two apart.",
            ],
          },
        ],
        callout: { title: "Two ways to make money", body: "Price appreciation (selling higher than you bought) and dividends (cash the company pays shareholders out of profits). KO and JNJ pay meaningful dividends; NVDA barely does." },
        keyPoints: ["A share = partial ownership of a business", "Long run: price follows earnings", "Short run: price follows expectations and emotion"],
        quiz: [
          { q: "When you buy a share on an exchange, who are you usually buying it from?", options: ["The company itself", "Another investor", "The government", "The exchange"], answer: 1, why: "After the IPO, shares change hands between investors. The company doesn't get your money." },
          { q: "Over many years, what drives a stock's price most?", options: ["Daily news headlines", "Social media buzz", "The company's earnings", "The share count"], answer: 2, why: "Headlines move prices day to day. Over years, earnings growth does the heavy lifting." },
        ],
        mission: "first-trade",
      },
      {
        slug: "how-the-market-moves",
        title: "How the market moves",
        minutes: 5,
        summary: "Bid, ask, volatility and why everything sometimes falls at once.",
        sections: [
          {
            heading: "Bid, ask and the spread",
            body: [
              "Every stock has a bid (the highest price a buyer will pay right now) and an ask (the lowest price a seller will accept). The gap between them is the spread. Popular stocks like SPY have spreads of a penny; thinly traded ones can cost you a lot more.",
              "A market order buys at the ask and sells at the bid. That's why you lose a tiny amount the moment you buy — the slippage you see in this simulator models exactly that.",
            ],
          },
          {
            heading: "Market-wide moves and beta",
            body: [
              "Some news moves the entire market: inflation reports, interest-rate decisions, jobs data. When that happens, most stocks move together. Beta measures how strongly a stock reacts to the overall market. A beta of 2 (like TSLA in our sim) tends to move about twice as much as the market; a beta of 0.5 (like KO) about half as much.",
              "Volatility is how much a price swings. High-volatility stocks can make you money fast — and lose it just as fast. Watch the news feed in the simulator: a macro headline lifts or sinks almost everything, scaled by each stock's beta.",
            ],
          },
        ],
        keyPoints: ["Buy at the ask, sell at the bid", "Macro news moves everything at once", "Beta = sensitivity to the market; volatility = size of the swings"],
        quiz: [
          { q: "A stock has a beta of 2. The market falls 1%. Roughly what happens to the stock?", options: ["Rises 2%", "Falls about 2%", "Falls about 0.5%", "No change"], answer: 1, why: "Beta 2 means about twice the market's move, in the same direction." },
          { q: "What is the spread?", options: ["The difference between today's high and low", "The gap between the bid and the ask", "The commission your broker charges", "The dividend yield"], answer: 1, why: "The spread is the cost of crossing from buyers to sellers." },
        ],
      },
      {
        slug: "order-types",
        title: "Order types that protect you",
        minutes: 5,
        summary: "Market, limit and stop orders — and when to use each one.",
        sections: [
          {
            heading: "Market vs. limit",
            body: [
              "A market order says \"fill me now at whatever the price is.\" It's fast and certain to fill, but you don't control the price. A limit order says \"fill me only at this price or better.\" You control the price, but it might never fill.",
              "Use limit orders when you have a specific entry in mind or the stock is moving fast. They stop you from chasing.",
            ],
          },
          {
            heading: "Stops and brackets",
            body: [
              "A stop order sits below the price and turns into a sell if the stock falls to it. It's your pre-planned exit if you're wrong. A take-profit is a limit sell above the price — your pre-planned exit if you're right.",
              "Put both on one entry and you have a bracket order: when one leg fills, the other is cancelled automatically. That's how you decide calmly in advance instead of emotionally in the moment. The order ticket here builds brackets for you.",
            ],
          },
        ],
        callout: { title: "Pro habit", body: "Professionals decide their exit before they enter. A bracket order turns that habit into something the system enforces for you." },
        keyPoints: ["Market = certain fill, uncertain price", "Limit = certain price, uncertain fill", "Bracket = entry + stop-loss + take-profit"],
        quiz: [
          { q: "You want to buy NVDA, but only if it dips to $180. Which order?", options: ["Market buy", "Limit buy at $180", "Stop sell at $180", "Take-profit at $180"], answer: 1, why: "A limit buy fills only at $180 or lower." },
          { q: "In a bracket order, what happens when the stop-loss fills?", options: ["The take-profit stays open", "The take-profit is cancelled", "A new buy order is placed", "Nothing"], answer: 1, why: "The legs are one-cancels-other. Once you're out, the other exit isn't needed." },
        ],
        mission: "limit-order",
      },
    ],
  },
  {
    id: "risk",
    title: "Risk First",
    description: "The part most beginners skip — and the reason most of them quit.",
    lessons: [
      {
        slug: "position-sizing",
        title: "Position sizing: the 1–2% rule",
        minutes: 6,
        summary: "How much to buy matters more than what you buy.",
        sections: [
          {
            heading: "Survive first",
            body: [
              "Lose 50% and you need a 100% gain just to get back to even. Big losses are hard to recover from, so the first job of any trader is to stay small enough that no single mistake is fatal.",
              "The classic rule: never risk more than 1–2% of your account on one trade. \"Risk\" here doesn't mean what you spend. It means what you'd lose if your stop-loss triggers.",
            ],
          },
          {
            heading: "Do the math",
            body: [
              "Say your account is $100,000 and you'll risk 1% ($1,000). You want to buy a $200 stock with a stop at $190, so you risk $10 per share. $1,000 ÷ $10 = 100 shares. That's your size. The stop decides the size, not your excitement.",
              "The order ticket in this app does that math for you: set a stop and it shows how much of your account is at risk.",
            ],
          },
        ],
        callout: { title: "Formula", body: "Shares = (Account × Risk %) ÷ (Entry − Stop)" },
        keyPoints: ["Risk = what you lose if the stop hits", "Risk 1–2% of your account per trade", "Let the stop distance decide the share count"],
        quiz: [
          { q: "$50,000 account, 1% risk, entry $100, stop $95. How many shares?", options: ["50", "100", "500", "1,000"], answer: 1, why: "$500 risk ÷ $5 per share = 100 shares." },
          { q: "After a 50% loss, what gain gets you back to even?", options: ["50%", "75%", "100%", "150%"], answer: 2, why: "Half of your money has to double to recover." },
        ],
        mission: "use-stop",
      },
      {
        slug: "stop-losses",
        title: "Stop-losses: decide where you're wrong",
        minutes: 5,
        summary: "A stop is a promise you make to yourself before your emotions show up.",
        sections: [
          {
            heading: "Why stops exist",
            body: [
              "Every trade is a hypothesis: \"I think this goes up because…\". A stop-loss marks the price where your hypothesis is clearly wrong. When it's hit, you're not giving up — you're following the evidence.",
              "Without a stop, losing trades tend to turn into \"long-term investments\". That's how a 5% loss becomes a 40% loss.",
            ],
          },
          {
            heading: "Where to put it",
            body: [
              "Put stops at a level that would actually invalidate your idea: below a recent support level, below a key moving average, or at a fixed percentage that fits the stock's volatility. A stop that's too tight on a volatile stock (like TSLA) gets hit by normal noise.",
              "Rule of thumb: the more volatile the stock, the wider the stop — and the smaller the position, so your dollar risk stays the same.",
            ],
          },
        ],
        keyPoints: ["A stop marks where your thesis is wrong", "Volatile stocks need wider stops and smaller size", "Never move a stop further away to avoid a loss"],
        quiz: [
          { q: "Your stop is about to be hit. What should you do?", options: ["Move it lower to give it room", "Let it work as planned", "Buy more", "Cancel it"], answer: 1, why: "Moving a stop to dodge a loss defeats the purpose of having one." },
          { q: "For a very volatile stock, a good approach is…", options: ["Tighter stop, bigger size", "Wider stop, smaller size", "No stop", "Same as any stock"], answer: 1, why: "A wider stop avoids noise; a smaller size keeps the dollar risk the same." },
        ],
        mission: "use-stop",
      },
      {
        slug: "risk-reward",
        title: "Reward-to-risk",
        minutes: 4,
        summary: "Why you can be wrong most of the time and still win.",
        sections: [
          {
            heading: "The asymmetry",
            body: [
              "If you risk $1 to make $2 (a 2 : 1 reward-to-risk), you only need to be right more than one-third of the time to come out ahead. Ten trades, 4 wins, 6 losses: +$8, −$6 = +$2.",
              "Beginners often do the opposite. They take small profits quickly (it feels good) and let losses run (it feels bad to admit). That gives a 1 : 3 profile that loses even with a high win rate.",
            ],
          },
          {
            heading: "Plan both exits",
            body: [
              "Before you enter, set a target where you'd take profit and a stop where you'd admit you're wrong. If the target isn't at least 1.5–2× the distance to the stop, the trade probably isn't worth taking.",
            ],
          },
        ],
        callout: { title: "Break-even win rate", body: "Win rate needed = 1 ÷ (1 + R). At 2 : 1, that's 33%. At 3 : 1, it's 25%." },
        keyPoints: ["Aim for at least 2 : 1", "Win rate alone means nothing without R:R", "Cut losers short, let winners reach their target"],
        quiz: [
          { q: "At 3 : 1 reward-to-risk, what win rate do you need to break even?", options: ["75%", "50%", "33%", "25%"], answer: 3, why: "1 ÷ (1 + 3) = 25%." },
          { q: "Entry $100, stop $96, target $110. What's the reward-to-risk?", options: ["1 : 1", "2.5 : 1", "4 : 1", "10 : 1"], answer: 1, why: "Reward $10 ÷ risk $4 = 2.5." },
        ],
        mission: "rr-2",
      },
      {
        slug: "diversification",
        title: "Diversification",
        minutes: 4,
        summary: "Don't let one sector decide your year.",
        sections: [
          {
            heading: "Correlation is the hidden risk",
            body: [
              "Owning NVDA, AMD and MSFT feels like three bets, but it's mostly one: tech. When rates rise or AI sentiment cools, they tend to fall together. True diversification means owning things that don't all move the same way.",
              "Mix sectors with different drivers: tech (growth), consumer staples (stability), healthcare (defensive), energy (commodity-linked), financials (rate-linked).",
            ],
          },
        ],
        keyPoints: ["Similar stocks fall together", "Spread across sectors with different drivers", "An index ETF is instant diversification"],
        quiz: [
          { q: "Which portfolio is the most diversified?", options: ["NVDA, AMD, MSFT", "KO, JNJ, XOM, JPM", "TSLA only", "AAPL, MSFT, GOOGL"], answer: 1, why: "Four different sectors with different economic drivers." },
        ],
        mission: "diversify",
      },
    ],
  },
  {
    id: "charts",
    title: "Reading Charts",
    description: "Trends, levels and moving averages without the mysticism.",
    lessons: [
      {
        slug: "trends-and-candles",
        title: "Trends: higher highs, higher lows",
        minutes: 4,
        summary: "The simplest and most useful thing a chart can tell you.",
        sections: [
          {
            heading: "Spotting a trend",
            body: [
              "An uptrend is a series of higher highs and higher lows. A downtrend is lower highs and lower lows. Anything else is a range. That's it — no indicators needed.",
              "\"The trend is your friend\" is common advice because buying with the trend means the overall flow of money is on your side. Buying a stock in a clear downtrend is betting you've spotted the exact bottom.",
            ],
          },
          {
            heading: "Timeframes matter",
            body: ["A stock can be in a 1-year uptrend and a 1-week downtrend at the same time. Use the range buttons on any chart (1D, 1M, 3M, 1Y) to check that the trend you care about matches how long you plan to hold."],
          },
        ],
        keyPoints: ["Uptrend = higher highs + higher lows", "Trade with the trend of your holding period", "Check several timeframes"],
        quiz: [{ q: "A chart shows lows of $90, $94, $97 and highs of $100, $104, $108. What is it?", options: ["Downtrend", "Uptrend", "Range", "Can't tell"], answer: 1, why: "Both the highs and the lows are rising." }],
      },
      {
        slug: "support-and-resistance",
        title: "Support & resistance",
        minutes: 4,
        summary: "Prices remember. Levels where buyers or sellers showed up before often matter again.",
        sections: [
          {
            heading: "Floors and ceilings",
            body: [
              "Support is a price where buying has stepped in repeatedly — a floor. Resistance is a price where selling has capped rallies — a ceiling. They exist because people remember prices: \"I'll buy more if it gets back to $180.\"",
              "Support and resistance make natural places for stops and targets: stop just below support, target just below resistance.",
            ],
          },
        ],
        keyPoints: ["Support = floor, resistance = ceiling", "Stops go just below support", "Broken resistance often becomes support"],
        quiz: [{ q: "Where is a logical place for a stop-loss on a long trade?", options: ["Just above resistance", "Just below support", "At your entry price", "Anywhere"], answer: 1, why: "If support breaks, the reason for the trade is probably gone." }],
      },
      {
        slug: "moving-averages",
        title: "Moving averages",
        minutes: 4,
        summary: "Smooth out the noise to see the direction.",
        sections: [
          {
            heading: "What they show",
            body: [
              "A 50-day moving average is the average closing price over the last 50 days, recalculated daily. It smooths out daily noise. Price above a rising 50-day average generally means a healthy uptrend.",
              "Many investors watch the 200-day average as the line between a long-term uptrend and a downtrend. Moving averages lag the price — they confirm, they don't predict.",
            ],
          },
        ],
        keyPoints: ["MA = average price over N days", "Price above a rising MA = healthy trend", "MAs lag; use them to confirm, not predict"],
        quiz: [{ q: "Moving averages are best described as…", options: ["Predictive", "Lagging", "Random", "Fundamental"], answer: 1, why: "They're built from past prices, so they trail the action." }],
      },
    ],
  },
  {
    id: "fundamentals",
    title: "Fundamentals",
    description: "What the business earns and what you're paying for it.",
    lessons: [
      {
        slug: "earnings-and-eps",
        title: "Earnings & EPS",
        minutes: 5,
        summary: "Why stocks jump or crash on earnings day.",
        sections: [
          {
            heading: "The quarterly report card",
            body: [
              "Every quarter, public companies report revenue (sales) and earnings (profit). Earnings per share (EPS) is profit divided by the number of shares. Analysts publish estimates beforehand, and the stock reacts to how results compare with those expectations — not to whether the numbers are \"good\".",
              "A company can grow profit 30% and still fall if everyone expected 40%. Guidance — what management says about the next quarter — often matters even more than the results.",
            ],
          },
        ],
        callout: { title: "In the simulator", body: "Earnings and guidance headlines cause the biggest jumps. Holding a big position into an earnings event is a gamble on a coin flip you can't control." },
        keyPoints: ["The market reacts to results vs. expectations", "Guidance about the future often matters most", "Earnings days bring big gaps — size down"],
        quiz: [{ q: "A company beats last year's profit by 30%, but the stock drops. Most likely why?", options: ["Prices are random", "Expectations were higher", "EPS doesn't matter", "The market was closed"], answer: 1, why: "Stocks move on results relative to expectations." }],
      },
      {
        slug: "valuation-pe",
        title: "Valuation: the P/E ratio",
        minutes: 5,
        summary: "How many dollars you're paying for each dollar of profit.",
        sections: [
          {
            heading: "Price ÷ earnings",
            body: [
              "The P/E ratio is the share price divided by yearly EPS. A P/E of 20 means you pay $20 for every $1 of annual profit. A high P/E means the market expects fast growth; a low P/E means slow growth, or doubts.",
              "Compare P/Es within an industry, not across them. A 60 P/E for a fast-growing chip company and a 24 for Coca-Cola can both be fair. Check each stock's P/E on its page in Markets.",
            ],
          },
        ],
        keyPoints: ["P/E = price ÷ annual EPS", "High P/E = high growth expectations", "Compare within industries"],
        quiz: [{ q: "Stock A has a P/E of 60, stock B has a P/E of 15. What does that imply?", options: ["A is definitely overpriced", "The market expects faster growth from A", "B is a bad company", "Nothing"], answer: 1, why: "A high P/E reflects high growth expectations, which may or may not come true." }],
      },
      {
        slug: "reading-the-news",
        title: "Reading the news like a pro",
        minutes: 4,
        summary: "Separate signal from noise — and recognize when the move already happened.",
        sections: [
          {
            heading: "Priced in",
            body: [
              "By the time you read a headline, the market has usually already reacted. Upgrades, downgrades and product news often cause a sharp move that partly fades. Buying right after a 6% pop means paying the new price for old news.",
              "Ask three questions: Does this change the business's long-term earnings? Is the move bigger or smaller than the news deserves? Would I want this stock if the headline didn't exist?",
            ],
          },
        ],
        keyPoints: ["Most news is priced in within minutes", "Ask whether it changes long-term earnings", "Don't confuse a headline with a thesis"],
        quiz: [{ q: "An analyst upgrade sends a stock up 5% in minutes. What's the risk of buying now?", options: ["None", "You're paying for news that's already priced in", "Upgrades always keep working", "Analysts are always wrong"], answer: 1, why: "The fast money has already moved. You're paying the post-news price." }],
      },
    ],
  },
  {
    id: "psychology",
    title: "Trader Psychology",
    description: "Your brain is the biggest risk in your portfolio.",
    lessons: [
      {
        slug: "fomo-and-greed",
        title: "FOMO & greed",
        minutes: 4,
        summary: "The feeling of missing out is the most expensive feeling in markets.",
        sections: [
          {
            heading: "The chase",
            body: [
              "You watch a stock rip 8% and feel you have to get in. That urgency is FOMO, and it usually shows up near short-term tops, when everyone else has already bought.",
              "The fix is a rule: no entries without a plan written before the move. If you missed it, you missed it. There's always another setup. Your coach will flag buys made right after big jumps.",
            ],
          },
        ],
        keyPoints: ["Urgency is a warning sign", "No plan, no trade", "Missing a move costs $0"],
        quiz: [{ q: "What's the cost of missing a trade you didn't plan?", options: ["Huge", "$0", "Your whole account", "Depends on the stock"], answer: 1, why: "A missed opportunity costs nothing. A bad chase costs real money." }],
      },
      {
        slug: "loss-aversion",
        title: "Loss aversion",
        minutes: 4,
        summary: "Why we hold losers too long and sell winners too soon.",
        sections: [
          {
            heading: "Losses hurt twice as much",
            body: [
              "Research by Kahneman and Tversky found that losses feel about twice as painful as equal gains feel good. So we avoid realizing losses (\"it'll come back\") and rush to lock in gains (\"take the money\"). That's exactly backwards.",
              "Averaging down — buying more of a losing stock — can be rational if the thesis is intact, but it's often just loss aversion in disguise. Ask: would I buy this today if I didn't already own it?",
            ],
          },
        ],
        keyPoints: ["Losses feel ~2× worse than gains feel good", "\"Would I buy it today?\" cuts through the bias", "Averaging down needs an intact thesis"],
        quiz: [{ q: "Which question best counters loss aversion on a losing position?", options: ["How much am I down?", "Would I buy it today at this price?", "When will it come back?", "What did I pay?"], answer: 1, why: "It forces a decision on the present, not on your entry price." }],
      },
      {
        slug: "overtrading",
        title: "Overtrading",
        minutes: 3,
        summary: "More trades ≠ more profit.",
        sections: [
          {
            heading: "Activity is not progress",
            body: [
              "Each trade has costs (spread, slippage, taxes) and each one is another chance to act on emotion. Studies of retail investors consistently find that the most active traders earn the lowest returns.",
              "If you catch yourself making trade after trade, especially after a loss (\"revenge trading\"), stop. Close the app and review your journal instead.",
            ],
          },
        ],
        keyPoints: ["Every trade has a cost", "Revenge trading after losses is a trap", "Fewer, better trades"],
        quiz: [{ q: "You just took a loss and want to win it back immediately. What is that called?", options: ["Hedging", "Revenge trading", "Scalping", "Diversifying"], answer: 1, why: "Trading to undo a loss is emotional, not strategic." }],
      },
      {
        slug: "trading-journal",
        title: "Your trading journal",
        minutes: 4,
        summary: "The single habit that separates people who improve from people who repeat.",
        sections: [
          {
            heading: "Grade the decision, not the outcome",
            body: [
              "A good decision can lose money and a bad decision can make money. Over time, good decisions win. A journal lets you judge the decision: Was there a thesis? Was the size right? Did I follow my exits?",
              "Every order in this app has a thesis field, and the coach scores the decision, not just the profit and loss. Your trade history is your journal.",
            ],
          },
        ],
        keyPoints: ["Write the thesis before the trade", "Grade process, not P&L", "Review weekly for patterns"],
        quiz: [{ q: "A trade with no plan made $500. How should you grade it?", options: ["Great trade", "Lucky, poor process", "Perfect execution", "Irrelevant"], answer: 1, why: "Profit without process is luck, and luck doesn't repeat." }],
        mission: "write-thesis",
      },
    ],
  },
  {
    id: "strategy",
    title: "Building Your Strategy",
    description: "Put it all together into a plan you can actually follow.",
    lessons: [
      {
        slug: "index-vs-picking",
        title: "Index investing vs. stock picking",
        minutes: 5,
        summary: "The honest truth about beating the market.",
        sections: [
          {
            heading: "The benchmark is tough",
            body: [
              "Over long periods, most professional fund managers fail to beat the S&P 500 after fees. An index ETF like SPY gives you the market's return, cheaply, with almost no effort. That's a high bar for any stock picker.",
              "Many successful investors do both: a core of index funds for most of their money, plus a smaller \"satellite\" portfolio for individual ideas they've researched. Your dashboard compares your returns with SPY so you always know whether your picks are adding value.",
            ],
          },
        ],
        keyPoints: ["Most pros don't beat the index long-term", "Core-and-satellite is a practical middle ground", "Always measure yourself against SPY"],
        quiz: [{ q: "What is a core-and-satellite portfolio?", options: ["All individual stocks", "Mostly index funds plus a smaller set of picks", "Only bonds", "Day trading"], answer: 1, why: "A low-cost core, plus satellites for conviction ideas." }],
        mission: "buy-etf",
      },
      {
        slug: "build-your-plan",
        title: "Write your trading plan",
        minutes: 6,
        summary: "A one-page plan beats a hundred hot tips.",
        sections: [
          {
            heading: "The five questions",
            body: [
              "1) What's my goal and time horizon? 2) What setups will I trade, and what will I never trade? 3) How much will I risk per trade (1–2%)? 4) Where do my stops and targets go? 5) When do I review my journal?",
              "Write your answers down. Then run the plan in the simulator for a few weeks, ask your coach to review your trades against it, and share your results with the community. That's the loop that builds real skill.",
            ],
          },
        ],
        keyPoints: ["Goal, setups, risk, exits, review", "Test the plan with paper money first", "Iterate with feedback"],
        quiz: [{ q: "What should you do before using real money?", options: ["Skip the plan", "Test the plan with paper trading and review the results", "Copy someone else's trades", "Pick the hottest stock"], answer: 1, why: "Paper trading lets you find the flaws in your plan for free." }],
        mission: "score-85",
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = COURSE.flatMap((m) => m.lessons);
export const LESSON_MAP: Record<string, Lesson> = Object.fromEntries(ALL_LESSONS.map((l) => [l.slug, l]));
export function moduleOf(slug: string) {
  return COURSE.find((m) => m.lessons.some((l) => l.slug === slug));
}

export const LEVELS = [
  { min: 0, name: "Rookie" },
  { min: 150, name: "Apprentice" },
  { min: 400, name: "Trader" },
  { min: 800, name: "Strategist" },
  { min: 1400, name: "Portfolio Pro" },
  { min: 2200, name: "Market Master" },
];

export function levelFor(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  return { level: idx + 1, name: cur.name, min: cur.min, next: next?.min ?? cur.min, progress: next ? (xp - cur.min) / (next.min - cur.min) : 1 };
}
