"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";

/** An SVG path that draws itself in (pathLength 0 → 1) when it mounts, unless `draw` is false or the user prefers reduced motion. */
export function DrawPath({ d, draw = false, duration = 0.16, delay = 0, ...rest }: { d: string; draw?: boolean; duration?: number; delay?: number } & Omit<React.SVGProps<SVGPathElement>, "d" | "ref" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd">) {
  const reduce = useReducedMotion();
  const animate = draw && !reduce;
  return (
    <m.path
      d={d}
      initial={animate ? { pathLength: 0 } : false}
      animate={{ pathLength: 1 }}
      transition={{ duration, delay, ease: [0.2, 0.7, 0.3, 1] }}
      {...(rest as object)}
    />
  );
}
