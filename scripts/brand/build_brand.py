#!/usr/bin/env python3
"""
Vantage brand system generator (docs/design/brand.md).

Everything is constructed, not drawn by hand:
  - the monogram: a V that is also a check mark, made of five engraved lines (one per pre-flight check),
    45-degree short arm and a 3-4-5 long arm on a 48-unit grid;
  - guilloche: parametric curves (sine-modulated rings and hypotrochoids), generated here, never copied;
  - text: shaped with HarfBuzz (real kerning) from Archivo / Literata variable fonts and outlined to paths,
    so every SVG renders identically without the fonts installed.

Usage:  python3 scripts/brand/build_brand.py          (needs: pip install fonttools brotli uharfbuzz)
Writes SVGs to public/brand/. PNGs are rendered by scripts/brand/render.cjs (Playwright).
"""
import io, math, os, re, sys
from fontTools.ttLib import TTFont
import uharfbuzz as hb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "brand")
os.makedirs(OUT, exist_ok=True)

# ---------- palette (docs/design/direction.md §4) ----------
INK, PAPER, NIGHT, INK_D = "#141C17", "#EDF1EA", "#131C17", "#E3EAE4"
INK2, INK2_D = "#45514A", "#AEBBB2"
PENCIL, PENCIL_D = "#2443B5", "#97ACFF"
RULE, RULE_D, RULE_STRONG = "#C9D6C5", "#26332C", "#8CA590"
GUILL_D = "#2A3A31"  # guilloche on night ledger: one step off the surface

BRAND = re.search(r'name:\s*"([^"]+)"', open(os.path.join(ROOT, "src/lib/brand.ts")).read()).group(1)
TAGLINE = re.search(r'tagline:\s*"([^"]+)"', open(os.path.join(ROOT, "src/lib/brand.ts")).read()).group(1)

# ---------- fonts ----------
def load_font(pkg, file):
    p = os.path.join(ROOT, "node_modules", "@fontsource-variable", pkg, "files", file)
    f = TTFont(p)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    return hb.Face(hb.Blob(buf.getvalue())), f["head"].unitsPerEm

ARCHIVO = load_font("archivo", "archivo-latin-wdth-normal.woff2")
LITERATA = load_font("literata", "literata-latin-opsz-normal.woff2")

class PathPen:
    """fontTools pen protocol (what uharfbuzz's draw_glyph_with_pen calls), emitting SVG path data."""
    def __init__(self, s, x, y):
        self.d, self.s, self.x, self.y = [], s, x, y
    def P(self, pt):
        return f"{self.x + pt[0] * self.s:.2f} {self.y - pt[1] * self.s:.2f}"
    def moveTo(self, pt): self.d.append("M" + self.P(pt))
    def lineTo(self, pt): self.d.append("L" + self.P(pt))
    def qCurveTo(self, *pts):
        # TrueType quadratic spline: implied on-curve points between consecutive off-curve points
        off, end = list(pts[:-1]), pts[-1]
        for i, c in enumerate(off):
            nxt = end if i == len(off) - 1 else ((c[0] + off[i + 1][0]) / 2, (c[1] + off[i + 1][1]) / 2)
            self.d.append("Q" + self.P(c) + " " + self.P(nxt))
    def curveTo(self, a, b, c): self.d.append("C" + self.P(a) + " " + self.P(b) + " " + self.P(c))
    def closePath(self): self.d.append("Z")
    def endPath(self): pass

def text_path(text, size, x=0, y=0, font=ARCHIVO, var=None, track=0.0, kern=None, anchor="start"):
    """Shape and outline `text`. Returns (d, advance_width). y is the baseline. track in em. kern: {index: em}."""
    face, upem = font
    f = hb.Font(face)
    if var:
        f.set_variations(var)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(f, buf, {"kern": True, "liga": True})
    s = size / upem
    adv = []
    for i, p in enumerate(buf.glyph_positions):
        extra = track * size + ((kern or {}).get(i, 0) * size)
        adv.append(p.x_advance * s + (extra if i < len(text) - 1 else 0))
    total = sum(adv)
    x0 = x - (total if anchor == "end" else total / 2 if anchor == "middle" else 0)
    d, cx = [], x0
    for info, pos, a in zip(buf.glyph_infos, buf.glyph_positions, adv):
        pen = PathPen(s, cx + pos.x_offset * s, y - pos.y_offset * s)
        f.draw_glyph_with_pen(info.codepoint, pen)
        d.extend(pen.d)
        cx += a
    return "".join(d), total

def cap_height(font=ARCHIVO, var=None, size=1.0):
    face, upem = font
    f = hb.Font(face)
    if var:
        f.set_variations(var)
    gid = f.get_nominal_glyph(ord("H"))
    ext = f.get_glyph_extents(gid)
    return ext.y_bearing * size / upem

WORD_VAR = {"wght": 560, "wdth": 125}
WORD_TRACK = 0.012
WORD_KERN = {0: -0.035}  # hand kerning: tighten V-a (index of the first glyph pair)

# ---------- the monogram: a high-contrast V that is a check mark ----------
# Edge construction on a 48-unit grid. The outer silhouette is exact: from the base point P0 the short arm
# rises at 45 degrees and the long arm on a 3-4-5 slope. Strokes are offset inward: hairline 3.4, main stroke
# 10.2 (1:3, the contrast of an engraved letter). Five grooves engraved into the main stroke = five checks.
U = 48.0
P0 = (21.0, 42.0)
SHORT_DIR, LONG_DIR = (-1.0, -1.0), (3.0, -4.0)
Y_SHORT, Y_LONG = 21.0, 6.0
W_HAIR, W_MAIN = 3.2, 9.6
GROOVES, GROOVE_W = 5, 0.3

def _unit(v):
    l = math.hypot(*v)
    return (v[0] / l, v[1] / l)

U1, U2 = _unit(SHORT_DIR), _unit(LONG_DIR)
IN1 = (U1[1], -U1[0]) if (U1[1], -U1[0])[0] > 0 else (-U1[1], U1[0])   # inward normal of the short arm (towards the right)
IN2 = (-U2[1], U2[0]) if (-U2[1], U2[0])[0] < 0 else (U2[1], -U2[0])   # inward normal of the long arm (towards the left)

def _line(p, u):
    return (p, u)

def _meet(l1, l2):
    (p, u), (q, v) = l1, l2
    det = u[0] * (-v[1]) - u[1] * (-v[0])
    t = ((q[0] - p[0]) * (-v[1]) - (q[1] - p[1]) * (-v[0])) / det
    return (p[0] + u[0] * t, p[1] + u[1] * t)

def _at_y(l, y):
    (p, u) = l
    t = (y - p[1]) / u[1]
    return (p[0] + u[0] * t, y)

def _shift(l, n, d):
    (p, u) = l
    return ((p[0] + n[0] * d, p[1] + n[1] * d), u)

OUT1, OUT2 = _line(P0, U1), _line(P0, U2)
INN1, INN2 = _shift(OUT1, IN1, W_HAIR), _shift(OUT2, IN2, W_MAIN)

def _perp_cut():
    # the hairline arm ends square to its own direction, like a pen stroke; its outer corner sits on Y_SHORT
    B = _at_y(OUT1, Y_SHORT)
    n = IN1
    A = (B[0] + n[0] * W_HAIR, B[1] + n[1] * W_HAIR)
    return A, B

def mark_poly():
    A, B = _perp_cut()         # short arm, square end
    C = P0                     # base point
    D = _at_y(OUT2, Y_LONG)    # long arm, outer top corner
    E = _at_y(INN2, Y_LONG)    # long arm, inner top corner
    F = _meet(INN1, INN2)      # inner vertex
    return [A, B, C, D, E, F]

def groove_polys():
    """Thin parallelograms inside the main stroke, parallel to it, from its top cut to the base edge."""
    out = []
    for i in range(1, GROOVES + 1):
        d = W_MAIN * i / (GROOVES + 1)
        lo, hi = _shift(OUT2, IN2, d - GROOVE_W / 2), _shift(OUT2, IN2, d + GROOVE_W / 2)
        out.append([_at_y(lo, Y_LONG), _at_y(hi, Y_LONG), _end(hi), _end(lo)])
    return out

def _end(l):
    # grooves stop at the inner edge of the hairline arm (the join), never cutting the silhouette
    return _meet(l, INN1)

_pts = mark_poly()
_minx, _maxx = min(p[0] for p in _pts), max(p[0] for p in _pts)
_miny, _maxy = min(p[1] for p in _pts), max(p[1] for p in _pts)
OFF = ((U - (_maxx - _minx)) / 2 - _minx, (U - (_maxy - _miny)) / 2 - _miny)
MONO_BBOX = (_maxx - _minx, _maxy - _miny)

def _poly_d(poly, x, y, s):
    return "M" + "L".join(f"{x + (px + OFF[0]) * s:.3f} {y + (py + OFF[1]) * s:.3f}" for px, py in poly) + "Z"

def monogram_d(x=0, y=0, size=48, solid=False):
    """Path data for the monogram fitted in a size x size box. Grooves are subpaths with the evenodd rule."""
    s = size / U
    d = _poly_d(mark_poly(), x, y, s)
    if not solid:
        d += "".join(_poly_d(g, x, y, s) for g in groove_polys())
    return d

def monogram_path(x, y, size, fill, solid=False):
    return f'<path fill="{fill}" fill-rule="evenodd" d="{monogram_d(x, y, size, solid)}"/>'

# ---------- guilloche (parametric) ----------
def ring(cx, cy, R, A, N, K, phase=0.0, steps=720, squash=1.0):
    """K sine-modulated circles r = R + A sin(N t + 2 pi k / K): interlace into a woven band."""
    paths = []
    for k in range(K):
        ph = phase + 2 * math.pi * k / K
        pts = []
        for i in range(steps + 1):
            t = 2 * math.pi * i / steps
            r = R + A * math.sin(N * t + ph)
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t) * squash))
        paths.append("M" + "L".join(f"{a:.2f} {b:.2f}" for a, b in pts) + "Z")
    return paths

def rosette(cx, cy, R, r, d, K, steps=1400):
    """Hypotrochoids rotated K times: the classic engraved rosette."""
    paths = []
    g = math.gcd(int(R), int(r))
    turns = int(r) // g
    for k in range(K):
        rot = 2 * math.pi * k / K / (R / r)
        pts = []
        for i in range(steps + 1):
            t = 2 * math.pi * turns * i / steps
            x = (R - r) * math.cos(t) + d * math.cos((R - r) / r * t)
            y = (R - r) * math.sin(t) - d * math.sin((R - r) / r * t)
            xr, yr = x * math.cos(rot) - y * math.sin(rot), x * math.sin(rot) + y * math.cos(rot)
            pts.append((cx + xr, cy + yr))
        paths.append("M" + "L".join(f"{a:.2f} {b:.2f}" for a, b in pts) + "Z")
    return paths

def wave_band(x0, x1, yc, A, wavelength, K, steps=900, phase=0.0):
    """K phase-shifted sine lines: a woven border ribbon (horizontal)."""
    paths = []
    for k in range(K):
        ph = phase + 2 * math.pi * k / K
        pts = []
        for i in range(steps + 1):
            x = x0 + (x1 - x0) * i / steps
            y = yc + A * math.sin(2 * math.pi * (x - x0) / wavelength + ph)
            pts.append((x, y))
        paths.append("M" + "L".join(f"{a:.2f} {b:.2f}" for a, b in pts))
    return paths

def circle_text(text, cx, cy, radius, size, var=None, track=0.12, start_deg=-90):
    """Microtext set on a circle, outlined glyph by glyph."""
    face, upem = ARCHIVO
    f = hb.Font(face)
    if var:
        f.set_variations(var)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(f, buf, {"kern": True})
    s = size / upem
    out, along = [], 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        adv = pos.x_advance * s + track * size
        ang = math.radians(start_deg) + (along + adv / 2) / radius
        gx, gy = cx + radius * math.cos(ang), cy + radius * math.sin(ang)
        pen = PathPen(s, -adv / 2 + track * size / 2, size * 0.35)
        f.draw_glyph_with_pen(info.codepoint, pen)
        if pen.d:
            out.append(f'<path transform="translate({gx:.2f} {gy:.2f}) rotate({math.degrees(ang) + 90:.3f})" d="{"".join(pen.d)}"/>')
        along += adv
    return "".join(out), along

def svg(w, h, body, title, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{rect}{body}</svg>\n'

def write(name, content):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)
    print("wrote", name, f"{len(content) / 1024:.1f} KB")

# ======================================================================
# 1. monogram (engraved >= 64px; solid below, see brand.md)
# ======================================================================
for suffix, fill, bg in [("", INK, None), ("-inverse", INK_D, None), ("-pencil", PENCIL, None)]:
    write(f"vantage-monogram{suffix}.svg", svg(48, 48, f'{monogram_path(0, 0, 48, fill)}', f"{BRAND} monogram"))
write("vantage-monogram-solid.svg", svg(48, 48, monogram_path(0, 0, 48, INK, solid=True), f"{BRAND} monogram, small sizes"))

# ======================================================================
# 2. wordmark + 3. lockups (laid out from real outline bounding boxes)
# ======================================================================
def bbox(d):
    nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)

WS = 100.0
CAP = cap_height(var=WORD_VAR, size=WS)

def wordmark(x, y_base, size, fill):
    d, w = text_path(BRAND, size, x, y_base, var=WORD_VAR, track=WORD_TRACK, kern=WORD_KERN)
    return f'<path fill="{fill}" d="{d}"/>', d

_wd, _ = text_path(BRAND, WS, 0, 0, var=WORD_VAR, track=WORD_TRACK, kern=WORD_KERN)
WB = bbox(_wd)  # (x0, top, x1, bottom) relative to baseline 0: top = -cap-ish, bottom = descender
for suffix, fill in [("", INK), ("-inverse", INK_D)]:
    body, _ = wordmark(-WB[0], -WB[1], WS, fill)
    write(f"vantage-wordmark{suffix}.svg", svg(round(WB[2] - WB[0], 1), round(WB[3] - WB[1], 1), body, BRAND))

MARK_W, MARK_H = MONO_BBOX
MARK_RATIO = MARK_H / U  # visible height of the mark inside its square box

def lockup_h(fm, fw, cap=CAP):
    """Mark's visible height = 1.5 x cap height, vertically centred on the cap height; gap = 0.6 x cap."""
    k = cap / CAP
    box = cap * 1.5 / MARK_RATIO
    gap = cap * 0.6
    mark_left = -(U - MARK_W) / 2 * box / U          # trim the box's side bearing
    top_pad = (U - MARK_H) / 2 * box / U
    mark_vis_h = cap * 1.5
    y_mark = -top_pad
    base = mark_vis_h / 2 + cap / 2
    x_word = MARK_W * box / U + gap
    word, d = wordmark(x_word - WB[0] * k, base, WS * k, fw)
    x0, y0, x1, y1 = bbox(d)
    H = max(mark_vis_h, y1)
    return monogram_path(mark_left, y_mark, box, fm, solid=True) + word, x1, H

def lockup_v(fm, fw, cap=CAP):
    k = cap / CAP
    box = cap * 2.4 / MARK_RATIO
    mark_w = MARK_W * box / U
    word_w = (WB[2] - WB[0]) * k
    W = max(mark_w, word_w)
    top_pad = (U - MARK_H) / 2 * box / U
    mark = monogram_path((W - box) / 2, -top_pad, box, fm, solid=True)
    base = cap * 2.4 + cap * 0.8 + cap
    word, d = wordmark((W - word_w) / 2 - WB[0] * k, base, WS * k, fw)
    return mark + word, W, bbox(d)[3]

for suffix, fm, fw in [("", INK, INK), ("-inverse", INK_D, INK_D), ("-pencil", PENCIL, INK)]:
    b_, w, h = lockup_h(fm, fw)
    write(f"vantage-lockup-horizontal{suffix}.svg", svg(round(w, 1), round(h, 1), b_, BRAND))
    b_, w, h = lockup_v(fm, fw)
    write(f"vantage-lockup-stacked{suffix}.svg", svg(round(w, 1), round(h, 1), b_, BRAND))

# ======================================================================
# 4. favicon (solid mark, ink tile: readable on light and dark tabs)
# ======================================================================
fav = f'<rect width="32" height="32" rx="7" fill="{INK}"/>{monogram_path(5, 5, 22, PAPER, solid=True)}'
write("favicon.svg", svg(32, 32, fav, f"{BRAND}"))

# ======================================================================
# 5. app icon 1024 (night ledger, engraved rosette, paper monogram)
# ======================================================================
def field(w, h, cx, cy, pitch, amp, color, line, wave=46.0, fade=None, clip=None):
    """Engraved background: evenly pitched concentric rings around a point outside the canvas, each ring an
    interlaced pair of fine sine lines (phase 0 and pi). Only the arc that crosses the canvas is computed.
    Reads like the corner of a security-printed field, never like a seal."""
    clip = clip or (0, 0, w, h)
    corners = [(clip[0], clip[1]), (clip[0] + clip[2], clip[1]), (clip[0], clip[1] + clip[3]), (clip[0] + clip[2], clip[1] + clip[3])]
    dists = [math.hypot(x - cx, y - cy) for x, y in corners]
    # nearest point of the canvas rectangle to the centre (centre is outside the canvas)
    nx, ny = min(max(cx, clip[0]), clip[0] + clip[2]), min(max(cy, clip[1]), clip[1] + clip[3])
    r0 = math.hypot(nx - cx, ny - cy) - pitch
    r1 = max(dists) + pitch
    angs = [math.atan2(y - cy, x - cx) for x, y in corners]
    t0, t1 = min(angs) - 0.05, max(angs) + 0.05
    g = []
    R = r0
    j = 0
    while R <= r1:
        n = max(8, round(2 * math.pi * R / wave))
        steps = max(60, int(R * (t1 - t0) / 4.0))
        for ph in (0.0, math.pi):
            pts = []
            for i in range(steps + 1):
                t = t0 + (t1 - t0) * i / steps
                r = R + amp * math.sin(n * t + ph + j * 0.9)
                pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
            g.append("M" + "L".join(f"{a:.1f} {b:.1f}" for a, b in pts))
        R += pitch
        j += 1
    mask = f' mask="url(#fade)"' if fade else ""
    body = f'<g{mask}><g fill="none" stroke="{color}" stroke-width="{line}" clip-path="url(#clip)"><path d="{"".join(g)}"/></g></g>'
    defs = f'<clipPath id="clip"><rect x="{clip[0]}" y="{clip[1]}" width="{clip[2]}" height="{clip[3]}"/></clipPath>'
    if fade:
        (x1, y1, x2, y2) = fade
        defs += (f'<linearGradient id="fadeg" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">'
                 f'<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>'
                 f'<mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="url(#fadeg)"/></mask>')
    return body, f"<defs>{defs}</defs>"

fg, fdefs = field(1024, 1024, -420, 1444, 26, 6, GUILL_D, 1.8, fade=(620, 400, 0, 1024))
icon = fdefs + fg + monogram_path(512 - 230, 512 - 230 + 14, 460, PAPER)
write("app-icon.svg", svg(1024, 1024, icon, f"{BRAND} app icon", bg=NIGHT))

# ======================================================================
# 6. social avatar 800 (circle-safe)
# ======================================================================
fg, fdefs = field(800, 800, -330, 1130, 21, 5, GUILL_D, 1.5, fade=(480, 320, 0, 800))
av = fdefs + fg + monogram_path(400 - 170, 400 - 170 + 10, 340, PAPER)
write("social-avatar.svg", svg(800, 800, av, f"{BRAND}", bg=NIGHT))

# ======================================================================
# 7. social banner 1500x500 (paper, woven border, lockup, tagline)
# ======================================================================
def lockup_at(x, y_top, cap, fm, fw):
    body, w, h = lockup_h(fm, fw, cap)
    return f'<g transform="translate({x:.2f} {y_top:.2f})">{body}</g>', w, h

ban = []
fg, fdefs = field(1500, 500, 1900, -420, 17, 4, RULE, 1.0, fade=(1080, 0, 1500, 0), clip=(1080, 0, 420, 500))
ban.append(fdefs + fg)
ban.append(monogram_path(1190, 140, 200, PENCIL))
lk, lw, lm = lockup_at(120, 104, 30, INK, INK)
ban.append(lk)
td, _ = text_path(TAGLINE, 44, 120, 232, var={"wght": 600, "wdth": 125}, track=-0.01)
ban.append(f'<path fill="{INK}" d="{td}"/>')
sd, _ = text_path("A simulated market, a five-check order ticket and Nova, an AI coach.", 22, 120, 280, var={"wght": 400, "wdth": 100})
ban.append(f'<path fill="{INK2}" d="{sd}"/>')
dd, _ = text_path("Educational simulator. No real money. Not investment advice.", 15, 120, 318, var={"wght": 500, "wdth": 87.5})
ban.append(f'<path fill="{INK2}" d="{dd}"/>')
write("social-banner.svg", svg(1500, 500, "".join(ban), f"{BRAND}: {TAGLINE}", bg=PAPER))

# ======================================================================
# 8. Open Graph 1200x630
# ======================================================================
og = []
fg, fdefs = field(1200, 630, 1640, 980, 18, 4.2, RULE, 1.1, fade=(900, 0, 1200, 0), clip=(900, 0, 300, 630))
og.append(fdefs + fg)
og.append(monogram_path(962, 230, 180, PENCIL))
lk, _, _ = lockup_at(80, 80, 30, INK, INK)
og.append(lk)
y = 300
for line in ["Practice the market", "before it counts."]:
    d, _ = text_path(line, 68, 80, y, var={"wght": 600, "wdth": 125}, track=-0.015)
    og.append(f'<path fill="{INK}" d="{d}"/>')
    y += 78
sd, _ = text_path("$100,000 in practice money. Every trade checked by Nova, an AI coach.", 24, 80, 470, var={"wght": 400, "wdth": 100})
og.append(f'<path fill="{INK2}" d="{sd}"/>')
og.append(f'<rect x="80" y="524" width="640" height="1" fill="{RULE_STRONG}"/>')
dd, _ = text_path("Educational simulator. No real money, no real trades. Not investment advice.", 17, 80, 556, var={"wght": 500, "wdth": 87.5})
og.append(f'<path fill="{INK2}" d="{dd}"/>')
write("og.svg", svg(1200, 630, "".join(og), f"{BRAND}: {TAGLINE}", bg=PAPER))

# ======================================================================
# 9. business card 3.5 x 2 in @ 300 dpi = 1050 x 600
# ======================================================================
cf = []
lk, _, _ = lockup_at(72, 72, 26, INK, INK)
cf.append(lk)
cf.append(f'<rect x="72" y="398" width="906" height="1.5" fill="{RULE_STRONG}"/>')
for txt, x, yb, sz, var, col, anchor in [
    ("[Name]", 72, 462, 34, {"wght": 600, "wdth": 112.5}, INK, "start"),
    ("[Title]", 72, 506, 24, {"wght": 400, "wdth": 100}, INK2, "start"),
    ("[name@yourdomain.com]", 978, 462, 24, {"wght": 500, "wdth": 100}, INK, "end"),
    ("[yourdomain.com]", 978, 506, 24, {"wght": 400, "wdth": 100}, INK2, "end"),
]:
    d, _ = text_path(txt, sz, x, yb, var=var, anchor=anchor)
    cf.append(f'<path fill="{col}" d="{d}"/>')
td, _ = text_path(TAGLINE, 22, 72, 214, var={"wght": 500, "wdth": 112.5})
cf.append(f'<path fill="{INK2}" d="{td}"/>')
write("business-card-front.svg", svg(1050, 600, "".join(cf), f"{BRAND} business card, front", bg=PAPER))

cb = []
fg, fdefs = field(1050, 600, 1450, -350, 19, 4.5, GUILL_D, 1.2, fade=(560, 420, 1050, 0))
cb.append(fdefs + fg)
cb.append(monogram_path(525 - 130, 300 - 130 + 6, 260, PAPER))
mt, mlen = text_path(("PRACTICE THE MARKET BEFORE IT COUNTS   ") * 3, 8, 525, 556, var={"wght": 600, "wdth": 100}, track=0.18, anchor="middle")
cb.append(f'<path fill="#3E5246" d="{mt}"/>')
write("business-card-back.svg", svg(1050, 600, "".join(cb), f"{BRAND} business card, back", bg=NIGHT))

# ======================================================================
# 10. construction sheet (for docs/design/brand.md)
# ======================================================================
S = 12
cs = [f'<rect width="{U * S}" height="{U * S}" fill="{PAPER}"/>']
for i in range(int(U) + 1):
    w_, c_ = (1.6, RULE_STRONG) if i % 4 == 0 else (0.8, RULE)
    cs.append(f'<line x1="{i * S}" y1="0" x2="{i * S}" y2="{U * S}" stroke="{c_}" stroke-width="{w_}"/><line x1="0" y1="{i * S}" x2="{U * S}" y2="{i * S}" stroke="{c_}" stroke-width="{w_}"/>')
cs.append(f'<path fill="{INK}" fill-rule="evenodd" fill-opacity="0.92" d="{monogram_d(0, 0, U * S)}"/>')
T = lambda pt: ((pt[0] + OFF[0]) * S, (pt[1] + OFF[1]) * S)
p0, d_, b_ = T(P0), T(_at_y(OUT2, Y_LONG)), T(_at_y(OUT1, Y_SHORT))
corner = (d_[0], p0[1])
cs.append(f'<polyline points="{b_[0]:.1f},{b_[1]:.1f} {p0[0]:.1f},{p0[1]:.1f} {d_[0]:.1f},{d_[1]:.1f}" fill="none" stroke="{PENCIL}" stroke-width="2" stroke-dasharray="7 5"/>')
cs.append(f'<polyline points="{p0[0]:.1f},{p0[1]:.1f} {corner[0]:.1f},{corner[1]:.1f} {d_[0]:.1f},{d_[1]:.1f}" fill="none" stroke="{PENCIL}" stroke-width="1.5"/>')
labels = [("3", (p0[0] + corner[0]) / 2, corner[1] + 0), ("4", corner[0] - 26, (corner[1] + d_[1]) / 2), ("45°", b_[0] + 22, b_[1] + 64), ("1", None, None), ("3", None, None)]
for txt, x, y_ in labels[:3]:
    d, _ = text_path(txt, 22, x, y_ - 8 if txt == "3" else y_, var={"wght": 600, "wdth": 100}, anchor="middle")
    cs.append(f'<path fill="{PENCIL}" d="{d}"/>')
write("vantage-construction.svg", svg(int(U * S), int(U * S), "".join(cs), f"{BRAND} monogram construction"))

# ======================================================================
# 11. path data for the app (one geometry for files and UI)
# ======================================================================
ts = (
    "// Generated by scripts/brand/build_brand.py. Do not edit by hand.\n"
    "// The Vantage monogram on a 48 x 48 grid (docs/design/brand.md). Use with fill-rule=\"evenodd\".\n"
    f'export const MONOGRAM_SOLID_D = "{monogram_d(0, 0, 48, solid=True)}";\n'
    f'export const MONOGRAM_ENGRAVED_D = "{monogram_d(0, 0, 48)}";\n'
)
with open(os.path.join(ROOT, "src", "lib", "brand-mark.ts"), "w") as fh:
    fh.write(ts)
print("wrote src/lib/brand-mark.ts")

print("monogram bbox (grid units):", [round(v, 2) for v in MONO_BBOX], "cap height:", round(CAP, 2))
