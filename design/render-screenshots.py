#!/usr/bin/env python3
"""Compose the App Store screenshots from raw simulator captures.

Input: design/screenshots/raw/<name>.png, 1320 x 2868 captures from the iPhone 17 Pro Max
simulator (dev build, light mode, 9:41 status bar; see docs/launch-guide.md, part 2).
Output: design/screenshots/<nn>-<name>.png at 1320 x 2868, no alpha, ready for the
6.9-inch slot. Geist SemiBold caption with one ~accent~ word in lavender, Geist Medium subline,
the site's iPhone frame bleeding off the bottom edge. Each shot names its background: paper, soft
lavender, or one of the site's photos darkened under a scrim (the autumn campus, the café, the
Plus fireworks, the golden park), the way Opal, Bevel and Flighty open with a photo poster and
Fantastical alternates backgrounds for rhythm. A contrast guard deepens the caption band until
the type clears 3.5:1. Decided Oct 20, 2026; a serif caption was tried the same day and rejected.

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
PHOTOS = ROOT / "apps" / "web" / "public" / "photos"
SERIF = ROOT / "design" / "fonts" / "Newsreader[opsz,wght].ttf"  # variable; the app ships only the Regular cut
MIN_CONTRAST = 3.5  # above WCAG AA for large text (3:1); the captions are 156px semibold

W, H = 1320, 2868
PAPER = (250, 249, 246)
INK = (34, 35, 32)
SECONDARY = (104, 105, 99)
ACCENT = (112, 87, 189)  # #7057BD, one word per title, the same as the emails
DARK_ACCENT = (195, 175, 248)  # #C3AFF8 on ink and photos
SOFT = (240, 236, 248)  # accentSoft, the tinted paper
ON_PHOTO = (255, 255, 255)
ON_PHOTO_SECONDARY = (232, 230, 226)

# Backgrounds a shot can name. Photos are the site's (apps/web/public/photos/SOURCES.md).
BACKGROUNDS = {
    "paper": PAPER,
    "soft": SOFT,
    "ink": INK,
    "autumn": "hero-autumn.jpg",
    "golden": "hero-golden.jpg",
    "cafe": "cafe-shift.jpg",
    "fireworks": "plus-fireworks.jpg",
    "campus": "campus.jpg",
}
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
    title_size: int = 140
    title_lead: int = 152
    title_weight: str = "SemiBold"  # captions are always bold and large, in Geist (founder, Oct 20, 2026)
    serif: bool = False  # Newsreader was tried Oct 20, 2026 and rejected; kept as an option only
    sub_size: int = 64
    sub_lead: int = 78
    sub_weight: str = "Medium"
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
    "medium": Layout("medium", "left", PAPER, INK, SECONDARY, title_weight="Medium"),
    "bezel": Layout("bezel", "left", PAPER, INK, SECONDARY, frame=False, screen_w=1120),
    # For the 2007 x 2853 foldable canvas: type and phone scaled up so they hold the same share of the width.
    "wide": Layout("wide", "center", PAPER, INK, SECONDARY, title_size=172, title_lead=188, sub_size=80, sub_lead=98, margin=140, device_top=960, screen_w=1320),
}

# Order matters: the first three show in search results. Titles fit two lines at 136px.
# ~word~ marks the one accent word; it is the only lavender on the image.
SHOTS: list[tuple[str, str, str, str]] = [
    ("school", "A semester in ~two minutes~.", "Drop in a syllabus. Semli reads every exam and due date.", "autumn"),
    ("review-update", "~Screenshot~ your shifts.", "New, moved, and dropped shifts, before anything is saved.", "cafe"),
    ("today-mon", "Know what matters ~today~.", "The next thing, the day as a bar, and your list under it.", "paper"),
    ("plan", "School and work in ~one week~.", "Green is done, red is an overlap, a ring is an exam.", "soft"),
    ("review", "Nothing saves until ~you say so~.", "Missing a time? Add it or skip it. Undo is one tap away.", "paper"),
    ("paywall", "The planner stays ~free~.", "Calendar, to-dos, and reminders stay free. Plus adds unlimited imports.", "fireworks"),
    ("today-mon-hours", "~Hour by hour~.", "Shifts, classes, and overlaps in red, on one timeline.", "soft"),
    ("add", "Type it or ~screenshot~ it.", "Semli reads work schedules, syllabi, and messages from class.", "paper"),
    ("item", "Every detail ~one tap~ away.", "Time, course, reminder, and the overlap, with a way out.", "golden"),
]


def font(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"Geist-{weight}.ttf"), size)


def serif(size: int, weight: int = 600) -> ImageFont.FreeTypeFont:
    """Newsreader at display optical size; SemiBold by default so it holds up on photos."""
    f = ImageFont.truetype(str(SERIF), size)
    f.set_variation_by_axes([weight, 72])  # axes: Weight, Optical Size
    return f


def luminance(rgb) -> float:
    def ch(c: float) -> float:
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(fg, bg) -> float:
    a, b = luminance(fg), luminance(bg)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def ensure_contrast(img: Image.Image, box: tuple[int, int, int, int], colors, name: str) -> Image.Image:
    """Deepens the scrim over the caption band only, until every caption color clears
    MIN_CONTRAST against the bright end of that band (95th percentile of 24 x 12 patches, so one
    glint cannot blacken the whole poster). The rest of the photo keeps its color."""
    x0, y0, x1, y1 = box
    fade = 220
    band = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(band)
    d.rectangle((0, 0, img.width, y1), fill=255)
    for i in range(fade):  # soft lower edge so the darkening never shows as a line
        d.line((0, y1 + i, img.width, y1 + i), fill=round(255 * (1 - i / fade)))
    ink = Image.new("RGB", img.size, INK)
    for step in range(16):
        region = img.crop(box).resize((24, 12), Image.BOX)
        bright = sorted(region.getdata(), key=luminance)[int(0.95 * (24 * 12 - 1))]
        worst = min(contrast(c, bright) for c in colors)
        if worst >= MIN_CONTRAST:
            if step:
                print(f"  {name}: caption band deepened {step} step(s), contrast {worst:.1f}")
            return img
        img = Image.composite(Image.blend(img, ink, 0.07), img, band)
    return img


def is_photo(bg: str) -> bool:
    return isinstance(BACKGROUNDS[bg], str)


def background(bg: str, w: int, h: int) -> Image.Image:
    """A solid, or a site photo cover-cropped and darkened under a scrim so white type reads."""
    value = BACKGROUNDS[bg]
    if not isinstance(value, str):
        return Image.new("RGB", (w, h), value)
    photo = Image.open(PHOTOS / value).convert("RGB")
    scale = max(w / photo.width, h / photo.height)
    photo = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
    if bg == "fireworks":  # 900 x 1200 source; a blur hides the upscale and keeps the phone's own fireworks the sharp ones
        photo = photo.filter(ImageFilter.GaussianBlur(14))
    # Where to look: the autumn hero's trees are at its left edge (the site crops the same way);
    # the others are centered. Tall canvases keep the top of the frame.
    focus = 0.12 if bg == "autumn" else 0.5
    left = round((photo.width - w) * focus)
    top = 0 if h > w else (photo.height - h) // 2
    photo = photo.crop((left, top, left + w, top + h))
    # Scrim: ink over the caption area so white and lavender type read (heavier where the
    # photo is pale: the autumn sky, the golden bokeh), deepening to 66% behind the phone so
    # the screen is the brightest thing on the image. ensure_contrast() adds more if needed.
    top_scrim = {"autumn": 0.46, "golden": 0.52}.get(bg, 0.28)
    scrim = Image.new("L", (1, h))
    px = scrim.load()
    for y in range(h):
        t = y / h
        px[0, y] = round(255 * (top_scrim + (0.66 - top_scrim) * min(1.0, max(0.0, (t - 0.22) / 0.5))))
    scrim = scrim.resize((w, h))
    ink = Image.new("RGB", (w, h), INK)
    return Image.composite(ink, photo, scrim)


def rich(text: str) -> list[tuple[str, bool]]:
    """Words with an accent flag; ~a span~ marks the accent words."""
    out: list[tuple[str, bool]] = []
    on = False
    for word in text.split():
        start = word.startswith("~")
        if start:
            on = True
        clean = word.replace("~", "")
        out.append((clean, on))
        if word.endswith("~") or (start and word.count("~") == 2):
            on = False
    return out


def plain(text: str) -> str:
    return text.replace("~", "")


def rich_block(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, x0: int, y: int, width: int, lead: int, color, accent, align: str = "left", canvas_w: int | None = None) -> int:
    """Wraps like `wrap`, then draws word by word so the accent words take the accent color."""
    words = rich(text)
    lines: list[list[tuple[str, bool]]] = []
    line: list[tuple[str, bool]] = []
    for w in words:
        trial = " ".join(t for t, _ in line + [w])
        if draw.textlength(trial, font=f) <= width or not line:
            line.append(w)
        else:
            lines.append(line)
            line = [w]
    if line:
        lines.append(line)
    space = draw.textlength(" ", font=f)
    for ln in lines:
        full = " ".join(t for t, _ in ln)
        x = x0 if align == "left" else ((canvas_w or W) - draw.textlength(full, font=f)) / 2
        for i, (t, acc) in enumerate(ln):
            draw.text((x, y), t, font=f, fill=accent if acc else color)
            x += draw.textlength(t, font=f) + (space if i < len(ln) - 1 else 0)
        y += lead
    return y


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


def render(name: str, title: str, sub: str, bg: str, index: int, L: Layout, out_dir: Path, wordmark: bool) -> Path:
    capture = Image.open(RAW / f"{name}.png")
    if capture.size != (1320, 2868):
        raise SystemExit(f"{name}.png is {capture.size}, expected 1320x2868 (iPhone 17 Pro Max simulator)")
    if name == "paywall":
        capture = fix_paywall_band(capture)
    if name == "today-mon":
        capture = fix_grey_band(capture)
    photo = is_photo(bg)
    img = background(bg, W, H) if L.bg == PAPER else Image.new("RGB", (W, H), L.bg)
    draw = ImageDraw.Draw(img)
    width = W - 2 * L.margin
    dark = photo or L.bg != PAPER
    ink_color = ON_PHOTO if photo else L.ink
    secondary = ON_PHOTO_SECONDARY if photo else L.secondary

    y = L.title_top
    if wordmark and WORDMARK.exists():
        mark = Image.open(WORDMARK).convert("RGBA")
        mark = mark.resize((220, round(mark.height * 220 / mark.width)), Image.LANCZOS)
        if dark:  # ink wordmark on a dark ground: recolor the letters, keep the dots
            r, g, b, a = mark.split()
            mark = Image.merge("RGBA", (Image.new("L", mark.size, 245), Image.new("L", mark.size, 244), Image.new("L", mark.size, 240), a))
        x = L.margin if L.align == "left" else (W - mark.width) // 2
        img.paste(mark, (x, y - 24), mark)
        y += mark.height + 44

    tf = serif(L.title_size) if L.serif else font(L.title_size, L.title_weight)
    accent = DARK_ACCENT if dark else ACCENT
    if photo:
        img = ensure_contrast(img, (L.margin, L.title_top, W - L.margin, L.device_top), [ink_color, accent, secondary], name)
        draw = ImageDraw.Draw(img)
    y = rich_block(draw, title, tf, L.margin, y, width, L.title_lead, ink_color, accent, L.align)
    y += 30
    sf = font(L.sub_size, L.sub_weight)
    y = text_block(draw, wrap(draw, sub, sf, width), sf, y, L.sub_lead, secondary, L)

    dev = device(capture, L)
    pad = L.shadow * 3
    top = max(L.device_top, y + 64)
    img.paste(dev, ((W - dev.width) // 2, top - pad), dev)

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{index:02d}-{name}.png"
    img.save(out, "PNG", optimize=True)
    return out


# Creative assets (iOS 27 product page). Apple's examples: the header is a brand banner above the
# icon with the name centered and no UI; the search card carries a short headline and a phone.
# Safe areas measured from Apple's templates: header 1646 x 661 centered; search 2168 x 1030 centered.
HEADER_OUT = OUT / "header"
TAGLINE = "Your week, already ~organized~."
SEARCH_SUB = "Drop in a syllabus or a work schedule. Semli tells you what matters today."


def header_banner(out_dir: Path = HEADER_OUT) -> Path:
    """3840 x 1646 product page header: the site hero. Autumn campus under a scrim, the white
    wordmark and the serif tagline centered inside Apple's 1646 x 661 safe area."""
    w, h = 3840, 1646
    img = background("autumn", w, h)
    draw = ImageDraw.Draw(img)
    mark = Image.open(WORDMARK).convert("RGBA")
    mw = 760
    mark = mark.resize((mw, round(mark.height * mw / mark.width)), Image.LANCZOS)
    r, g, b, a = mark.split()
    mark = Image.merge("RGBA", (Image.new("L", mark.size, 255), Image.new("L", mark.size, 255), Image.new("L", mark.size, 255), a))
    tf = font(120, "SemiBold")
    block = mark.height + 36 + 138
    y = (h - block) // 2
    img = ensure_contrast(img, ((w - 1646) // 2, (h - 661) // 2, (w + 1646) // 2, (h + 661) // 2), [ON_PHOTO, DARK_ACCENT], "header")
    draw = ImageDraw.Draw(img)
    img.paste(mark, ((w - mw) // 2, y), mark)
    y += mark.height + 36
    rich_block(draw, TAGLINE, tf, 0, y, w, 138, ON_PHOTO, DARK_ACCENT, "center", w)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"header-{w}x{h}.png"
    img.save(out, "PNG", optimize=True)
    return out


def search_card(out_dir: Path = HEADER_OUT) -> Path:
    """3840 x 2560 search results asset: the site hero again. Serif headline and subline on the
    left in white, the Today phone on the right, inside the centered 2168 x 1030 safe area."""
    w, h = 3840, 2560
    img = background("autumn", w, h)
    draw = ImageDraw.Draw(img)
    left, text_w = 300, 1680
    tf = font(208, "SemiBold")
    lines = wrap(draw, plain(TAGLINE), tf, text_w)
    sf = font(84, "Medium")
    img = ensure_contrast(img, (left, 300, left + text_w, h - 300), [ON_PHOTO, DARK_ACCENT, ON_PHOTO_SECONDARY], "search")
    draw = ImageDraw.Draw(img)
    sub_lines = wrap(draw, SEARCH_SUB, sf, text_w)
    block = len(lines) * 236 + 48 + len(sub_lines) * 100
    y = (h - block) // 2 - 80
    y = rich_block(draw, TAGLINE, tf, left, y, text_w, 236, ON_PHOTO, DARK_ACCENT)
    y += 48
    for line in sub_lines:
        draw.text((left, y), line, font=sf, fill=ON_PHOTO_SECONDARY)
        y += 100
    L = Layout("search", "left", PAPER, INK, SECONDARY, screen_w=1180)
    phone = device(Image.open(RAW / "today.png"), L)
    pad = L.shadow * 3
    img.paste(phone, (w - 300 - 1180 - pad, 420 - pad), phone)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"search-{w}x{h}.png"
    img.save(out, "PNG", optimize=True)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="raw capture names to render (default: all)")
    ap.add_argument("--layout", choices=sorted(LAYOUTS), default="left")
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--header", action="store_true", help="render the product page header (3840x1646) and the search results card (3840x2560) instead of screenshots")
    ap.add_argument("--bg", choices=sorted(BACKGROUNDS), help="force one background for every shot (default: each shot's own)")
    ap.add_argument("--canvas", help="WIDTHxHEIGHT of the output, default 1320x2868 (6.9-inch); e.g. 2007x2853 for the foldable's inner display")
    args = ap.parse_args()
    L = LAYOUTS[args.layout]
    if args.header:
        out_dir = args.out if args.out != OUT else HEADER_OUT
        print(header_banner(out_dir))
        print(search_card(out_dir))
        return
    if args.canvas:
        global W, H
        W, H = (int(v) for v in args.canvas.lower().split("x"))
    for i, (name, title, sub, bg) in enumerate(SHOTS, start=1):
        if args.names and name not in args.names:
            continue
        if not (RAW / f"{name}.png").exists():
            print(f"skip {name}: no raw capture")
            continue
        print(render(name, title, sub, args.bg or bg, i, L, args.out, wordmark=(i == 1)))


if __name__ == "__main__":
    main()
