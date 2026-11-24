"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CandlestickChart, GraduationCap, LayoutDashboard, Moon, Search, Sparkles, Sun, Users, Zap } from "lucide-react";
import { cn, usd } from "@/lib/format";
import { TICKERS } from "@/lib/market-data";
import { levelFor } from "@/lib/course";
import { useApp, useEquity, STARTING_CASH } from "@/store/app";
import { Delta, Toaster } from "./ui";
import { Providers, useHydrated } from "./providers";
import { Onboarding } from "./onboarding";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-accent text-accent-ink">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 17l5-5 4 3 7-8" />
          <path d="M15 7h4v4" />
        </svg>
      </span>
      <span className="text-[17px]">Stockpilot</span>
    </Link>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    const t = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    setTheme(t ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sp-theme", next);
    } catch {}
    setTheme(next);
  };
  return (
    <button onClick={toggle} className="grid size-9 place-items-center rounded-full border border-line text-ink-2 hover:text-ink" aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function TickerSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TICKERS.slice(0, 6);
    return TICKERS.filter((t) => t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s)).slice(0, 6);
  }, [q]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("ticker-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const go = (sym: string) => {
    setQ("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    onDone?.();
    router.push(`/markets/${sym}`);
  };
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        id={autoFocus ? "ticker-search-mobile" : "ticker-search"}
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => {
          setOpen(false);
          onDone?.();
        }, 150)}
        onKeyDown={(e) => e.key === "Enter" && results[0] && go(results[0].symbol)}
        placeholder="Search…"
        className="h-10 w-full rounded-full border border-line bg-panel pl-9 pr-12 text-sm outline-none placeholder:text-muted focus:border-line-strong"
        aria-label="Search stocks"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-muted sm:block">⌘K</kbd>
      {open && results.length > 0 && (
        <div className="card absolute left-0 right-0 top-12 z-40 overflow-hidden p-1">
          {results.map((t) => (
            <button key={t.symbol} onMouseDown={() => go(t.symbol)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-panel-2">
              <span>
                <span className="font-semibold">{t.symbol}</span> <span className="text-muted">{t.name}</span>
              </span>
              <span className="text-xs text-muted">{t.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountPill() {
  const equity = useEquity();
  const xp = useApp((s) => s.xp);
  const lvl = levelFor(xp);
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link href="/learn" className="hidden items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium sm:flex" title={`${xp} XP`}>
        <Zap className="size-3.5 text-brand" />
        Lv {lvl.level} · {lvl.name}
      </Link>
      <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
        <span className="tnum text-sm font-semibold">{usd(equity, 0)}</span>
        <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} size="xs" />
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hydrated = useHydrated();
  const [mobileSearch, setMobileSearch] = useState(false);
  const onboarded = useApp((s) => s.profile.onboarded);

  return (
    <Providers>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-5 md:flex">
          <Logo className="px-2" />
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-panel text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:bg-panel/60 hover:text-ink")}
                >
                  <n.icon className={cn("size-[18px]", active && n.href === "/coach" ? "text-brand" : "")} />
                  {n.label}
                  {n.href === "/coach" && <span className="ml-auto rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-ink">AI</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-line bg-panel p-3 text-xs text-ink-2">
              <div className="mb-1 font-semibold text-ink">Simulated market</div>
              Prices and news are generated for practice. Nothing here is real money or financial advice.
            </div>
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
            <Logo className="md:hidden [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
            <div className="hidden w-full max-w-sm sm:block">
              <TickerSearch />
            </div>
            <button onClick={() => setMobileSearch(true)} className="grid size-9 place-items-center rounded-full border border-line text-ink-2 sm:hidden" aria-label="Search stocks">
              <Search className="size-4" />
            </button>
            {mobileSearch && (
              <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center bg-bg px-4 sm:hidden">
                <TickerSearch autoFocus onDone={() => setMobileSearch(false)} />
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {hydrated && <AccountPill />}
              <div className="md:hidden">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
            {hydrated ? children : <ShellSkeleton />}
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-bg/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl md:hidden">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-medium", active ? "text-ink" : "text-muted")}>
                <n.icon className="size-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Toaster />
      {hydrated && !onboarded && <Onboarding />}
    </Providers>
  );
}

function ShellSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 md:grid-cols-3">
      <div className="card h-72 md:col-span-2" />
      <div className="card h-72" />
      <div className="card h-48 md:col-span-3" />
    </div>
  );
}
