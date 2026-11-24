// Simulated market universe. Prices are generated, not real quotes.
// Swap `generateHistory` + the live tick engine for a market-data provider later.

export type Sector =
  | "Technology"
  | "Communication"
  | "Consumer"
  | "Financials"
  | "Healthcare"
  | "Energy"
  | "Index ETF";

export interface Ticker {
  symbol: string;
  name: string;
  sector: Sector;
  basePrice: number;
  vol: number; // annualized volatility
  beta: number;
  blurb: string;
  pe?: number;
  marketCapB?: number;
  dividendYield?: number;
}

export const TICKERS: Ticker[] = [
  { symbol: "SPY", name: "S&P 500 ETF", sector: "Index ETF", basePrice: 682.4, vol: 0.15, beta: 1, blurb: "Tracks the 500 largest US companies. The benchmark most investors measure themselves against.", pe: 23, dividendYield: 1.2 },
  { symbol: "QQQ", name: "Nasdaq-100 ETF", sector: "Index ETF", basePrice: 611.9, vol: 0.2, beta: 1.15, blurb: "The 100 largest non-financial Nasdaq companies — tech-heavy and more volatile than SPY.", pe: 31, dividendYield: 0.6 },
  { symbol: "AAPL", name: "Apple", sector: "Technology", basePrice: 248.3, vol: 0.26, beta: 1.1, blurb: "iPhone, Mac and a fast-growing services business. Huge buybacks and a loyal customer base.", pe: 32, marketCapB: 3700, dividendYield: 0.4 },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", basePrice: 512.7, vol: 0.24, beta: 1.0, blurb: "Cloud (Azure), Office and enterprise software. A major AI infrastructure player.", pe: 35, marketCapB: 3800, dividendYield: 0.7 },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", basePrice: 186.5, vol: 0.48, beta: 1.7, blurb: "Designs the GPUs that power most AI training. Extremely high growth — and high volatility.", pe: 48, marketCapB: 4500 },
  { symbol: "AMD", name: "AMD", sector: "Technology", basePrice: 214.2, vol: 0.5, beta: 1.8, blurb: "CPUs and GPUs for PCs, servers and AI. Competes with Intel and NVIDIA.", pe: 60, marketCapB: 350 },
  { symbol: "GOOGL", name: "Alphabet", sector: "Communication", basePrice: 278.1, vol: 0.28, beta: 1.05, blurb: "Google Search, YouTube and Google Cloud. Advertising is still the core profit engine.", pe: 25, marketCapB: 3350, dividendYield: 0.3 },
  { symbol: "META", name: "Meta Platforms", sector: "Communication", basePrice: 704.6, vol: 0.36, beta: 1.25, blurb: "Facebook, Instagram, WhatsApp. Ad-driven, spending heavily on AI and devices.", pe: 27, marketCapB: 1780, dividendYield: 0.3 },
  { symbol: "NFLX", name: "Netflix", sector: "Communication", basePrice: 1162.0, vol: 0.34, beta: 1.2, blurb: "The largest streaming service. Growth now leans on ads and price increases.", pe: 45, marketCapB: 495 },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer", basePrice: 231.8, vol: 0.3, beta: 1.15, blurb: "E-commerce plus AWS, the biggest cloud provider. AWS drives most of the profit.", pe: 36, marketCapB: 2460 },
  { symbol: "TSLA", name: "Tesla", sector: "Consumer", basePrice: 418.9, vol: 0.58, beta: 2.0, blurb: "Electric vehicles, energy storage and autonomy bets. Famous for big swings.", pe: 150, marketCapB: 1350 },
  { symbol: "COST", name: "Costco", sector: "Consumer", basePrice: 948.3, vol: 0.18, beta: 0.75, blurb: "Membership warehouse retail. Steady, defensive and richly valued.", pe: 52, marketCapB: 420, dividendYield: 0.5 },
  { symbol: "KO", name: "Coca-Cola", sector: "Consumer", basePrice: 69.4, vol: 0.14, beta: 0.55, blurb: "A classic defensive dividend stock. Slow growth, very stable cash flows.", pe: 24, marketCapB: 300, dividendYield: 2.9 },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", basePrice: 302.5, vol: 0.22, beta: 1.05, blurb: "The largest US bank. Earnings move with interest rates and the economy.", pe: 15, marketCapB: 830, dividendYield: 2.0 },
  { symbol: "V", name: "Visa", sector: "Financials", basePrice: 348.7, vol: 0.19, beta: 0.9, blurb: "Runs a global payments network and earns a small fee on every swipe.", pe: 31, marketCapB: 680, dividendYield: 0.7 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", basePrice: 189.2, vol: 0.15, beta: 0.5, blurb: "Pharmaceuticals and medical devices. A long-time dividend payer.", pe: 18, marketCapB: 455, dividendYield: 2.8 },
  { symbol: "LLY", name: "Eli Lilly", sector: "Healthcare", basePrice: 921.6, vol: 0.32, beta: 0.6, blurb: "Pharma growth story driven by obesity and diabetes drugs.", pe: 62, marketCapB: 870, dividendYield: 0.6 },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", basePrice: 117.3, vol: 0.24, beta: 0.85, blurb: "Integrated oil & gas. Profits track oil prices closely.", pe: 15, marketCapB: 500, dividendYield: 3.4 },
];

export const TICKER_MAP: Record<string, Ticker> = Object.fromEntries(TICKERS.map((t) => [t.symbol, t]));

// ---------- seeded randomness ----------
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Bar {
  t: number; // ms timestamp
  c: number; // close
}

const DAY = 86_400_000;

/** 1 year of daily closes ending at the ticker's base price. Deterministic per symbol. */
export function generateHistory(t: Ticker, days = 260): Bar[] {
  const rand = mulberry32(hashString(t.symbol));
  const dailyVol = t.vol / Math.sqrt(252);
  const drift = 0.08 / 252;
  const raw: number[] = [1];
  for (let i = 1; i < days; i++) {
    // occasional regime shocks make charts feel real (earnings gaps)
    const shock = rand() < 0.02 ? gaussian(rand) * dailyVol * 4 : 0;
    raw.push(raw[i - 1] * Math.exp(drift + gaussian(rand) * dailyVol + shock));
  }
  const scale = t.basePrice / raw[raw.length - 1];
  const now = Date.now();
  const end = now - (now % DAY);
  const bars: Bar[] = [];
  let d = end;
  const dates: number[] = [];
  // walk backwards over weekdays
  while (dates.length < days) {
    const wd = new Date(d).getUTCDay();
    if (wd !== 0 && wd !== 6) dates.unshift(d);
    d -= DAY;
  }
  for (let i = 0; i < days; i++) bars.push({ t: dates[i], c: round2(raw[i] * scale) });
  return bars;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ---------- news engine ----------
export type NewsKind = "earnings" | "analyst" | "macro" | "product" | "guidance";

export interface NewsItem {
  id: string;
  symbol: string | null; // null = market-wide
  headline: string;
  kind: NewsKind;
  impact: number; // fractional move applied
  at: number;
  lesson?: string; // lesson slug that explains this kind of event
}

const POS: Record<Exclude<NewsKind, "macro">, string[]> = {
  earnings: ["{n} beats earnings estimates as revenue jumps", "{n} posts record quarterly profit"],
  analyst: ["Analyst upgrades {n} to Buy, raises target", "{n} added to a major bank's top-picks list"],
  product: ["{n} unveils new product line to strong early demand", "{n} lands a multi-year enterprise contract"],
  guidance: ["{n} raises full-year guidance", "{n} announces $20B share buyback"],
};
const NEG: Record<Exclude<NewsKind, "macro">, string[]> = {
  earnings: ["{n} misses on revenue; margins shrink", "{n} earnings disappoint as costs climb"],
  analyst: ["Analyst downgrades {n} on valuation concerns", "{n} cut to Neutral after a strong run"],
  product: ["{n} delays flagship launch", "Regulators open an inquiry into {n}"],
  guidance: ["{n} cuts outlook citing weaker demand", "{n} CFO departs unexpectedly"],
};
const MACRO_POS = ["Inflation cools more than expected; stocks rally", "Fed signals rate cuts ahead", "Jobs report shows a steady, healthy economy"];
const MACRO_NEG = ["Hot inflation print sparks rate fears", "Bond yields spike; growth stocks slide", "Weak manufacturing data rattles markets"];

export const NEWS_LESSON: Record<NewsKind, string> = {
  earnings: "earnings-and-eps",
  analyst: "reading-the-news",
  product: "reading-the-news",
  guidance: "earnings-and-eps",
  macro: "how-the-market-moves",
};

export function randomNews(rand: () => number = Math.random): NewsItem {
  const macro = rand() < 0.2;
  const positive = rand() < 0.55;
  const id = Math.random().toString(36).slice(2, 10);
  if (macro) {
    const list = positive ? MACRO_POS : MACRO_NEG;
    return {
      id,
      symbol: null,
      headline: list[Math.floor(rand() * list.length)],
      kind: "macro",
      impact: (positive ? 1 : -1) * (0.004 + rand() * 0.008),
      at: Date.now(),
      lesson: NEWS_LESSON.macro,
    };
  }
  const stocks = TICKERS.filter((t) => t.sector !== "Index ETF");
  const t = stocks[Math.floor(rand() * stocks.length)];
  const kinds: Exclude<NewsKind, "macro">[] = ["earnings", "analyst", "product", "guidance"];
  const kind = kinds[Math.floor(rand() * kinds.length)];
  const list = (positive ? POS : NEG)[kind];
  const size = kind === "earnings" || kind === "guidance" ? 0.03 + rand() * 0.06 : 0.01 + rand() * 0.03;
  return {
    id,
    symbol: t.symbol,
    headline: list[Math.floor(rand() * list.length)].replace("{n}", t.name),
    kind,
    impact: (positive ? 1 : -1) * size * (t.vol / 0.3),
    at: Date.now(),
    lesson: NEWS_LESSON[kind],
  };
}
