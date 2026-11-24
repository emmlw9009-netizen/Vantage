"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("./features").then((m) => m.default);

/**
 * One provider for all Motion usage (docs/design/direction.md §10).
 * - LazyMotion + `m` components keep the bundle lean; `strict` throws if a full `motion.*` component sneaks in.
 * - reducedMotion="user" turns off transform and layout animations for people who ask for less motion.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0.7, 0.3, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
