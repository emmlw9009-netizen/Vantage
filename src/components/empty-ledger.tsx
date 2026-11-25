"use client";

/** Empty state: the ledger's own column heads, one sentence on the first row and the action directly under it. */
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
      <p className="border-b border-rule py-3 t-small text-ink-2">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
