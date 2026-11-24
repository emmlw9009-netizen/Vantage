"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/format";

export function LegalNav() {
  const path = usePathname();
  return (
    <nav aria-label="Legal pages" className="min-w-0 md:sticky md:top-20">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {LEGAL_PAGES.map((p) => {
          const active = path === p.href;
          return (
            <li key={p.href} className="shrink-0">
              <Link
                href={p.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-10 items-center rounded-[10px] px-3 text-sm font-medium", active ? "bg-panel text-ink ring-1 ring-line" : "text-ink-2 hover:bg-panel/60 hover:text-ink")}
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
