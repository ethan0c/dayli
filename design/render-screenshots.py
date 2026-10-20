#!/usr/bin/env python3
"""Compose the App Store screenshots from raw simulator captures.

Input: design/screenshots/raw/<name>.png, 1320 x 2868 captures from the iPhone 17 Pro Max
simulator (dev build, light mode, 9:41 status bar; see docs/launch-guide.md, part 2).
Output: design/screenshots/<nn>-<name>.png at 1320 x 2868, no alpha, ready for the
6.9-inch slot. Caption in Geist on paper, ink text, one device per image bleeding off
the bottom edge, as the best-selling planners do (Things, Structured, Opal).

    python3 design/render-screenshots.py                 # all, default layout
    python3 design/render-screenshots.py today-mon plan  # a subset, by raw name
    python3 design/render-screenshots.py --layout center --out /tmp/x today-mon

Needs Pillow (`pip3 install pillow`).
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "design" / "screenshots" / "raw"
OUT = ROOT / "design" / "screenshots"
FONTS = ROOT / "apps" / "mobile" / "assets" / "fonts"
WORDMARK = ROOT / "apps" / "mobile" / "assets" / "images" / "splash-icon-light.png"

W, H = 1320, 2868
PAPER = (250, 249, 246)
INK = (34, 35, 32)
SECONDARY = (104, 105, 99)
DARK_SECONDARY = (180, 180, 172)
BEZEL = (16, 16, 16)
BEZEL_EDGE = (58, 58, 54)


@dataclass(frozen=True)
class Layout:
    name: str
    align: str  # "left" | "center"
    bg: tuple[int, int, int]
    ink: tuple[int, int, int]
    secondary: tuple[int, int, int]
    title_size: int = 112
    title_lead: int = 124
    title_weight: str = "Regular"
    sub_size: int = 46
    sub_lead: int = 58
    margin: int = 96
    title_top: int = 168
    device_top: int = 780  # fixed so the row lines up in the store
    screen_w: int = 1120  # the phone bleeds off the bottom
    bezel: int = 28
    radius: int = 140
    shadow: int = 44


LAYOUTS = {
    "left": Layout("left", "left", PAPER, INK, SECONDARY),
    "center": Layout("center", "center", PAPER, INK, SECONDARY, title_size=120, title_lead=132),
    "ink": Layout("ink", "center", INK, PAPER, DARK_SECONDARY, title_size=120, title_lead=132),
    "medium": Layout("medium", "left", PAPER, INK, SECONDARY, title_weight="Medium"),
}

# Order matters: the first three show in search results. Titles fit two lines at 112px.
SHOTS: list[tuple[str, str, str]] = [
    ("school", "A semester set up in two minutes", "Drop in a syllabus. Semli reads every exam and due date."),
    ("review-update", "Screenshot your shifts", "New, moved, and dropped shifts, shown before anything is saved."),
    ("today-mon", "Know what matters today", "The next thing, the day as a bar, and your list under it."),
    ("plan", "School, work, and life in one week", "Green is done, red is an overlap, a ring is an exam."),
    ("review", "Nothing is saved until you confirm", "Missing a time? Add it or skip it. Undo is one tap away."),
    ("paywall", "The planner stays free", "Calendar, to-dos, reminders, overlap warnings. Plus adds unlimited imports and Canvas sync."),
    ("today-mon-hours", "Hour by hour", "Shifts, classes, and overlaps in red, on one timeline."),
    ("add", "Type it or drop in a screenshot", "Semli reads work schedules, syllabi, and messages from class."),
    ("item", "Every detail one tap away", "Time, course, reminder, and the overlap, with a way out."),
]


def font(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"Geist-{weight}.ttf"), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    line = ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=f) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def device(capture: Image.Image, L: Layout) -> Image.Image:
    """The capture inside a bezel with rounded corners, on a transparent canvas with a soft shadow."""
    scale = L.screen_w / capture.width
    screen = capture.convert("RGB").resize((L.screen_w, round(capture.height * scale)), Image.LANCZOS)
    sw, sh = screen.size
    dw, dh = sw + 2 * L.bezel, sh + 2 * L.bezel
    pad = L.shadow * 3
    canvas = Image.new("RGBA", (dw + 2 * pad, dh + 2 * pad), (0, 0, 0, 0))

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + 30, pad + dw, pad + dh + 30), radius=L.radius + L.bezel, fill=(0, 0, 0, 56))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(L.shadow)))

    body = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((pad, pad, pad + dw, pad + dh), radius=L.radius + L.bezel, fill=BEZEL_EDGE + (255,))
    d.rounded_rectangle((pad + 3, pad + 3, pad + dw - 3, pad + dh - 3), radius=L.radius + L.bezel - 3, fill=BEZEL + (255,))
    canvas.alpha_composite(body)

    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw, sh), radius=L.radius, fill=255)
    canvas.paste(screen, (pad + L.bezel, pad + L.bezel), mask)
    return canvas


def text_block(draw: ImageDraw.ImageDraw, lines: list[str], f: ImageFont.FreeTypeFont, y: int, lead: int, color, L: Layout) -> int:
    for line in lines:
        x = L.margin if L.align == "left" else (W - draw.textlength(line, font=f)) / 2
        draw.text((x, y), line, font=f, fill=color)
        y += lead
    return y


def render(name: str, title: str, sub: str, index: int, L: Layout, out_dir: Path, wordmark: bool) -> Path:
    capture = Image.open(RAW / f"{name}.png")
    if capture.size != (W, H):
        raise SystemExit(f"{name}.png is {capture.size}, expected {W}x{H} (iPhone 17 Pro Max simulator)")
    img = Image.new("RGB", (W, H), L.bg)
    draw = ImageDraw.Draw(img)
    width = W - 2 * L.margin

    y = L.title_top
    if wordmark and WORDMARK.exists():
        mark = Image.open(WORDMARK).convert("RGBA")
        mark = mark.resize((220, round(mark.height * 220 / mark.width)), Image.LANCZOS)
        if L.bg != PAPER:  # ink wordmark on ink: recolor the letters, keep the dots
            r, g, b, a = mark.split()
            mark = Image.merge("RGBA", (Image.new("L", mark.size, 245), Image.new("L", mark.size, 244), Image.new("L", mark.size, 240), a))
        x = L.margin if L.align == "left" else (W - mark.width) // 2
        img.paste(mark, (x, y - 24), mark)
        y += mark.height + 44

    tf = font(L.title_size, L.title_weight)
    y = text_block(draw, wrap(draw, title, tf, width), tf, y, L.title_lead, L.ink, L)
    y += 30
    sf = font(L.sub_size)
    y = text_block(draw, wrap(draw, sub, sf, width), sf, y, L.sub_lead, L.secondary, L)

    dev = device(capture, L)
    pad = L.shadow * 3
    top = max(L.device_top, y + 64)
    img.paste(dev, ((W - dev.width) // 2, top - pad), dev)

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{index:02d}-{name}.png"
    img.save(out, "PNG", optimize=True)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="raw capture names to render (default: all)")
    ap.add_argument("--layout", choices=sorted(LAYOUTS), default="left")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()
    L = LAYOUTS[args.layout]
    for i, (name, title, sub) in enumerate(SHOTS, start=1):
        if args.names and name not in args.names:
            continue
        if not (RAW / f"{name}.png").exists():
            print(f"skip {name}: no raw capture")
            continue
        print(render(name, title, sub, i, L, args.out, wordmark=(i == 1)))


if __name__ == "__main__":
    main()
