#!/usr/bin/env python3
"""
Will Today's header read on this sky? Scores a candidate photo the way the app draws it.

    python3 design/check-sky.py path/to/sky.webp [more photos...] [--dark] [--wash 0.22]
    python3 design/check-sky.py --light-text path/to/night.webp

A light sky takes ink text (the default check). A dark sky in light mode takes light text
(`--light-text`, SKY_LOOK's `light`): the photo is drawn tall enough that its dark top reaches
past the day bar, so this reports `darkTo`, the share of the frame from the top that keeps
light text at 4.5:1, to set in `apps/mobile/src/lib/sky.ts`.

The app shows the photo 330 points tall, washes it with the page colour (`dim` in
SkyHeader), then fades it into the page from 30% of its height down. Over it sit, on a
phone with a 59-point top inset, the date line (79-123), the big number (129-189) and the
featured item's two lines (195-245), all in ink. For each band this prints the contrast of
ink against the 5th-percentile pixel under it; every band needs 4.5:1. It also prints the
lightest wash that would pass, so a photo that fails only slightly can be kept.

Photos should be at least 1179 x 990 (3x) and are cropped to fill the width, like the app.
Needs Pillow (pip install pillow).
"""
import argparse
import sys

from PIL import Image

PAGE = {'light': ('#FAF9F6', '#222320'), 'dark': ('#151515', '#F5F4F0')}
HEIGHT = 330
FADE_FROM = 0.3
BANDS = [('date line', 79, 123), ('big number', 129, 189), ('featured item', 195, 245)]
NEEDED = 4.5


def rgb(hex_colour):
    h = hex_colour.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminance(c):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def bands(photo, mode, wash):
    page, ink = (rgb(c) for c in PAGE[mode])
    width, height = photo.size
    scale = height / HEIGHT
    fade_top = HEIGHT * FADE_FROM
    result = []
    for name, y0, y1 in BANDS:
        values = []
        for y in range(y0, y1, 3):
            fade = smoothstep((y - fade_top) / (HEIGHT - fade_top)) if y > fade_top else 0
            for x in range(int(24 * scale), int(width - 24 * scale), 7):
                p = photo.getpixel((x, min(height - 1, int(y * scale))))
                p = tuple(pc * (1 - wash) + gc * wash for pc, gc in zip(p, page))
                p = tuple(pc * (1 - fade) + gc * fade for pc, gc in zip(p, page))
                values.append(contrast(p, ink))
        values.sort()
        result.append((name, values[len(values) // 20]))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('photos', nargs='+')
    parser.add_argument('--dark', action='store_true', help='score against the dark page and its light ink')
    parser.add_argument('--wash', type=float, default=None, help='the dim SkyHeader uses (default 0 light, 0.1 dark)')
    parser.add_argument('--light-text', action='store_true', help='a dark sky under the light page: report how far down light text holds')
    args = parser.parse_args()
    if args.light_text:
        failed = False
        for path in args.photos:
            photo = Image.open(path).convert('RGB')
            light = rgb(PAGE['dark'][1])
            dark_to = 0.0
            for row in range(photo.height):
                values = sorted(contrast(photo.getpixel((x, row)), light) for x in range(0, photo.width, 7))
                if values[len(values) // 20] < NEEDED:
                    break
                dark_to = (row + 1) / photo.height
            # Today needs about 310 points of dark sky; a photo drawn more than 1.6x tall loses too much of its width.
            ok = dark_to >= 310 / (HEIGHT * 1.6)
            failed |= not ok
            print(f"{'PASS' if ok else 'FAIL'}  {path}  (light text)  darkTo {dark_to:.2f}")
        sys.exit(1 if failed else 0)
    mode = 'dark' if args.dark else 'light'
    wash = args.wash if args.wash is not None else (0.1 if args.dark else 0.0)
    failed = False
    for path in args.photos:
        photo = Image.open(path).convert('RGB')
        # Fill the 393-point width at 3x, as the app's cover crop does.
        if photo.width != 1179:
            photo = photo.resize((1179, round(photo.height * 1179 / photo.width)))
        scores = bands(photo, mode, wash)
        ok = all(score >= NEEDED for _, score in scores)
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'}  {path}  ({mode}, wash {wash:.2f})")
        for name, score in scores:
            print(f"      {name:14s} {score:4.1f}:1{'' if score >= NEEDED else '  needs 4.5'}")
        if not ok:
            need = next((w / 100 for w in range(int(wash * 100), 96) if all(s >= NEEDED for _, s in bands(photo, mode, w / 100))), None)
            print(f"      lightest passing wash: {need:.2f}" if need is not None else '      no wash up to 0.95 passes')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
