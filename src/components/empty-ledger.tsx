"use client";

/** Empty state: the ledger's own column heads, two blank ruled rows, one sentence and one action. */
export function EmptyLedger({ cols, text, action }: { cols: string[]; text: string; action?: React.ReactNode }) {
  return (
    <div>
      <div className="grid border-b border-rule-strong py-2 t-micro text-ink-2" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0,1fr))` }} aria-hidden>
        {cols.map((c, i) => (
          <span key={c} className={i ? "text-right" : ""}>
            {c}
          </span>
        ))}
      </div>
      <div className="h-11 border-b border-rule" aria-hidden />
      <div className="h-11 border-b border-rule" aria-hidden />
      <p className="mt-4 t-small text-ink-2">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
