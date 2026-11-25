"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as m from "motion/react-m";
import { Search, X } from "lucide-react";
import { cn, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { TICKERS } from "@/lib/market-data";
import { useApp, useEquity, STARTING_CASH } from "@/store/app";
import { Delta, Toaster } from "./ui";
import { Providers, useHydrated } from "./providers";
import { Onboarding } from "./onboarding";
import { ConsentGate } from "./consent";
import { AiNotice } from "./ai-notice";
import { Dialog } from "./dialog";
import { MotionProvider } from "./motion/provider";
import { BrandLockup } from "./brand";
import { FOOTER_DISCLAIMER } from "@/lib/legal";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/learn", label: "Learn" },
  { href: "/coach", label: "Coach" },
  { href: "/community", label: "Community" },
  { href: "/journal", label: "Journal" },
];

/** The wordmark. No logo mark: the name, set wide. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label={`${BRAND.name} home`} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-md", className)}>
      <BrandLockup compactBelow360 />
    </Link>
  );
}

function useTheme() {
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
  return { theme, toggle };
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button onClick={toggle} className={cn("inline-flex min-h-10 items-center rounded-md px-1 text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink", className)} aria-label={`${theme === "dark" ? "Dark theme" : "Light theme"}. Switch to ${next} theme`}>
      {theme === "dark" ? "Dark theme" : "Light theme"}
    </button>
  );
}

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function LegalLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4", className)} aria-label="Legal">
      {FOOTER_LINKS.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="link inline-flex min-h-10 items-center">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Desktop: always-visible status bar with the simulated-market disclaimer and the legal links. */
function StatusBar() {
  const path = usePathname();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] lg:block">
      <div className="mx-auto flex h-11 max-w-[1264px] items-center gap-4 px-8 t-micro text-ink-2">
        <span className="tag">Simulated</span>
        <p className="min-w-0 flex-1 truncate">
          {FOOTER_DISCLAIMER}
          <span className="hidden xl:inline"> Not affiliated with or endorsed by any company named.</span>
        </p>
        <LegalLinks />
        <span className="h-4 w-px bg-rule" aria-hidden />
        <Link href="/settings" aria-current={path.startsWith("/settings") ? "page" : undefined} className="link inline-flex min-h-10 items-center">
          Settings
        </Link>
        <ThemeToggle />
      </div>
    </footer>
  );
}

/** Phones (and the legal pages of the app): the disclaimer at the end of every page. */
function PageFooter() {
  return (
    <footer className="mt-16 border-t border-rule pt-4 t-small text-ink-2 lg:hidden">
      <p>{FOOTER_DISCLAIMER} Not affiliated with or endorsed by any company named.</p>
      <LegalLinks className="mt-1" />
    </footer>
  );
}

function PhoneMenu({ onClose }: { onClose: () => void }) {
  const equity = useEquity();
  return (
    <Dialog title="Menu" onClose={onClose} className="max-w-sm">
      <button onClick={onClose} className="absolute right-3 top-3 grid size-10 place-items-center rounded-md text-ink-2 hover:bg-well" aria-label="Close menu">
        <X className="size-4" strokeWidth={1.5} />
      </button>
      <div className="mt-4 border-b border-rule pb-4">
        <div className="t-small text-ink-2">Account value</div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
          <span className="tnum t-wide text-2xl font-medium">{usd(equity)}</span>
          <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} />
        </div>
      </div>
      <nav aria-label="More" className="border-b border-rule py-2">
        <Link href="/settings" onClick={onClose} className="flex min-h-11 items-center text-base font-medium hover:underline">
          Settings
        </Link>
      </nav>
      <div className="flex min-h-11 items-center justify-between border-b border-rule t-small text-ink-2">
        Theme <ThemeToggle />
      </div>
      <div className="pt-3 t-small text-ink-2">
        <p>{FOOTER_DISCLAIMER} Not affiliated with or endorsed by any company named.</p>
        <LegalLinks className="mt-1" />
      </div>
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
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" strokeWidth={1.5} />
      <input
        id={autoFocus ? "ticker-search-mobile" : "ticker-search"}
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          setTimeout(() => {
            setOpen(false);
            onDone?.();
          }, 150)
        }
        onKeyDown={(e) => e.key === "Enter" && results[0] && go(results[0].symbol)}
        placeholder="Search stocks"
        className="field min-h-10 pl-9 pr-12 text-[15px]"
        aria-label="Search stocks"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 t-micro text-muted lg:block">⌘K</kbd>
      {open && q.trim() && results.length === 0 && (
        <div className="float absolute left-0 right-0 top-12 z-40 px-3 py-3 t-small text-ink-2" role="status">
          No match for &ldquo;{q.trim()}&rdquo;. Try a symbol like NVDA or a name like Apple.
        </div>
      )}
      {open && results.length > 0 && (
        <div className="float absolute left-0 right-0 top-12 z-40 overflow-hidden py-1">
          {results.map((t) => (
            <button key={t.symbol} onMouseDown={() => go(t.symbol)} className="flex min-h-10 w-full items-center justify-between gap-3 px-3 text-left t-small hover:bg-well">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{t.symbol}</span> <span className="text-ink-2">{t.name}</span>
              </span>
              <span className="t-micro text-muted">{t.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountReadout() {
  const equity = useEquity();
  return (
    <Link href="/dashboard" className="flex min-h-10 shrink-0 items-center gap-3 rounded-md px-1 hover:bg-well" aria-label="Account value" title="Simulated practice account. Hypothetical results, not real money.">
      <span className="tnum t-wide text-base font-medium">{usd(equity)}</span>
      <Delta ratio={(equity - STARTING_CASH) / STARTING_CASH} size="xs" />
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
      <MotionProvider>
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 border-b border-rule bg-paper">
            <div className="relative mx-auto flex h-14 max-w-[1264px] items-center gap-3 px-4 lg:gap-8 lg:px-8">
              <Logo />
              <span className="tag lg:hidden">Simulated</span>
              <nav className="hidden h-full items-stretch gap-1 lg:flex" aria-label="Main">
                {NAV.map((n) => {
                  const active = path.startsWith(n.href);
                  return (
                    <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("relative flex items-center px-2.5 text-[15px] font-medium", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
                      {n.label}
                      {active && <m.span layoutId="nav-active" className="absolute inset-x-2.5 -bottom-px h-0.5 bg-ink" transition={{ duration: 0.2 }} />}
                    </Link>
                  );
                })}
              </nav>
              <div className="ml-auto hidden w-[260px] lg:block">
                <TickerSearch />
              </div>
              <div className="hidden lg:block">{hydrated && <AccountReadout />}</div>
              <div className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
                <button onClick={() => setMobileSearch(true)} className="grid size-10 shrink-0 place-items-center rounded-md text-ink hover:bg-well" aria-label="Search stocks">
                  <Search className="size-5" strokeWidth={1.5} />
                </button>
                <button onClick={() => setMenu(true)} className="inline-flex min-h-10 shrink-0 items-center rounded-md px-2 text-[15px] font-medium hover:bg-well">
                  Menu
                </button>
              </div>
              {mobileSearch && (
                <div className="absolute inset-0 z-50 flex items-center gap-2 bg-paper px-4 lg:hidden">
                  <TickerSearch autoFocus onDone={() => setMobileSearch(false)} />
                </div>
              )}
            </div>
          </header>

          <StatusBar />

          <main className="mx-auto w-full min-w-0 max-w-[1264px] flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-6 lg:px-8 lg:pb-[calc(var(--statusbar-h)+32px)] lg:pt-10">
            {hydrated ? children : <ShellSkeleton />}
            <PageFooter />
          </main>

          <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-14 min-w-0 items-center justify-center px-0.5 t-narrow text-[12px] font-medium", active ? "text-ink" : "text-ink-2")}>
                  {active && <span className="absolute inset-x-1.5 top-0 h-0.5 bg-ink" aria-hidden />}
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
      </MotionProvider>
    </Providers>
  );
}

function ShellSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="h-12 w-64 border-b border-rule" />
      <div className="h-11 border-b border-rule" />
      <div className="h-11 border-b border-rule" />
      <div className="h-11 border-b border-rule" />
    </div>
  );
}
