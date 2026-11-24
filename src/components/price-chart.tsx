"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Bar } from "@/lib/market-data";
import { usd } from "@/lib/format";

interface Props {
  data: Bar[];
  height?: number;
  baseline?: number; // dashed reference line (e.g. previous close / starting equity)
  baselineLabel?: string;
  formatTime?: (t: number) => string;
  formatValue?: (v: number) => string;
  label: string; // accessible name
  markers?: { t: number; side: "buy" | "sell" }[];
}

const PAD = { top: 12, right: 56, bottom: 24, left: 4 };

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export function PriceChart({ data, height = 280, baseline, baselineLabel, formatTime, formatValue = (v) => usd(v), label, markers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (data.length < 2) return null;
    const vals = data.map((d) => d.c);
    if (baseline != null) vals.push(baseline);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    const pad = (max - min) * 0.1 || max * 0.01;
    min -= pad;
    max += pad;
    const w = width - PAD.left - PAD.right;
    const h = height - PAD.top - PAD.bottom;
    const t0 = data[0].t;
    const t1 = data[data.length - 1].t;
    // index-based x keeps weekends/gaps from creating flat stretches
    const x = (i: number) => PAD.left + (i / (data.length - 1)) * w;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * h;
    let line = "";
    data.forEach((d, i) => (line += `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.c).toFixed(1)}`));
    const area = `${line}L${x(data.length - 1).toFixed(1)},${PAD.top + h}L${x(0).toFixed(1)},${PAD.top + h}Z`;
    const ticks = niceTicks(min, max, 4);
    const xTicks = [0, Math.floor((data.length - 1) / 3), Math.floor(((data.length - 1) * 2) / 3), data.length - 1];
    return { x, y, line, area, ticks, xTicks, w, h, t0, t1 };
  }, [data, width, height, baseline]);

  const fmtT = formatTime ?? ((t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!geo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / geo.w) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  if (!geo) return <div ref={ref} style={{ height }} className="grid place-items-center text-sm text-muted">Collecting data…</div>;

  const hv = hover != null ? data[hover] : null;
  const markerIdx = (markers ?? [])
    .map((m) => {
      if (m.t < data[0].t || m.t > data[data.length - 1].t + 60_000) return null;
      let best = 0;
      for (let i = 0; i < data.length; i++) if (Math.abs(data[i].t - m.t) < Math.abs(data[best].t - m.t)) best = i;
      return { i: best, side: m.side };
    })
    .filter(Boolean) as { i: number; side: "buy" | "sell" }[];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${label}. From ${formatValue(data[0].c)} to ${formatValue(data[data.length - 1].c)}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="touch-none overflow-visible"
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + geo.w} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={width - PAD.right + 8} y={geo.y(t) + 4} fontSize={11} fill="var(--muted)" className="tnum">
              {formatValue(t).replace(/\.00$/, "")}
            </text>
          </g>
        ))}
        {geo.xTicks
          // drop duplicate or crowded labels (few points / identical timestamps)
          .filter((i, k, arr) => k === 0 || (fmtT(data[i].t) !== fmtT(data[arr[k - 1]].t) && geo.x(i) - geo.x(arr[k - 1]) > 90))
          .map((i, k, arr) => (
            <text key={i} x={geo.x(i)} y={height - 6} fontSize={11} fill="var(--muted)" textAnchor={k === 0 ? "start" : k === arr.length - 1 && i === data.length - 1 ? "end" : "middle"}>
              {fmtT(data[i].t)}
            </text>
          ))}
        {baseline != null && (
          <g>
            <line x1={PAD.left} x2={PAD.left + geo.w} y1={geo.y(baseline)} y2={geo.y(baseline)} stroke="var(--axis)" strokeDasharray="3 4" strokeWidth={1} />
            {baselineLabel && (
              <text x={PAD.left + 4} y={geo.y(baseline) - 6} fontSize={10.5} fill="var(--muted)">
                {baselineLabel}
              </text>
            )}
          </g>
        )}
        <path d={geo.area} fill={`url(#g${gid})`} />
        <path d={geo.line} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {markerIdx.map((m, k) => (
          <g key={k} transform={`translate(${geo.x(m.i)},${geo.y(data[m.i].c)})`}>
            <circle r={6} fill={m.side === "buy" ? "var(--up)" : "var(--down)"} stroke="var(--chart-surface)" strokeWidth={2} />
            <text y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
              {m.side === "buy" ? "B" : "S"}
            </text>
          </g>
        ))}
        {/* live dot */}
        <circle cx={geo.x(data.length - 1)} cy={geo.y(data[data.length - 1].c)} r={4} fill="var(--series-1)" stroke="var(--chart-surface)" strokeWidth={2} />
        {hv && hover != null && (
          <g pointerEvents="none">
            <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.top} y2={PAD.top + geo.h} stroke="var(--axis)" strokeWidth={1} />
            <circle cx={geo.x(hover)} cy={geo.y(hv.c)} r={5} fill="var(--series-1)" stroke="var(--chart-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hv && hover != null && (
        <div
          className="pointer-events-none absolute top-1 rounded-xl border border-line bg-panel px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(geo.x(hover) - 70, 0), width - 150), minWidth: 140 }}
        >
          <div className="text-muted">{fmtT(hv.t)}</div>
          <div className="tnum mt-0.5 text-sm font-semibold text-ink">{formatValue(hv.c)}</div>
          <div className="tnum text-ink-2">
            {hv.c >= data[0].c ? "▲" : "▼"} {(((hv.c - data[0].c) / data[0].c) * 100).toFixed(2)}% from start
          </div>
        </div>
      )}
    </div>
  );
}

export function Sparkline({ data, width = 96, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => 2 + (1 - (v - min) / (max - min || 1)) * (height - 4);
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} fill="none" stroke="var(--series-1)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
