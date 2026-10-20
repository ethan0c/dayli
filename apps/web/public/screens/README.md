# App screens on the site

Real simulator captures from `design/screenshots/raw/` (1320x2868), halved to 660x1434 so the page stays light. Regenerate after any screen changes:

    for n in today add review item plan today-mon-hours review-update school paywall; do sips -Z 1434 design/screenshots/raw/$n.png --out apps/web/public/screens/$n.png; done

`components/Shot.tsx` puts one inside the iPhone frame. The status bar and Dynamic Island are in the capture; the frame's mask covers them the same way the store screenshots do (`design/screenshots/compose.py`).
