import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandLockup } from "@/components/brand";
import { LEGAL_PAGES } from "@/lib/legal";
import { RefCapture } from "@/components/ref-capture";

/**
 * Header and footer shared by the landing page and every public page (lessons, tools, share cards).
 * No app shell and no consent gate, so crawlers and visitors can read the page before agreeing to anything.
 */
const NAV = [
  { href: "/lessons", label: "Lessons" },
  { href: "/tools/position-size-calculator", label: "Calculators" },
  { href: "/community", label: "Community" },
] as const;

export function PublicHeader() {
  return (
    <header className="border-b border-rule">
      <RefCapture />
      <div className="mx-auto flex h-14 max-w-[1264px] items-center justify-between gap-3 px-4 lg:px-8">
        <Link href="/" aria-label={`${BRAND.name} home`} className="inline-flex min-h-10 items-center rounded-md">
          <BrandLockup />
        </Link>
        <nav aria-label="Site" className="flex items-center gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hidden min-h-10 items-center px-3 text-[15px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
              {n.label}
            </Link>
          ))}
          <Link href="/dashboard" className="btn btn-primary ml-2">
            Open the app
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto max-w-[1264px] px-4 py-10 lg:px-8">
        <BrandLockup size="lg" />
        <p className="mt-3 max-w-[72ch] t-small text-ink-2">{BRAND.name} is an educational simulator. No real money, no real trades. Prices and news are generated. Not investment advice. Not affiliated with or endorsed by any company named.</p>
        <ul className="mt-3 flex flex-wrap gap-x-5" aria-label="Learn">
          <li>
            <Link href="/lessons" className="link inline-flex min-h-10 items-center t-small">
              Free lessons
            </Link>
          </li>
          <li>
            <Link href="/tools/position-size-calculator" className="link inline-flex min-h-10 items-center t-small">
              Position size calculator
            </Link>
          </li>
          <li>
            <Link href="/tools/reward-risk-calculator" className="link inline-flex min-h-10 items-center t-small">
              Reward to risk calculator
            </Link>
          </li>
        </ul>
        <ul className="flex flex-wrap gap-x-5" aria-label="Legal">
          {LEGAL_PAGES.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link inline-flex min-h-10 items-center t-small">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
