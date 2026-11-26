#!/usr/bin/env python3
"""Static TTF instances of Archivo for next/og (satori cannot read woff2 or variable fonts).
Output: src/assets/fonts/. Needs: pip install fonttools brotli"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "node_modules", "@fontsource-variable", "archivo", "files", "archivo-latin-wdth-normal.woff2")
OUT = os.path.join(ROOT, "src", "assets", "fonts")
os.makedirs(OUT, exist_ok=True)
for name, loc in {"archivo-display": {"wght": 600, "wdth": 125}, "archivo-text": {"wght": 400, "wdth": 100}, "archivo-text-medium": {"wght": 500, "wdth": 100}}.items():
    f = TTFont(SRC)
    inst = instantiateVariableFont(f, loc)
    inst.flavor = None
    inst.save(os.path.join(OUT, f"{name}.ttf"))
    print("wrote", name)
