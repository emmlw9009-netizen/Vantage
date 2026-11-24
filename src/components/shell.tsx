"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CandlestickChart, GraduationCap, House, Menu, Moon, NotebookPen, Search, Settings, Sparkles, Sun, Users, X } from "lucide-react";
import { cn, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { useMarket } from "@/store/market";
import { TICKERS } from "@/lib/market-data";
import { levelFor } from "@/lib/course";
import { useApp, useEquity, STARTING_CASH } from "@/store/app";
import { Delta, LivePrice, Toaster } from "./ui";
import { Providers, useHydrated } from "./providers";
import { Onboarding } from "./onboarding";
import { ConsentGate } from "./consent";
import { AiNotice } from "./ai-notice";
import { Dialog } from "./dialog";
import { FOOTER_DISCLAIMER } from "@/lib/legal";

const NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/community", label: "Community", icon: Users },
  { href: "/journal", label: "Journal", icon: NotebookPen },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-lg", className)}>
      <span className="grid size-8 place-items-center rounded-[9px] bg-accent text-accent-ink">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span className="font-display text-[21px] font-bold leading-none tracking-tight">{BRAND.name}</span>
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
    <button onClick={toggle} className="grid size-10 place-items-center rounded-[10px] border border-line text-ink-2 hover:text-ink" aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function LegalFooter({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs leading-snug text-muted">{FOOTER_DISCLAIMER} Not affiliated with or endorsed by any company named.</p>
      <ul className="mt-1 flex flex-wrap gap-x-3" aria-label="Legal">
        {FOOTER_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-8 items-center text-xs font-medium text-ink-2 underline underline-offset-2 hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneMenu({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Menu" onClose={onClose} className="max-w-sm p-5 sm:p-5 [&>h2]:sr-only">
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl font-bold">Menu</span>
        <button onClick={onClose} className="grid size-10 place-items-center rounded-[10px] border border-line text-ink-2" aria-label="Close menu">
          <X className="size-4" />
        </button>
      </div>
      <nav aria-label="More" className="mt-3 flex flex-col gap-1">
        <Link href="/settings" onClick={onClose} className="flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium hover:bg-panel-2">
          <Settings className="size-[18px]" /> Settings
        </Link>
      </nav>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm text-ink-2">
        Theme <ThemeToggle />
      </div>
      <LegalFooter className="mt-3 border-t border-line pt-3" />
    </Dialog>
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
        placeholder="Search stocks"
        className="h-10 w-full rounded-[10px] border border-line bg-panel pl-9 pr-12 text-sm outline-none placeholder:text-muted focus:border-line-strong"
        aria-label="Search stocks"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-muted sm:block">⌘K</kbd>
      {open && results.length > 0 && (
        <div className="popover absolute left-0 right-0 top-12 z-40 overflow-hidden p-1">
          {results.map((t) => (
            <button key={t.symbol} onMouseDown={() => go(t.symbol)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-panel-2">
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

function AccountValue() {
  const equity = useEquity();
  return (
    <Link href="/dashboard" className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-panel px-3" aria-label="Account value">
      <span className="tnum font-display text-lg font-semibold leading-none">{usd(equity, 0)}</span>
      <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} size="xs" className="hidden sm:inline-flex" />
    </Link>
  );
}

function TickerStrip() {
  const watchlist = useApp((s) => s.watchlist);
  const prices = useMarket((s) => s.prices);
  const prevClose = useMarket((s) => s.prevClose);
  return (
    <ul className="hidden min-w-0 items-center gap-1 xl:flex" aria-label="Watchlist">
      {watchlist.slice(0, 5).map((sym) => {
        const px = prices[sym];
        const prev = prevClose[sym];
        if (px == null || !prev) return null;
        return (
          <li key={sym}>
            <Link href={`/markets/${sym}`} className="flex flex-col rounded-lg px-2.5 py-1 hover:bg-panel-2">
              <span className="text-xs font-semibold text-ink-2">{sym}</span>
              <span className="flex items-baseline gap-1.5">
                <LivePrice value={px} format={(n) => usd(n)} className="text-sm font-medium" />
                <Delta ratio={px / prev - 1} size="xs" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LevelReadout() {
  const xp = useApp((s) => s.xp);
  const lvl = levelFor(xp);
  return (
    <Link href="/learn" className="block rounded-[10px] px-3 py-2 hover:bg-panel" title={`${xp} XP`}>
      <div className="text-sm font-semibold">Level {lvl.level}</div>
      <div className="text-xs text-ink-2">{lvl.name}</div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${lvl.progress * 100}%` }} />
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hydrated = useHydrated();
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const onboarded = useApp((s) => s.profile.onboarded);

  return (
    <Providers>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-line px-4 py-5 md:flex">
          <Logo className="px-2" />
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition", active ? "bg-panel text-ink ring-1 ring-line" : "text-ink-2 hover:bg-panel/60 hover:text-ink")}
                >
                  <n.icon className={cn("size-[18px]", n.href === "/coach" && "text-coach", active && n.href !== "/coach" && "text-accent")} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3">
            {hydrated && <LevelReadout />}
            <Link
              href="/settings"
              aria-current={path.startsWith("/settings") ? "page" : undefined}
              className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition", path.startsWith("/settings") ? "bg-panel text-ink ring-1 ring-line" : "text-ink-2 hover:bg-panel/60 hover:text-ink")}
            >
              <Settings className={cn("size-[18px]", path.startsWith("/settings") && "text-accent")} /> Settings
            </Link>
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <span className="relative grid size-2.5 place-items-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
                  <span className="relative size-2 rounded-full bg-accent" />
                </span>
                Simulated market
              </div>
              <ThemeToggle />
            </div>
            <LegalFooter className="border-t border-line pt-3" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-xl sm:px-6">
            <Logo className="md:hidden" />
            <div className="hidden w-full max-w-[16rem] shrink-0 sm:block">
              <TickerSearch />
            </div>
            {hydrated && <TickerStrip />}
            <button onClick={() => setMobileSearch(true)} className="ml-auto grid size-10 place-items-center rounded-[10px] border border-line text-ink-2 sm:hidden" aria-label="Search stocks">
              <Search className="size-4" />
            </button>
            {mobileSearch && (
              <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center bg-bg px-4 sm:hidden">
                <TickerSearch autoFocus onDone={() => setMobileSearch(false)} />
              </div>
            )}
            <div className="flex items-center gap-2 sm:ml-auto">
              {hydrated && <AccountValue />}
              <button onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-[10px] border border-line text-ink-2 hover:text-ink md:hidden" aria-label="Menu">
                <Menu className="size-4" />
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
            {hydrated ? children : <ShellSkeleton />}
            <footer className="mt-10 border-t border-line pt-4 md:hidden">
              <LegalFooter />
            </footer>
          </main>
        </div>

        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl md:hidden">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 text-[11px] font-medium", active ? "text-ink" : "text-muted")}>
                <n.icon className={cn("size-5", active && (n.href === "/coach" ? "text-coach" : "text-accent"))} />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Toaster />
      {menu && <PhoneMenu onClose={() => setMenu(false)} />}
      {hydrated && !onboarded && <Onboarding />}
      <ConsentGate />
      <AiNotice />
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
