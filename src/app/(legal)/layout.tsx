import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { FOOTER_DISCLAIMER } from "@/lib/legal";
import { LegalNav } from "@/components/legal-nav";

/** Public, server-rendered legal pages: no app shell, no consent gate, so anyone can read them before agreeing. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-[1264px] items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center rounded-md">
            <span className="t-xwide text-[19px] font-semibold leading-none tracking-[-0.01em] lg:text-[21px]">{BRAND.name}</span>
          </Link>
          <Link href="/dashboard" className="btn btn-secondary">
            Open the app
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1264px] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-8 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-16 lg:px-8 lg:py-12">
        <LegalNav />
        <main id="main" className="min-w-0">
          {children}
          <p className="mt-16 max-w-[66ch] border-t border-rule pt-4 font-sans t-small text-ink-2">{FOOTER_DISCLAIMER}</p>
        </main>
      </div>
    </div>
  );
}
