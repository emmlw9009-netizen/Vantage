"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/format";

export function LegalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Legal pages" className="min-w-0 md:sticky md:top-20">
      <ul className="flex gap-1 overflow-x-auto border-b border-rule md:flex-col md:gap-0 md:overflow-visible md:border-b-0 md:border-l">
        {LEGAL_PAGES.map((p) => {
          const active = path === p.href;
          return (
            <li key={p.href} className="shrink-0">
              <Link
                href={p.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex min-h-10 items-center px-3 t-small font-medium md:-ml-px md:border-l-2", active ? "text-ink md:border-ink" : "text-ink-2 hover:text-ink md:border-transparent")}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
