"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { MotionProvider } from "@/components/motion/provider";
import { BOX, TICK_D } from "@/lib/marks-geometry";

type S = "done" | "todo" | "na";
const ROWS: { trade: string; c: S[]; score: number }[] = [
  { trade: "Buy NVDA", c: ["done", "done", "done", "done", "done"], score: 98 },
  { trade: "Buy TSLA", c: ["done", "todo", "todo", "todo", "todo"], score: 31 },
  { trade: "Buy KO", c: ["done", "done", "done", "todo", "done"], score: 74 },
  { trade: "Buy AMD", c: ["todo", "todo", "todo", "done", "done"], score: 49 },
];
const COLS = ["Reason", "Stop", "Risk", "Target", "Size"];

function Cell({ s, col, inView, reduce }: { s: S; col: number; inView: boolean; reduce: boolean | null }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} className="mx-auto overflow-visible" aria-hidden>
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={2} fill="none" stroke="var(--edge)" strokeWidth={1.5} />
      {s === "done" && (
        <m.path
          d={TICK_D}
          fill="none"
          stroke="var(--pencil)"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.16, delay: col * 0.16, ease: [0.2, 0.7, 0.3, 1] }}
        />
      )}
    </svg>
  );
}

/** The landing's one in-view reveal: the example check record ticks column by column, once. */
export function RecordExample() {
  const ref = useRef<HTMLTableElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const kept = COLS.map((_, i) => ROWS.filter((r) => r.c[i] === "done").length);
  return (
    <MotionProvider>
      <table ref={ref} className="w-full t-table">
        <caption className="sr-only">Example check record: four made-up trades and which of the five checks each one kept</caption>
        <thead>
          <tr className="border-b border-rule-strong t-micro text-ink-2">
            <th scope="col" className="py-2 pr-2 text-left font-medium">Trade</th>
            {COLS.map((c) => (
              <th key={c} scope="col" className="w-11 py-2 text-center font-medium">
                {c}
              </th>
            ))}
            <th scope="col" className="w-12 py-2 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.trade} className="border-b border-rule">
              <th scope="row" className="py-2 pr-2 text-left font-medium">
                {r.trade}
              </th>
              {r.c.map((s, i) => (
                <td key={i} className="py-2">
                  <Cell s={s} col={i} inView={inView} reduce={reduce} />
                  <span className="sr-only">{COLS[i]}: {s === "done" ? "kept" : "missed"}</span>
                </td>
              ))}
              <td className="tnum py-2 text-right font-semibold text-pencil t-wide">{r.score}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="ledger-total">
          <tr>
            <th scope="row" className="py-2 pr-2 text-left font-semibold">
              Checks kept
            </th>
            {kept.map((k, i) => (
              <td key={i} className="tnum py-2 text-center font-semibold">
                {k}/4
              </td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </MotionProvider>
  );
}
