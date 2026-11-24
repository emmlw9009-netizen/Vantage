import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { ArrowRight, CandlestickChart, CheckCircle2, GraduationCap, ShieldAlert, Sparkles, Users, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/shell";

const FEATURES = [
  { icon: CandlestickChart, title: "A live market to practice in", body: "18 real companies and index ETFs with simulated prices that tick every two seconds and react to breaking news. Start with $100,000 of paper money." },
  { icon: Sparkles, title: "An AI coach that reviews every trade", body: "Nova scores each decision on sizing, risk and discipline, then tells you exactly what to do better. Not just whether you made money." },
  { icon: GraduationCap, title: "A course that connects to your trades", body: "19 bite-sized lessons with quizzes and hands-on missions. Your mistakes link straight to the lesson that fixes them." },
  { icon: Users, title: "A community that rewards process", body: "Share ideas, post lessons and climb a leaderboard ranked on discipline, so luck doesn't win." },
];

const STEPS = [
  { n: "01", t: "Plan", d: "Write a thesis and set your stop-loss and target. The ticket sizes the position from your risk." },
  { n: "02", t: "Trade", d: "Place market, limit or bracket orders in a live simulated market." },
  { n: "03", t: "Get coached", d: "Nova grades the decision in seconds and links the lesson you need." },
  { n: "04", t: "Level up", d: "Earn XP, finish missions and share what you learned." },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/learn" className="hidden rounded-full px-3 py-2 text-ink-2 hover:text-ink sm:block">Course</Link>
          <Link href="/community" className="hidden rounded-full px-3 py-2 text-ink-2 hover:text-ink sm:block">Community</Link>
          <Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 font-semibold text-bg">Open app</Link>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-xs font-medium text-ink-2 backdrop-blur">
            <Sparkles className="size-3.5 text-coach" /> AI-coached paper trading
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
            Learn the market
            <br />
            <span className="bg-gradient-to-r text-accent">with a coach in your corner.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2">Paper trade a live market, get instant AI feedback on every decision, and build real skill before you risk a single real dollar.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-ink shadow-[0_8px_30px_-8px_var(--accent)] hover:brightness-95">
              Start with $100k paper money <ArrowRight className="size-4" />
            </Link>
            <Link href="/learn" className="inline-flex h-12 items-center rounded-full border border-line bg-panel/70 px-6 font-medium backdrop-blur hover:bg-panel">Browse the course</Link>
          </div>
          <p className="mt-4 text-xs text-muted">Free · no sign-up needed to try · not financial advice</p>
        </div>

        {/* product preview */}
        <div className="relative mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-5">
          <div className="card p-5 md:col-span-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted">NVDA · NVIDIA</div>
                <div className="tnum mt-1 text-4xl font-semibold tracking-tight">$186.52</div>
                <div className="tnum text-sm font-medium text-up">▲ +$3.18 (+1.73%) today</div>
              </div>
              <div className="flex rounded-full border border-line bg-panel-2 p-0.5 text-xs">
                {["1D", "1M", "3M", "1Y"].map((r, i) => (
                  <span key={r} className={i === 0 ? "rounded-full bg-panel px-3 py-1 font-medium shadow-sm" : "px-3 py-1 text-muted"}>{r}</span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 600 200" className="mt-4 h-48 w-full" aria-hidden>
              <defs>
                <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[40, 90, 140].map((y) => (
                <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="var(--grid)" />
              ))}
              <path d="M0,150 L40,140 L80,146 L120,120 L160,128 L200,104 L240,110 L280,86 L320,96 L360,72 L400,80 L440,58 L480,66 L520,44 L560,52 L600,30 L600,200 L0,200Z" fill="url(#lg)" />
              <path d="M0,150 L40,140 L80,146 L120,120 L160,128 L200,104 L240,110 L280,86 L320,96 L360,72 L400,80 L440,58 L480,66 L520,44 L560,52 L600,30" fill="none" stroke="var(--series-1)" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="200" cy="104" r="7" fill="var(--up)" stroke="var(--panel)" strokeWidth="2" />
              <text x="200" y="107.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">B</text>
            </svg>
          </div>
          <div className="card p-5 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="relative size-14">
                <svg viewBox="0 0 56 56" className="-rotate-90">
                  <circle cx="28" cy="28" r="23" fill="none" stroke="var(--panel-2)" strokeWidth="5" />
                  <circle cx="28" cy="28" r="23" fill="none" stroke="var(--up)" strokeWidth="5" strokeLinecap="round" strokeDasharray="126 145" />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-semibold">87</span>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">Coach review</div>
                <div className="font-semibold">Disciplined entry on NVDA</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-panel-2 p-3.5 text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-coach"><Sparkles className="size-3.5" /> Nova</div>
              Great structure: you risked 0.9% with a clear invalidation level. Your target sits right under resistance, so consider scaling out half there.
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" /> Sensible size: 6.2% of your account</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" /> Reward-to-risk 2.4 : 1</li>
              <li className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" /> 41% of your account is now in Technology</li>
              <li className="flex gap-2"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-down" /> Earnings on deck: size down into events</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft"><f.icon className="size-5" /></span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">The loop that builds real skill</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl border border-line p-6">
              <div className="tnum text-sm font-semibold text-accent">{s.n}</div>
              <div className="mt-2 text-lg font-semibold">{s.t}</div>
              <p className="mt-1 text-sm text-ink-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="card overflow-hidden p-10 text-center sm:p-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Your first trade is on us.</h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-2">It&apos;s $100,000 of paper money, so mistakes cost nothing and every lesson sticks.</p>
          <Link href="/dashboard" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-ink hover:brightness-95">
            Open {BRAND.name} <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-muted">{BRAND.name} is an educational simulator. Prices and news are generated. Nothing here is investment advice.</p>
      </section>
    </div>
  );
}
