"""Regenerate semli. from Onest SemiBold; usage: python3 design/generate-wordmark.py FONT.ttf.

Requires fontTools. The supplied font must be the official Onest SemiBold (600)
face; the font itself is not redistributed with these outlined logo assets.
"""

import hashlib
import json
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = Path(sys.argv[1])
font = TTFont(FONT_PATH)
assert "Onest" in font["name"].getDebugName(1), "Expected an Onest font"
assert font["OS/2"].usWeightClass == 600, "Expected the SemiBold (600) face"
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
em = font["head"].unitsPerEm
scale, tracking = 1500 / em, -0.045 * 1500

# Match the real i's tittle placement, replacing its contour with a circle.
recording = DecomposingRecordingPen(glyphs)
glyphs[cmap[ord("i")]].draw(recording)
contours, contour = [], []
for op, args in recording.value:
    if op == "moveTo":
        contour = [args[0]]
    elif op in ("lineTo", "qCurveTo", "curveTo"):
        contour.extend(point for point in args if point is not None)
    elif op in ("closePath", "endPath"):
        contours.append(contour)
tittle = max(contours, key=lambda points: min(point[1] for point in points))
xs, ys = [p[0] for p in tittle], [p[1] for p in tittle]
dot_radius = max(max(xs) - min(xs), max(ys) - min(ys)) * scale / 2 * 1.08

paths, bounds, origin = [], [], 0
for letter in "semlı":
    glyph = glyphs[cmap[ord(letter)]]
    matrix = (scale, 0, 0, -scale, origin, 0)
    pen = SVGPathPen(glyphs, ntos=lambda value: f"{value:.3f}".rstrip("0").rstrip("."))
    glyph.draw(TransformPen(pen, matrix))
    paths.append(pen.getCommands())
    bp = BoundsPen(glyphs)
    glyph.draw(TransformPen(bp, matrix))
    bounds.append(bp.bounds)
    origin += glyph.width * scale + tracking

stem = bounds[-1]
dots = [
    {"cx": (stem[0] + stem[2]) / 2, "cy": -(min(ys) + max(ys)) / 2 * scale, "r": dot_radius},
    {"cx": stem[2] + 0.11 * 1500 + dot_radius, "cy": -dot_radius, "r": dot_radius},
]
left = min(b[0] for b in bounds)
top = min(min(b[1] for b in bounds), dots[0]["cy"] - dot_radius)
right = dots[1]["cx"] + dot_radius
bottom = max(b[3] for b in bounds)
mark = {
    "viewBox": [round(v, 3) for v in (left, top, right - left, bottom - top)],
    "letters": " ".join(paths),
    "dots": [{k: round(v, 3) for k, v in dot.items()} for dot in dots],
}
old = json.loads((ROOT / "design/wordmark.json").read_text())
(ROOT / "design/wordmark.json").write_text(json.dumps(mark, ensure_ascii=False) + "\n")
module = f'''// Generated from Onest SemiBold (600), lowercase semli.; tracking -4.5%.
// Source font SHA-256: {hashlib.sha256(FONT_PATH.read_bytes()).hexdigest()}
// Regenerate with design/generate-wordmark.py; coordinates use a 1500-unit em, y-down.
export const wordmark = {{
  viewBox: {json.dumps(mark["viewBox"])} as [number, number, number, number],
  letters: {json.dumps(mark["letters"])},
  /** Matching accent circles: the i tittle and the closing period. */
  dots: {json.dumps(mark["dots"])},
}} as const;

export const WORDMARK_RATIO = {mark["viewBox"][2]} / {mark["viewBox"][3]};
'''
(ROOT / "packages/tokens/src/wordmark.ts").write_text(module)

NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
tag = lambda name: f"{{{NS}}}{name}"

def replace_paths(parent):
    path = parent.find(tag("path"))
    path.set("d", mark["letters"])
    for circle, dot in zip(parent.findall(tag("circle")), mark["dots"]):
        for key, value in dot.items():
            circle.set(key, str(value))

for path in (ROOT / "design").glob("*.svg"):
    tree = ET.parse(path)
    root = tree.getroot()
    changed = False
    if path.name in ("wordmark-ink.svg", "wordmark-white.svg"):
        root.set("viewBox", " ".join(map(str, mark["viewBox"])))
        root.set("width", str(mark["viewBox"][2]))
        root.set("height", str(mark["viewBox"][3]))
        replace_paths(root)
        changed = True
    else:
        for group in root.iter(tag("g")):
            if len(group.findall(tag("path"))) != 1 or len(group.findall(tag("circle"))) != 2:
                continue
            transform = group.get("transform", "")
            match = re.fullmatch(r"translate\(([-\d.]+)[ ,]+([-\d.]+)\) scale\(([-\d.]+)\) translate\(([-\d.]+)[ ,]+([-\d.]+)\)", transform)
            if not match:
                raise ValueError(f"Unrecognized wordmark placement in {path}")
            tx, ty, old_scale, _, _ = map(float, match.groups())
            target_width = old["viewBox"][2] * old_scale
            new_scale = target_width / mark["viewBox"][2]
            old_height = old["viewBox"][3] * old_scale
            new_height = mark["viewBox"][3] * new_scale
            if path.name == "splash-icon.svg":
                tx, ty = 0, 0
                new_scale = 800 / mark["viewBox"][2]
                height = round(mark["viewBox"][3] * new_scale, 3)
                root.set("viewBox", f"0 0 800 {height}")
                root.set("height", str(height))
            else:
                ty += (old_height - new_height) / 2
            group.set("transform", f"translate({tx:.3f} {ty:.3f}) scale({new_scale:.8f}) translate({-left:.3f} {-top:.3f})")
            replace_paths(group)
            changed = True
    if changed:
        tree.write(path, encoding="unicode")
        print(path.relative_to(ROOT))
print("Onest SemiBold wordmark:", mark["viewBox"])
