#!/usr/bin/env python3
"""Compose the App Store screenshots from raw simulator captures.

Input: design/screenshots/raw/<name>.png, 1320 x 2868 captures from the iPhone 17 Pro Max
simulator (dev build, light mode, 9:41 status bar; see docs/launch-guide.md, part 2).
Output: design/screenshots/<nn>-<name>.png at 1320 x 2868, no alpha, ready to upload for
the 6.9-inch slot. Captions use Geist Regular on paper, ink text, one device per image.

    python3 design/render-screenshots.py            # all
    python3 design/render-screenshots.py today plan  # a subset, by raw name
"""
from __future__ import annotations

import sys
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
BEZEL = (18, 18, 18)

MARGIN = 96
TITLE_SIZE, TITLE_LEAD = 84, 96
SUB_SIZE, SUB_LEAD = 40, 50
TITLE_TOP = 150
DEVICE_TOP = 540
SCREEN_W = 1016  # 0.77 of the capture
BEZEL_W = 26
SCREEN_RADIUS = 124
SHADOW = 40

# Order matters: the first three show in search results.
SHOTS: list[tuple[str, str, str]] = [
    ("school", "Set up your semester in two minutes", "Drop in a syllabus. Semli reads every exam and due date."),
    ("review-update", "Screenshot your shifts. See what changed.", "New, moved, and dropped shifts, before anything is saved."),
    ("today-mon", "Know what matters today", "The next thing, the day as a bar, and your list under it."),
    ("plan", "Classes, shifts, and life in one week", "Green is done, red is an overlap, a ring is an exam."),
    ("review", "Nothing is saved until you confirm", "Missing a time? Add it or skip it. Undo is one tap away."),
    ("paywall", "Calendar, to-dos, reminders: always free", "Plus adds unlimited imports, Canvas sync, and schedule updates."),
    ("today-mon-hours", "See the day by the hour", "Overlaps show in red before they become a problem."),
    ("add", "Type it, paste it, or drop in a screenshot", "Semli reads schedules, syllabi, and messages from class."),
]


def font(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"Geist-{weight}.ttf"), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=f) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def device(capture: Image.Image) -> Image.Image:
    """The capture inside a black bezel with rounded corners, on a transparent canvas with a soft shadow."""
    scale = SCREEN_W / capture.width
    screen = capture.convert("RGB").resize((SCREEN_W, round(capture.height * scale)), Image.LANCZOS)
    sw, sh = screen.size
    dw, dh = sw + 2 * BEZEL_W, sh + 2 * BEZEL_W
    pad = SHADOW * 3
    canvas = Image.new("RGBA", (dw + 2 * pad, dh + 2 * pad), (0, 0, 0, 0))

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + 24, pad + dw, pad + dh + 24), radius=SCREEN_RADIUS + BEZEL_W, fill=(0, 0, 0, 46))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(SHADOW)))

    body = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((pad, pad, pad + dw, pad + dh), radius=SCREEN_RADIUS + BEZEL_W, fill=BEZEL + (255,))
    canvas.alpha_composite(body)

    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw, sh), radius=SCREEN_RADIUS, fill=255)
    canvas.paste(screen, (pad + BEZEL_W, pad + BEZEL_W), mask)
    return canvas


def render(name: str, title: str, sub: str, index: int, show_wordmark: bool) -> Path:
    capture = Image.open(RAW / f"{name}.png")
    if capture.size != (W, H):
        raise SystemExit(f"{name}.png is {capture.size}, expected {W}x{H} (iPhone 17 Pro Max simulator)")
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    y = TITLE_TOP
    if show_wordmark and WORDMARK.exists():
        mark = Image.open(WORDMARK).convert("RGBA")
        mark = mark.resize((200, round(mark.height * 200 / mark.width)), Image.LANCZOS)
        img.paste(mark, (MARGIN, y - 20), mark)
        y += mark.height + 40

    tf = font(TITLE_SIZE)
    for line in wrap(draw, title, tf, W - 2 * MARGIN):
        draw.text((MARGIN, y), line, font=tf, fill=INK)
        y += TITLE_LEAD
    y += 28
    sf = font(SUB_SIZE)
    for line in wrap(draw, sub, sf, W - 2 * MARGIN):
        draw.text((MARGIN, y), line, font=sf, fill=SECONDARY)
        y += SUB_LEAD

    dev = device(capture)
    pad = SHADOW * 3
    top = max(DEVICE_TOP, y + 50)
    img.paste(dev, ((W - dev.width) // 2, top - pad), dev)

    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{index:02d}-{name}.png"
    img.save(out, "PNG", optimize=True)
    return out


def main(only: list[str]) -> None:
    for i, (name, title, sub) in enumerate(SHOTS, start=1):
        if only and name not in only:
            continue
        if not (RAW / f"{name}.png").exists():
            print(f"skip {name}: no raw capture")
            continue
        print(render(name, title, sub, i, show_wordmark=(i == 1)))


if __name__ == "__main__":
    main(sys.argv[1:])
