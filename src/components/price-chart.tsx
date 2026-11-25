"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bar } from "@/lib/market-data";
import { cn, usd } from "@/lib/format";
import { Tri } from "./marks";

interface Props {
  data: Bar[];
  height?: number;
  /** Reference line (previous close, starting balance). Solid, labelled; never dashed. */
  baseline?: number;
  baselineLabel?: string;
  formatTime?: (t: number) => string;
  formatValue?: (v: number) => string;
  /** Accessible name; also the legend name of the main series when an overlay is on. */
  label: string;
  seriesLabel?: string;
  markers?: { t: number; side: "buy" | "sell"; note?: string }[];
  /** Optional second series (e.g. the 50-day average). Adds a legend and a direct label. */
  overlay?: { label: string; data: Bar[] };
  yDomain?: [number, number];
}

const PAD = { top: 12, right: 64, bottom: 26, left: 0 };

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/**
 * Line chart per the dataviz rules: one y-axis (right), 2px lines, no area fill, solid hairline grid,
 * a hover/keyboard crosshair with a tooltip, a legend when there are two series, and a table view.
 */
export function PriceChart({ data, height = 280, baseline, baselineLabel, formatTime, formatValue = (v) => usd(v), label, seriesLabel, markers, overlay, yDomain }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [live, setLive] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(0, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const overlayAt = useMemo(() => {
    if (!overlay) return null;
    const map = new Map(overlay.data.map((b) => [b.t, b.c]));
    return data.map((d) => map.get(d.t));
  }, [overlay, data]);

  const geo = useMemo(() => {
    if (data.length < 2 || width < 120) return null;
    const vals = data.map((d) => d.c);
    if (baseline != null) vals.push(baseline);
    if (overlayAt) overlayAt.forEach((v) => v != null && vals.push(v));
    let min = yDomain ? yDomain[0] : Math.min(...vals);
    let max = yDomain ? yDomain[1] : Math.max(...vals);
    if (!yDomain) {
      const pad = (max - min) * 0.1 || max * 0.01;
      min -= pad;
      max += pad;
    }
    const w = width - PAD.left - PAD.right;
    const h = height - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (data.length - 1)) * w;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * h;
    let line = "";
    data.forEach((d, i) => (line += `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.c).toFixed(1)}`));
    let oline = "";
    let lastO = -1;
    if (overlayAt) {
      let started = false;
      overlayAt.forEach((v, i) => {
        if (v == null) return;
        oline += `${started ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        started = true;
        lastO = i;
      });
    }
    const ticks = niceTicks(min, max, 4).filter((t) => t >= min && t <= max);
    const xTicks = [0, Math.floor((data.length - 1) / 3), Math.floor(((data.length - 1) * 2) / 3), data.length - 1];
    return { x, y, line, oline, lastO, ticks, xTicks, w, h };
  }, [data, width, height, baseline, overlayAt, yDomain]);

  const fmtT = formatTime ?? ((t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }));

  const idxAt = (clientX: number, rect: DOMRect) => {
    if (!geo) return null;
    const px = clientX - rect.left - PAD.left;
    return Math.max(0, Math.min(data.length - 1, Math.round((px / geo.w) * (data.length - 1))));
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => setHover(idxAt(e.clientX, e.currentTarget.getBoundingClientRect()));
  const onKey = (e: React.KeyboardEvent) => {
    if (!data.length) return;
    let n = hover ?? data.length - 1;
    if (e.key === "ArrowLeft") n = Math.max(0, n - 1);
    else if (e.key === "ArrowRight") n = Math.min(data.length - 1, n + 1);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = data.length - 1;
    else if (e.key === "Escape") return setHover(null);
    else return;
    e.preventDefault();
    setHover(n);
    setLive(`${fmtT(data[n].t)}: ${formatValue(data[n].c)}`);
  };

  const markerIdx = useMemo(() => {
    if (!data.length) return [];
    return (markers ?? [])
      .map((m) => {
        if (m.t < data[0].t || m.t > data[data.length - 1].t + 60_000) return null;
        let best = 0;
        for (let i = 0; i < data.length; i++) if (Math.abs(data[i].t - m.t) < Math.abs(data[best].t - m.t)) best = i;
        return { i: best, side: m.side, note: m.note };
      })
      .filter(Boolean) as { i: number; side: "buy" | "sell"; note?: string }[];
  }, [markers, data]);

  const hv = hover != null ? data[hover] : null;
  const first = data[0]?.c;

  return (
    <div className="min-w-0">
      {overlay && (
        <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 t-small text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-series-1" aria-hidden />
            {seriesLabel ?? label}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-series-2" aria-hidden />
            {overlay.label}
          </li>
        </ul>
      )}
      <div
        ref={ref}
        className="relative w-full min-w-0 select-none rounded-sm"
        style={{ height }}
        tabIndex={geo ? 0 : -1}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        aria-label={geo ? `${label}. From ${formatValue(data[0].c)} to ${formatValue(data[data.length - 1].c)}. Use the arrow keys to read values.` : undefined}
        role={geo ? "img" : undefined}
      >
        {!geo ? (
          <div className="grid h-full place-items-center border-y border-rule t-small text-ink-2">{data.length < 2 ? "The chart fills in as prices update." : ""}</div>
        ) : (
          <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="touch-none overflow-visible" aria-hidden>
            {geo.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + geo.w} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--grid)" strokeWidth={1} />
                <text x={width - PAD.right + 10} y={geo.y(t) + 4} fontSize={12} fill="var(--muted)" style={{ fontVariantNumeric: "tabular-nums", fontStretch: "87.5%" }}>
                  {formatValue(t).replace(/\.00$/, "")}
                </text>
              </g>
            ))}
            {geo.xTicks
              .filter((i, k, arr) => k === 0 || (fmtT(data[i].t) !== fmtT(data[arr[k - 1]].t) && geo.x(i) - geo.x(arr[k - 1]) > 90))
              .map((i, k, arr) => (
                <text key={i} x={geo.x(i)} y={height - 6} fontSize={12} fill="var(--muted)" style={{ fontStretch: "87.5%" }} textAnchor={k === 0 ? "start" : k === arr.length - 1 && i === data.length - 1 ? "end" : "middle"}>
                  {fmtT(data[i].t)}
                </text>
              ))}
            {baseline != null && (
              <g>
                <line x1={PAD.left} x2={PAD.left + geo.w} y1={geo.y(baseline)} y2={geo.y(baseline)} stroke="var(--rule-strong)" strokeWidth={1} />
                {baselineLabel && (
                  <text x={PAD.left + geo.w - 2} y={geo.y(baseline) - 6} textAnchor="end" fontSize={12} fill="var(--ink-2)" stroke="var(--paper)" strokeWidth={4} strokeLinejoin="round" style={{ fontStretch: "87.5%", paintOrder: "stroke" }}>
                    {baselineLabel}
                  </text>
                )}
              </g>
            )}
            {geo.oline && <path d={geo.oline} fill="none" stroke="var(--series-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            {geo.oline && geo.lastO >= 0 && overlayAt?.[geo.lastO] != null && (
              <text x={geo.x(geo.lastO) - 4} y={geo.y(overlayAt[geo.lastO]!) - 8} fontSize={12} fill="var(--ink-2)" textAnchor="end" style={{ fontStretch: "87.5%" }}>
                {overlay?.label}
              </text>
            )}
            <path d={geo.line} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {markerIdx.map((mk, k) => {
              const cx = geo.x(mk.i);
              const cy = geo.y(data[mk.i].c) + (mk.side === "buy" ? 12 : -12);
              return (
                <g key={k} transform={`translate(${cx},${cy})`}>
                  <title>{mk.note ?? (mk.side === "buy" ? "Your buy" : "Your sell")}</title>
                  <circle r={12} fill="transparent" />
                  <path d={mk.side === "buy" ? "M0 -6 L6 5 H-6 Z" : "M0 6 L6 -5 H-6 Z"} fill="var(--ink)" stroke="var(--paper)" strokeWidth={2} strokeLinejoin="round" />
                </g>
              );
            })}
            <circle cx={geo.x(data.length - 1)} cy={geo.y(data[data.length - 1].c)} r={4} fill="var(--series-1)" stroke="var(--paper)" strokeWidth={2} />
            {hv && hover != null && (
              <g pointerEvents="none">
                <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.top} y2={PAD.top + geo.h} stroke="var(--ink-2)" strokeWidth={1} />
                <circle cx={geo.x(hover)} cy={geo.y(hv.c)} r={4} fill="var(--series-1)" stroke="var(--paper)" strokeWidth={2} />
                {overlayAt?.[hover] != null && <circle cx={geo.x(hover)} cy={geo.y(overlayAt[hover]!)} r={4} fill="var(--series-2)" stroke="var(--paper)" strokeWidth={2} />}
              </g>
            )}
          </svg>
        )}
        {geo && hv && hover != null && (
          <div className="float pointer-events-none absolute top-1 z-10 px-3 py-2" style={{ left: Math.min(Math.max(geo.x(hover) - 80, 0), Math.max(0, width - 176)), minWidth: 160 }}>
            <div className="t-micro text-muted">{fmtT(hv.t)}</div>
            <div className="tnum mt-0.5 flex items-center gap-2 t-small font-semibold text-ink">
              {overlay && <span className="h-0.5 w-3 bg-series-1" aria-hidden />}
              {formatValue(hv.c)}
            </div>
            {overlayAt?.[hover] != null && (
              <div className="tnum flex items-center gap-2 t-small text-ink-2">
                <span className="h-0.5 w-3 bg-series-2" aria-hidden />
                {formatValue(overlayAt[hover]!)}
              </div>
            )}
            {first != null && (
              <div className={cn("tnum mt-0.5 inline-flex items-center gap-1 t-micro", hv.c >= first ? "text-gain" : "text-loss")}>
                {hv.c !== first && <Tri up={hv.c > first} />}
                {hv.c >= first ? "+" : "−"}
                {Math.abs(((hv.c - first) / first) * 100).toFixed(2)}% from the start
              </div>
            )}
          </div>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {live}
      </span>
      {data.length >= 2 && (
        <details className="mt-1">
          <summary className="inline-flex min-h-10 cursor-pointer items-center t-small text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink">Show table</summary>
          <table className="mt-2 w-full max-w-md t-table">
            <caption className="sr-only">{label}, last {Math.min(20, data.length)} points</caption>
            <thead>
              <tr className="border-b border-rule-strong text-left t-micro text-ink-2">
                <th scope="col" className="py-1.5 font-medium">Time</th>
                <th scope="col" className="py-1.5 text-right font-medium">{seriesLabel ?? "Value"}</th>
                {overlay && <th scope="col" className="py-1.5 text-right font-medium">{overlay.label}</th>}
              </tr>
            </thead>
            <tbody>
              {data.slice(-20).map((d, i) => {
                const oi = data.length - Math.min(20, data.length) + i;
                return (
                  <tr key={d.t} className="border-b border-rule">
                    <td className="py-1.5">{fmtT(d.t)}</td>
                    <td className="py-1.5 text-right">{formatValue(d.c)}</td>
                    {overlay && <td className="py-1.5 text-right">{overlayAt?.[oi] != null ? formatValue(overlayAt[oi]!) : "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

/** Context, not the story: ink-2, 2px, with a hairline at the reference level (e.g. previous close). */
export function Sparkline({ data, width = 96, height = 28, base }: { data: number[]; width?: number; height?: number; base?: number }) {
  if (data.length < 2) return <svg width={width} height={height} aria-hidden />;
  const vals = base != null ? [...data, base] : data;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => 2 + (1 - (v - min) / (max - min || 1)) * (height - 4);
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0 overflow-visible">
      {base != null && <line x1={0} x2={width} y1={y(base)} y2={y(base)} stroke="var(--grid)" strokeWidth={1} />}
      <path d={d} fill="none" stroke="var(--ink-2)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
