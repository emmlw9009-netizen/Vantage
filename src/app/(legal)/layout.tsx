import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { FOOTER_DISCLAIMER } from "@/lib/legal";
import { LegalNav } from "@/components/legal-nav";

/** Public, server-rendered legal pages: no app shell, no consent gate, so anyone can read them before agreeing. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-lg">
            <span className="grid size-8 place-items-center rounded-[9px] bg-accent text-accent-ink">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span className="font-display text-[21px] font-bold leading-none tracking-tight">{BRAND.name}</span>
          </Link>
          <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[10px] border border-line px-4 text-sm font-medium hover:bg-panel">
            Open the app
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1080px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10 md:py-12">
        <LegalNav />
        <main id="main" className="min-w-0">
          {children}
          <p className="mt-12 border-t border-line pt-4 font-sans text-sm text-muted">{FOOTER_DISCLAIMER}</p>
        </main>
      </div>
    </div>
  );
}
