"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useReducedMotion, useSpring } from "motion/react";

/** Subtle pointer tilt (≤ 2.5°), fine pointers only. Used on exactly one element: the landing hero ticket. */
export function Tilt({ children, className, max = 2.5 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 150, damping: 20 });
  const ry = useSpring(0, { stiffness: 150, damping: 20 });
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <div style={{ perspective: 1200 }} className={className}>
      <m.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
        {children}
      </m.div>
    </div>
  );
}
