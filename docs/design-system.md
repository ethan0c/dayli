# Dayli — Design system

Status: draft · October 2026 · Visual board: [Dayli Brand Board](https://claude.ai/artifact/YCbSnkHstRe3T5HJ4Pt4x6) (private until shared)

## 1. Principles

1. **Calm by default.** Soft neutrals, one accent (lavender), no gradients, no badges unless something needs attention.
2. **Time is the hero.** The big clock and the week strip anchor every Plan screen; content is a simple vertical list, not a grid.
3. **Shape tells type.** Tasks are neutral rows with a check circle on the right. Events are tinted rows with a time chip on the right. Users can tell them apart without reading.
4. **One thumb.** Primary actions live in the bottom 40% of the screen: the floating nav pill and the capture button.
5. **Show the source.** Anything AI-created can always show where it came from.

## 2. What we're taking from the reference UI

| Element in reference | Dayli spec |
|---|---|
| Large clock `11:50` top-left, date + weekday right-aligned | `display-xl` clock, tabular numbers; date in `callout` |
| Week strip, selected day in a white circle | 7 equal columns; selected = surface circle 36 pt; today (if not selected) = lavender dot under number |
| Header on light gray, list on white | `bg.header` band behind clock & strip; list on `bg.canvas` |
| Gray task rows with line icon and empty circle | `TaskRow` |
| Lavender event rows with white time pill | `EventRow` + `TimeChip` |
| Completed row: struck text, filled black check, faded | `TaskRow[done]`, moves to bottom of list |
| Dark floating nav pill; active segment light pill | `NavPill` |
| Round button, `×` when open; menu of "To Do / Event" | `CaptureButton` + `CaptureMenu`; Dayli's menu leads with **Tell Dayli** (text/voice), then Photo, File, To-do, Event |
| Gray scrim over content when menu open | `scrim` token at 40% |

## 3. Typography

**Primary face: Outfit** (OFL, Google Fonts). Round, geometric, closest to the reference clock. Chosen Oct 19, 2026 over Onest, Figtree, and Plus Jakarta Sans. Bundled in the app via `@expo-google-fonts/outfit`; SF Pro as fallback.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | 56 / 56 | 400 | −3% | Clock on Plan |
| `display` | 34 / 40 | 500 | −2% | Today greeting |
| `title` | 22 / 28 | 600 | −1% | Screen & sheet titles |
| `headline` | 17 / 22 | 600 | 0 | Section headers, card titles |
| `body` | 16 / 22 | 400 | 0 | Row titles, body |
| `callout` | 15 / 20 | 400 | 0 | Header date, secondary text |
| `subhead` | 13 / 18 | 500 | 0 | Metadata, chip text |
| `caption` | 12 / 16 | 400 | +1% | Weekday labels ("mon"), hints |
| `overline` | 11 / 14 | 600 | +6%, uppercase | Section eyebrows ("COMING UP") |

Support Dynamic Type: every token scales; the clock caps at 72 pt.

## 4. Color

### 4.1 Lavender scale (brand)
| Step | Hex | Use |
|---|---|---|
| 50 | `#F6F4FE` | Hover/pressed tint on white |
| 100 | `#EEEAFD` | Subtle highlight, ambiguous-field background |
| 200 | `#DCD4FB` | **Event row fill** (matches reference) |
| 300 | `#C5B8F7` | Event row pressed, selection |
| 400 | `#A796F0` | Decorative, charts |
| 500 | `#8A74E6` | Brand mark accent (Day Ring arc) |
| 600 | `#6F57D4` | Accent text/icons on light (AA on white: 5.0:1) |
| 700 | `#5843B0` | Pressed accent |
| 800 | `#43338A` | Text on lavender-200 |
| 900 | `#2E2460` | Dark-mode event row fill |

### 4.2 Neutrals (slight violet bias, never pure gray)
| Token | Light | Dark |
|---|---|---|
| `bg.canvas` | `#FFFFFF` | `#0F0E13` |
| `bg.header` | `#F1F0F4` | `#17161C` |
| `bg.row` (task) | `#F2F2F5` | `#1E1D24` |
| `bg.surface` (sheets, menus, selected day) | `#FFFFFF` | `#25242C` |
| `ink.primary` | `#18171C` | `#F4F3F8` |
| `ink.secondary` | `#6B6A75` | `#A4A3AE` |
| `ink.tertiary` | `#A09FA8` | `#6E6D78` |
| `line` | `#E4E3EA` | `#2E2D35` |
| `nav.bg` | `#1C1B21` | `#2A2931` |
| `scrim` | `rgba(24,23,28,.40)` | `rgba(0,0,0,.55)` |

### 4.3 Categories (event fills)
Events tint by category; tasks stay neutral. Keep each fill at the same lightness so the list stays calm.

| Category | Light fill | Dark fill | Icon/ink |
|---|---|---|---|
| School | lavender-200 `#DCD4FB` | `#2E2460` | lavender-800 |
| Work | apricot `#FBDCC8` | `#4A2C1C` | `#7A3E1A` |
| Personal | mint `#CDEBDD` | `#1C3A2D` | `#1F5A40` |
| Custom (user) | 6 extra hues at the same lightness | | |

### 4.4 Semantic
| Token | Light | Use |
|---|---|---|
| `conflict` | `#E5544A` on `#FCE3E0` | Overlaps, removed shifts |
| `changed` | `#B7791F` on `#FBEFD5` | Modified shifts |
| `new` | `#2E8B57` on `#DDF2E6` | New items in diffs |
| `pending` | `ink.tertiary` + 45° hatch | Unpublished work weeks |

## 5. Spacing, radius, elevation

- **Grid:** 4 pt. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- **Screen gutter:** 16 pt. Row gap: 8 pt. Section gap: 24 pt.
- **Row height:** 52 pt (min 44 pt touch target).
- **Radius:** chip `999`, row `16`, card `20`, sheet `28` (top corners), nav pill `999`, capture button circle.
- **Elevation:** flat everywhere except floating elements:
  - `float`: `0 8 24 rgba(24,23,28,.16)` — nav pill, capture button, capture menu.
  - Sheets use the scrim instead of shadow.

## 6. Iconography
- 24 pt grid, 1.75 pt stroke, rounded caps and joins, outline style (matches reference: book stack, checkbox, calendar, search, pencil, printer, grid).
- Base set: Phosphor (Regular) or Lucide, tuned to 1.75 stroke; custom icons for Dayli-specific concepts (shift, syllabus, source, pending).
- Rows use the item's category/kind icon at 20 pt in `ink.primary`.

## 7. Components

| Component | Anatomy | States / variants |
|---|---|---|
| `ClockHeader` | Time (display-xl) · date + weekday (callout, right) | 12/24h |
| `WeekStrip` | 7 × (number `headline` 400, weekday `caption`) | selected (white circle), today dot, has-items dot, swipe to change week |
| `TaskRow` | icon · title · check circle 22 pt | default, pressed, done (struck, 50% ink, filled ink check), overdue (conflict ink date), from-import (tiny source glyph) |
| `EventRow` | icon · title · `TimeChip` | category fills, conflict (2 pt conflict border), pending (hatched), all-day (no chip) |
| `TimeChip` | pill, `subhead`, `bg.surface` at 70% on fill | single time, range "4–10 pm" |
| `NavPill` | 3 segments, icon + label on active | active segment `bg.surface` pill w/ ink text; inactive icon only in `ink.tertiary`-on-dark |
| `CaptureButton` | 56 pt circle, `bg.surface`, ink `+` | open → rotates 45° to `×`, scrim fades in |
| `CaptureMenu` | stacked white pills, right-aligned above button | items: Tell Dayli · Photo · File · To-do · Event |
| `CaptureSheet` | text field "Add anything…", mic, camera, library, file | idle, recording (waveform), processing (source thumb + shimmer) |
| `ReviewCard` | kind icon · title · date/time fields · course/employer | confident, needs-input (lavender-100 field + question chip), excluded (toggle off) |
| `DiffGroup` | header (New/Changed/Removed/Unchanged) + rows | changed rows show old time struck → new time |
| `SuggestionCard` | lavender-50 card, "Dayli suggests" overline, text, 2 buttons | dismissible |
| `ComingUpRow` | title · relative date ("3 days away") | urgency ink when ≤ 1 day |
| `CourseCard` | course code overline · title · next deadline · meeting pattern | |
| `Toast` | dark pill bottom, action "Undo" | auto-dismiss 5 s |

## 8. Motion
- Default spring: response 0.35 s, damping 0.85. Respect Reduce Motion (crossfade only).
- **Complete task:** circle fills (150 ms) → text strikes left-to-right (200 ms) → row fades to 50% and slides to bottom (300 ms, delayed 600 ms so it can be undone by tapping again).
- **Capture open:** `+` rotates to `×`, menu pills stagger up 30 ms each, scrim fades 200 ms.
- **Extraction processing:** soft shimmer across the source thumbnail; items "land" into the review list one by one.
- **Week swipe:** strip and list move together; haptic tick on day change.
- Haptics: light on check, success on import commit, warning on conflict surfaced.

## 9. Voice in UI
Short, warm, specific. Say what happened, offer the next step.
- ✅ "Added 3 shifts. 1 overlaps your Thursday lab." ❌ "Operation completed successfully."
- ✅ "Which Friday did you mean?" ❌ "Ambiguous date detected."
- ✅ "Next week's schedule isn't out yet." ❌ "No data."
Greeting uses time of day and a light touch: "Good morning, Maya." (no emoji in system copy; the ♡ in the overview mock is for marketing only).

## 10. Accessibility
- Text contrast ≥ 4.5:1 (event row text uses lavender-800 or ink on lavender-200: 11:1).
- Never rely on color alone: event vs. task also differs by right-side element (chip vs. circle); conflict adds an icon.
- VoiceOver labels: "Lunch, event, 2 PM, school." / "Research, to-do, not done."
- Dynamic Type up to AX3 with rows growing vertically; week strip collapses to 5 visible days at AX sizes.

## 11. Dark mode
Mirror tokens (§4.2–4.3). Header band gets slightly lighter than canvas; event fills drop to deep tints with light ink; the nav pill lightens slightly so it still separates from the canvas.
