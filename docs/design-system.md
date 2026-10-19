# Semli — Design system

Status: draft · October 2026 · Visual board: [Semli Brand Board](https://claude.ai/artifact/YCbSnkHstRe3T5HJ4Pt4x6) (private until shared)

## 1. Principles

1. **Calm by default.** Soft neutrals, one accent (lavender), no gradients, no badges unless something needs attention.
   Never all-caps eyebrows or overlines: uppercase section labels read as AI-generated template UI. Section labels are sentence case, small, and muted.
2. **Time is the hero.** The big clock and the week strip anchor every Plan screen; content is a simple vertical list, not a grid. Give each day a clear heading and group its events and to-dos.
3. **Shape tells type.** Tasks are neutral rows with a check circle on the right. Events are tinted rows with a time chip on the right. Users can tell them apart without reading.
4. **One thumb.** iOS keeps the system tab bar. Add uses the detached native circle on iOS 26, matching Helthy's `role: "search"` pattern; other platforms keep their existing navigation.
5. **Show the source.** Anything AI-created can always show where it came from.

## 2. What we're taking from the reference UI

| Element in reference | Semli spec |
|---|---|
| Large clock `11:50` top-left, date + weekday right-aligned | `display-xl` clock, tabular numbers; date in `callout` |
| Week strip, selected day in a circle | 7 equal columns; selected = surface circle with primary text, 36 pt; today (if not selected) = lavender number. Swipe to change weeks; VoiceOver exposes previous/next week actions. |
| Header on light gray, list on white | `bg.header` band behind clock & strip; list on `bg.canvas` |
| Gray task rows with line icon and empty circle | `TaskRow` |
| Lavender event rows with white time pill | `EventRow` + `TimeChip` |
| Completed row: struck text, filled black check | `TaskRow[done]`, secondary text with full contrast; moves to bottom of list |
| Bottom navigation | Native iOS tabs; the detached search-role slot displays a plus and opens Add while preserving the active tab. |
| Round button, `×` when open; menu of "To Do / Event" | Three actions: **Tell Semli**, **To-do**, **Event**. Photo and PDF live inside Tell Semli. Outside tap, close, or Back dismisses. |
| Gray scrim over content when menu open | `scrim` token at 40% |

## 3. Typography

Gilroy was previewed on Oct 19, 2026 and set aside; the free package covers only two weights and its EULA does not clearly allow app embedding. The files remain in `apps/mobile/assets/fonts/` and are not loaded.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | 56 / 56 | 400 | −3% | Display numerals; Plan clock uses 48 / 56 to match the reference |
| `display` | 34 / 40 | 500 | −2% | Today greeting |
| `title` | 22 / 28 | 600 | −1% | Screen & sheet titles |
| `headline` | 17 / 22 | 600 | 0 | Section headers, card titles |
| `body` | 16 / 22 | 400 | 0 | Row titles, body |
| `callout` | 15 / 20 | 400 | 0 | Header date, secondary text |
| `subhead` | 13 / 18 | 500 | 0 | Metadata, chip text |
| `caption` | 12 / 16 | 400 | +1% | Weekday labels ("mon"), hints |
| `overline` | 12 / 16 | 600 | 0 | Section labels in sentence case ("Coming up"), muted color. Never uppercase. |

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
| `ink.tertiary` | `#6E6977` | `#918B9B` |
| `onPrimary` | `#FFFFFF` | `#18171C` |
| `onAccent` | `#FFFFFF` | `#18171C` |
| `onNav` | `#F4F3F8` | `#F4F3F8` |
| `controlOutline` | `#85818F` | `#87838F` |
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
| `conflict` | `#B52C24` on `#FCE3E0` | Overlaps, removed shifts |
| `changed` | `#80510A` on `#FBEFD5` | Modified shifts |
| `new` | `#246C43` on `#DDF2E6` | New items in diffs |
| `pending` | `ink.tertiary` + 45° hatch | Unpublished work weeks |

### 4.5 Tints (added Oct 19, 2026)
Six soft fills at the same lightness, each with its own ink: lavender, apricot, mint, sky, butter, rose (`packages/tokens` → `tint`). Rules:
- Work events are apricot, personal events mint. School events take **their course's tint**, assigned in order lavender → sky → rose → butter → mint → apricot as courses are added, so a week never reads as one color.
- Today and School use a shared compact header with profile and Pro controls. Plan starts directly with the clock/date and week strip in a neutral band, including the top safe area. Its populated list has no redundant screen title, day title, or event/task section labels. Both palettes carry all six event tints.
- Tasks stay neutral (gray row, check circle) so events still stand out.
- Loading states use the lavender/apricot/mint dots (see `Reading`).

## 5. Spacing, radius, elevation

- **Grid:** 4 pt. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- **Screen gutter:** 24 pt, shared through `SCREEN_GUTTER` in the mobile theme. Based on the side margins in [Cal AI’s app previews](https://www.calai.app/food-db.webp). Apply it to screen headers, content, sheets, and onboarding. Row gap: 8 pt. Section gap: 24 pt.
- **Row height:** 54 pt minimum for planner items, with 16 pt regular titles and bare 20 pt icons. Titles wrap and rows grow with text size. Only meaningful deadline/conflict metadata is shown. Other controls have a 44 pt minimum touch target.
- **Surfaces:** use fills and spacing instead of decorative card outlines. Keep borders for meaningful states such as conflicts and completion controls. Inputs, course cards, capture cards, and the paywall use the same flat treatment.
- **Radius:** chip `999`, row `16`, card `20`, sheet `28` (top corners), nav pill `999`, capture button circle.
- **Elevation:** flat everywhere except floating elements:
  - `float`: `0 8 24 rgba(24,23,28,.16)` — nav pill, capture button, capture menu.
  - Sheets use the scrim instead of shadow.

## 6. Iconography
- 24 pt grid, 1.75 pt stroke, rounded caps and joins, outline style (matches reference: book stack, checkbox, calendar, search, pencil, printer, grid).
- Base set: Phosphor (Regular) or Lucide, tuned to 1.75 stroke; custom icons for Semli-specific concepts (shift, syllabus, source, pending).
- Rows use the item's category/kind icon at 20 pt in `ink.primary`.

## 7. Components

| Component | Anatomy | States / variants |
|---|---|---|
| `ClockHeader` | Time (display-xl) · date + weekday (callout, right) | 12/24h |
| `WeekStrip` | 7 × (number `headline` 400, weekday `caption`) | selected (white circle), today dot, has-items dot, swipe to change week |
| `TaskRow` | bare icon · regular title · check circle 22 pt | default, pressed, done (struck, secondary ink, filled check); deadline/conflict metadata only |
| `EventRow` | icon · title · `TimeChip` | category fills, conflict (2 pt conflict border), pending (hatched), all-day (no chip) |
| `TimeChip` | pill, `subhead`, `bg.surface` at 70% on fill | single time, range "4–10 pm" |
| iOS tabs | Today · Plan · School, plus detached Add circle | System-managed glass and selection. Search-role Add prevents native selection and handles `tabPress`, so the underlying screen stays selected. |
| `CaptureButton` | native detached `+`; open overlay uses surface circle and `×` | Icon changes immediately, with no rotation; scrim fades in |
| `CaptureMenu` | stacked surface pills, right-aligned above button | Tell Semli · To-do · Event; reduced-motion support; dismiss before presenting the next sheet |
| Manual create sheet | title · date/time · category · optional course/employer · notes | To-do and event forms are local and free, validate before saving, and use the existing undoable store batch. Plan passes its selected date. All-day events clear times; overnight events retain their start date. |
| `CaptureSheet` | text field "Add anything…", mic, camera, library, file | idle, recording (waveform), processing (source thumb + shimmer) |
| `ReviewCard` | kind icon · title · date/time fields · course/employer | confident, needs-input (lavender-100 field + question chip), excluded (toggle off) |
| `DiffGroup` | header (New/Changed/Removed/Unchanged) + rows | changed rows show old time struck → new time |
| `SuggestionCard` | lavender-50 card, "Semli suggests" overline, text, 2 buttons | dismissible |
| `ComingUpRow` | title · relative date ("3 days away") | urgency ink when ≤ 1 day |
| `CourseCard` | course code overline · title · next deadline · meeting pattern | |
| `Toast` | dark pill bottom, action "Undo" | auto-dismiss 5 s |

### Planner screen polish

- Plan uses the reference's clock/week band and direct list. Today and School retain compact centered headers, lowered to respect the top safe area. Section headings outside the Plan list use `headline`; context uses `caption`.
- An empty day has an illustrated capture card with a clear action and a review-before-saving note. Empty School explains how a syllabus becomes a course. Neither screen inserts pretend tasks or courses.
- Course cards use a neutral surface, a narrow course-tint accent, instructor details when available, and a separate next-deadline row. Expanded coursework retains completion controls.
- The Plan footer summarizes the selected week from actual items; School counts deadlines in the next seven days. Import entry points lead to the existing capture flow.

## 8. Motion
- Default spring: response 0.35 s, damping 0.85. Respect Reduce Motion (crossfade only).
- **Complete task:** checked circle and struck title, then completed rows sort to the bottom. Completed text retains contrast.
- **Capture open:** scrim/menu fade in; close shows `×` immediately with no icon rotation. Reduce Motion removes the fade.
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
- Rows and manual form controls grow vertically with Dynamic Type. The clock caps at 72 pt; the seven-day strip remains visible. Validate unusually large text sizes on a device before release.
- Color regression tests in `packages/tokens/src/colors.test.ts` require 4.5:1 for text on core surfaces, event tints, buttons, and status fills, and 3:1 for empty completion controls.

## 11. Dark mode
Mirror tokens (§4.2–4.3). Header band gets slightly lighter than canvas; event fills drop to deep tints with light ink; the nav pill lightens slightly so it still separates from the canvas.
