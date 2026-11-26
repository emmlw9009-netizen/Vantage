import { markDeleted, withWriteLock } from "@/store/sync";

/** Export and delete everything the app stores in this browser. Client only. */
const STORE_KEYS = ["sp-app", "sp-market"] as const;
const ALL_KEYS = [...STORE_KEYS, ...STORE_KEYS.map((k) => `${k}:stamp`), "sp-theme"] as const;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function buildExport() {
  return {
    app: "Vantage",
    exportedAt: new Date().toISOString(),
    note: "Everything Vantage stores in this browser: your simulated account, trades, progress, profile and the simulated market state.",
    stores: { "sp-app": read("sp-app"), "sp-market": read("sp-market") },
  };
}

export function exportFilename(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `vantage-data-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.json`;
}

export function downloadExport() {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Clears both persisted stores (and the saved theme), then reloads to onboarding. */
export function deleteAllData() {
  const clear = () => {
    for (const k of ALL_KEYS) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
  };
  // Under the cross-tab write lock, with a durable epoch written first: tabs that were open before this point can
  // never write the old account back (they reload instead).
  void withWriteLock(() => {
    markDeleted();
    clear();
    // The market clock may write once more before the page unloads; clear again on the way out.
    window.addEventListener("pagehide", clear);
    window.location.assign("/dashboard");
  });
}

/* ---------------- CSV export of trades (Premium) ---------------- */

type CsvTrade = { at: number; side: string; symbol: string; qty: number; price: number; role: string; stopLoss?: number; takeProfit?: number; realizedPnl?: number; score: number; thesis?: string };

const ROLE_WORD: Record<string, string> = { entry: "Entry", exit: "Exit", "stop-loss": "Stop-loss (automatic)", "take-profit": "Take-profit (automatic)" };

/** One CSV field. Text that a spreadsheet would run as a formula (=, +, -, @, tab, return) is prefixed with an apostrophe. */
function cell(v: string | number | undefined): string {
  if (v == null || (typeof v === "number" && !Number.isFinite(v))) return "";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) || safe !== v ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Every trade as CSV, oldest first. The header says the trades are simulated. */
export function tradesCsv(trades: CsvTrade[]): string {
  const head = ["Date", "Side", "Symbol", "Shares", "Price", "Type", "Stop-loss", "Take-profit", "Realized P&L", "Process score", "Reason", "Simulated"];
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = (t: number) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const rows = [...trades]
    .sort((a, b) => a.at - b.at)
    .map((t) => [when(t.at), t.side === "buy" ? "Buy" : "Sell", cell(t.symbol), cell(t.qty), cell(t.price), ROLE_WORD[t.role] ?? cell(t.role), cell(t.stopLoss), cell(t.takeProfit), cell(t.realizedPnl), cell(t.score), cell(t.thesis), "Yes"].join(","));
  return [head.join(","), ...rows].join("\r\n") + "\r\n";
}

export function tradesCsvFilename(d = new Date()) {
  return exportFilename(d).replace("vantage-data-", "vantage-simulated-trades-").replace(/\.json$/, ".csv");
}

export function downloadTradesCsv(trades: CsvTrade[]) {
  const blob = new Blob([tradesCsv(trades)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tradesCsvFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
