"use client";

import { useEffect } from "react";

/**
 * The landing page's single orchestrated moment (docs/design/direction.md §10.4), run with GSAP.
 * Renders nothing. GSAP is imported on demand here, so it never ships to app routes.
 * The markup is server-rendered in its final state; an inline script marks it "pending" (only when motion
 * is allowed) and a 1.5s safety timer un-hides it if this never runs.
 */
export function HeroMotion() {
  useEffect(() => {
    let cancelled = false;
    let revertAll: (() => void) | undefined;
    (async () => {
      const [{ gsap }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/SplitText")]);
      if (cancelled) return;
      gsap.registerPlugin(SplitText);
      const root = document.documentElement;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (root.dataset.hero !== "pending") return; // the safety timer already showed the final state
        clearTimeout((window as unknown as { __heroSafety?: number }).__heroSafety);
        const h1 = document.querySelector<HTMLElement>("[data-hero-line]");
        const ticks = gsap.utils.toArray<SVGPathElement>("[data-hero-tick]");
        const loop = document.querySelector("[data-hero-loop]");
        const note = document.querySelector("[data-hero-note]");
        const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]");
        if (!h1) return;
        const split = SplitText.create(h1, { type: "lines", mask: "lines" });
        gsap.set([...ticks, loop], { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set([note, ...fades], { opacity: 0 });
        gsap.set([h1, note, ...fades], { visibility: "visible" });
        delete root.dataset.hero;
        const tl = gsap.timeline({ onComplete: () => split.revert() });
        tl.from(split.lines, { yPercent: 100, duration: 0.52, ease: "power3.out", stagger: 0.09 }, 0)
          .to(fades, { opacity: 1, duration: 0.24 }, 0.25)
          .to(ticks, { strokeDashoffset: 0, duration: 0.22, ease: "power2.out", stagger: 0.16 }, 0.6)
          .to(loop, { strokeDashoffset: 0, duration: 0.48, ease: "power2.inOut" }, 1.54)
          .to(note, { opacity: 1, duration: 0.2 }, 2.06);
        return () => {
          tl.kill();
          split.revert();
        };
      });
      revertAll = () => mm.revert();
    })().catch(() => {
      delete document.documentElement.dataset.hero;
    });
    return () => {
      cancelled = true;
      revertAll?.();
    };
  }, []);
  return null;
}
