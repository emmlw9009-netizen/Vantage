"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

/** Height + opacity reveal for content that appears because of an action (Motion Primitives "Transition Panel" pattern). */
export function Reveal({ show, children, className }: { show: boolean; children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <m.div
          key="reveal"
          className={className}
          style={{ overflow: "hidden" }}
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Cross-fades between keyed panels (tabs, filters, onboarding steps). `direction` adds a 12px horizontal offset. */
export function TransitionPanel({ panelKey, children, direction = 0, className }: { panelKey: string | number; children: React.ReactNode; direction?: number; className?: string }) {
  const reduce = useReducedMotion();
  const x = reduce ? 0 : direction * 12;
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <m.div
        key={panelKey}
        className={className}
        initial={reduce ? false : { opacity: 0, x }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -x, transition: { duration: 0.12 } }}
        transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
