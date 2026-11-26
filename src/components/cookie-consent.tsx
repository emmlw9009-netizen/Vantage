"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PIXEL_ID, loadPixel, readMarketingChoice, saveMarketingChoice } from "@/lib/track";

/**
 * Marketing-cookie banner. Renders nothing unless NEXT_PUBLIC_META_PIXEL_ID is set and the visitor has not chosen yet.
 * "Only necessary" is as easy as "Allow": same button style, same row.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!PIXEL_ID) return;
    const c = readMarketingChoice();
    if (c === "granted") loadPixel();
    else if (c === null) setOpen(true);
  }, []);
  if (!open) return null;
  const choose = (c: "granted" | "denied") => {
    saveMarketingChoice(c);
    setOpen(false);
  };
  return (
    <div role="region" aria-label="Cookie choices" data-testid="cookie-consent" className="float fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-[560px] p-4">
      <p className="t-small">We&apos;d like to use marketing cookies to measure which pages bring people to Vantage. The practice app works the same either way.</p>
      <p className="mt-1 t-micro text-ink-2">
        See the{" "}
        <Link href="/privacy" className="link">
          privacy policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-secondary" onClick={() => choose("denied")}>
          Only necessary
        </button>
        <button className="btn btn-secondary" onClick={() => choose("granted")}>
          Allow marketing cookies
        </button>
      </div>
    </div>
  );
}
