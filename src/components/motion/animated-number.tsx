"use client";

import { useEffect } from "react";
import * as m from "motion/react-m";
import { useReducedMotion, useSpring, useTransform } from "motion/react";

/**
 * Animated readout (Motion Primitives "Animated Number" pattern): springs between values, tabular figures.
 * Used only for the Home account value, the Symbol price and the process score (docs/design/direction.md §10.3).
 * `split` renders the fractional part in ink-2 inside the same span, so the whole number stays one `span.tnum`.
 */
export function AnimatedNumber({ value, format, className, split = false }: { value: number; format: (n: number) => string; className?: string; split?: boolean }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 280, damping: 32, mass: 1 });
  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  const text = useTransform(spring, (v) => format(v));
  const whole = useTransform(text, (t) => (split && t.includes(".") ? t.slice(0, t.lastIndexOf(".")) : t));
  const frac = useTransform(text, (t) => (split && t.includes(".") ? t.slice(t.lastIndexOf(".")) : ""));
  if (!split) return <m.span className={`tnum ${className ?? ""}`}>{text}</m.span>;
  return (
    <m.span className={`tnum ${className ?? ""}`}>
      <m.span>{whole}</m.span>
      <m.span className="text-ink-2">{frac}</m.span>
    </m.span>
  );
}
