#!/usr/bin/env python3
"""Compose the App Store screenshots from raw simulator captures.

Input: design/screenshots/raw/<name>.png, 1320 x 2868 captures from the iPhone 17 Pro Max
simulator (dev build, light mode, 9:41 status bar; see docs/launch-guide.md, part 2).
Output: design/screenshots/<nn>-<name>.png at 1320 x 2868, no alpha, ready for the
6.9-inch slot. Caption in Geist Medium on paper, ink text, the site's iPhone frame bleeding off
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
FRAME = ROOT / "apps" / "web" / "public" / "phones" / "iphone-frame.png"  # 944 x 1902, the site's device render
FRAME_MASK = ROOT / "apps" / "web" / "public" / "phones" / "iphone-screen-mask.png"  # 850 x 1814, screen box at (47, 44)

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
    title_size: int = 136
    title_lead: int = 150
    title_weight: str = "Medium"
    sub_size: int = 60
    sub_lead: int = 74
    margin: int = 96
    title_top: int = 168
    device_top: int = 930  # fixed so the row lines up in the store
    screen_w: int = 1176  # outer width of the phone; it bleeds off the bottom
    bezel: int = 28
    radius: int = 140
    shadow: int = 44
    frame: bool = True  # the site's photographic iPhone frame; False draws a flat bezel instead


LAYOUTS = {
    "left": Layout("left", "left", PAPER, INK, SECONDARY),
    "center": Layout("center", "center", PAPER, INK, SECONDARY),
    "ink": Layout("ink", "center", INK, PAPER, DARK_SECONDARY),
    "regular": Layout("regular", "left", PAPER, INK, SECONDARY, title_weight="Regular"),
    "bezel": Layout("bezel", "left", PAPER, INK, SECONDARY, frame=False, screen_w=1120),
    # For the 2007 x 2853 foldable canvas: type and phone scaled up so they hold the same share of the width.
    "wide": Layout("wide", "center", PAPER, INK, SECONDARY, title_size=176, title_lead=194, sub_size=76, sub_lead=94, margin=140, device_top=960, screen_w=1320),
}

# Order matters: the first three show in search results. Titles fit two lines at 136px.
SHOTS: list[tuple[str, str, str]] = [
    ("school", "A semester in two minutes", "Drop in a syllabus. Semli reads every exam and due date."),
    ("review-update", "Screenshot your shifts", "New, moved, and dropped shifts, before anything is saved."),
    ("today-mon", "Know what matters today", "The next thing, the day as a bar, and your list under it."),
    ("plan", "School and work in one week", "Green is done, red is an overlap, a ring is an exam."),
    ("review", "Nothing saves until you say so", "Missing a time? Add it or skip it. Undo is one tap away."),
    ("paywall", "The planner stays free", "Calendar, to-dos, and reminders stay free. Plus adds unlimited imports."),
    ("today-mon-hours", "Hour by hour", "Shifts, classes, and overlaps in red, on one timeline."),
    ("add", "Type it or screenshot it", "Semli reads work schedules, syllabi, and messages from class."),
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


def framed(capture: Image.Image, L: Layout) -> Image.Image:
    """The capture inside the website's iPhone render; `screen_w` is the frame's outer width here."""
    frame = Image.open(FRAME).convert("RGBA")
    mask = Image.open(FRAME_MASK).convert("RGBA").split()[-1]
    s = L.screen_w / frame.width
    out = Image.new("RGBA", (L.screen_w, round(frame.height * s)), (0, 0, 0, 0))
    box = (round(47 * s), round(44 * s), round(850 * s), round(1814 * s))
    shot = capture.convert("RGBA").resize((box[2], box[3]), Image.LANCZOS)
    shot.putalpha(mask.resize((box[2], box[3]), Image.LANCZOS))
    out.alpha_composite(shot, (box[0], box[1]))
    out.alpha_composite(frame.resize(out.size, Image.LANCZOS))
    pad = L.shadow * 3
    canvas = Image.new("RGBA", (out.width + 2 * pad, out.height + 2 * pad), (0, 0, 0, 0))
    canvas.alpha_composite(out, (pad, pad))
    return canvas


def device(capture: Image.Image, L: Layout) -> Image.Image:
    """The capture inside a bezel with rounded corners, on a transparent canvas with a soft shadow."""
    if L.frame:
        return framed(capture, L)
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


def fix_paywall_band(capture: Image.Image) -> Image.Image:
    """The paywall cover lays out below the status bar in the current build, leaving a paper band
    with white status text on it. Paint that band the dark canvas until the screen is fixed."""
    img = capture.convert("RGB")
    px = img.load()
    for y in range(0, 350):
        for x in range(img.width):
            r, g, b = px[x, y]
            if 236 < r < 254 and 236 < g < 253 and 230 < b < 250 and abs(r - g) < 12:  # paper, not the white glyphs
                px[x, y] = (21, 21, 21)
    return img


def fix_grey_band(capture: Image.Image) -> Image.Image:
    """A dev-client overlay tints the status bar grey on captures taken right after a deep link. Paint it paper."""
    img = capture.convert("RGB")
    px = img.load()
    for y in range(0, 230):
        for x in range(img.width):
            r, g, b = px[x, y]
            if 70 < r < 244 and abs(r - g) < 10 and abs(g - b) < 10:
                px[x, y] = (250, 249, 246)
    return img


def render(name: str, title: str, sub: str, index: int, L: Layout, out_dir: Path, wordmark: bool) -> Path:
    capture = Image.open(RAW / f"{name}.png")
    if capture.size != (1320, 2868):
        raise SystemExit(f"{name}.png is {capture.size}, expected 1320x2868 (iPhone 17 Pro Max simulator)")
    if name == "paywall":
        capture = fix_paywall_band(capture)
    if name == "today-mon":
        capture = fix_grey_band(capture)
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
    ap.add_argument("--canvas", help="WIDTHxHEIGHT of the output, default 1320x2868 (6.9-inch); e.g. 2007x2853 for the foldable's inner display")
    args = ap.parse_args()
    L = LAYOUTS[args.layout]
    if args.canvas:
        global W, H
        W, H = (int(v) for v in args.canvas.lower().split("x"))
    for i, (name, title, sub) in enumerate(SHOTS, start=1):
        if args.names and name not in args.names:
            continue
        if not (RAW / f"{name}.png").exists():
            print(f"skip {name}: no raw capture")
            continue
        print(render(name, title, sub, i, L, args.out, wordmark=(i == 1)))


if __name__ == "__main__":
    main()
