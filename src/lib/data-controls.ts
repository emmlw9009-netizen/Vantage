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
  clear();
  // The market clock may write once more before the page unloads; clear again on the way out.
  window.addEventListener("pagehide", clear);
  window.location.assign("/dashboard");
}
