import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { MONOGRAM_SOLID_D } from "@/lib/brand-mark";
import { LOOP_D } from "@/lib/marks-geometry";
import { SHARE_DISCLAIMER, parseShareScore } from "@/lib/share-score";

/**
 * 1200x630 score card for link previews, in the brand's og.png style (public/brand/og.png).
 * A route handler rather than opengraph-image.tsx because file-convention images cannot read the query string.
 * Fonts are local static instances of Archivo (scripts/brand/build_og_fonts.py): no network at render time.
 * Colours are literal brand hex values because an image has no CSS tokens (docs/design/brand.md).
 */
export const runtime = "nodejs";

const PAPER = "#EDF1EA";
const INK = "#141C17";
const INK2 = "#45514A";
const PENCIL = "#2443B5";
const RED = "#B42318";
const RULE = "#8CA590";

const font = async (f: string) => {
  const b = await readFile(join(process.cwd(), "src", "assets", "fonts", f));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const c = parseShareScore(sp);
  const [display, text] = await Promise.all([font("archivo-display.ttf"), font("archivo-text.ttf")]);
  const risk = c.score < 50;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: PAPER, color: INK, padding: "64px 80px", fontFamily: "Archivo" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width={52} height={52} viewBox="0 0 48 48">
            <path d={MONOGRAM_SOLID_D} fill={INK} />
          </svg>
          <div style={{ display: "flex", marginLeft: 16, fontSize: 40, fontFamily: "ArchivoDisplay" }}>{BRAND.name}</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 40, color: INK2 }}>
              {c.side === "buy" ? "Bought" : "Sold"} {c.symbol} in the simulator
            </div>
            <div style={{ display: "flex", marginTop: 12, fontSize: 96, lineHeight: 1, fontFamily: "ArchivoDisplay", color: risk ? RED : INK }}>{c.label}</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 30, color: INK2 }}>Process score out of 100. It grades the plan, not the result.</div>
          </div>
          <div style={{ display: "flex", position: "relative", width: 330, height: 220, alignItems: "center", justifyContent: "center" }}>
            <svg width={330} height={220} viewBox="0 0 72 48" style={{ position: "absolute", left: 0, top: 0 }}>
              <path d={LOOP_D} fill="none" stroke={PENCIL} strokeWidth={1.2} strokeLinecap="round" />
            </svg>
            <div style={{ display: "flex", fontSize: 120, lineHeight: 1, fontFamily: "ArchivoDisplay", color: PENCIL }}>{c.score}</div>
          </div>
        </div>

        <div style={{ display: "flex", height: 1, background: RULE, width: 720 }} />
        <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: INK2 }}>{SHARE_DISCLAIMER}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: text, weight: 400, style: "normal" },
        { name: "ArchivoDisplay", data: display, weight: 600, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
