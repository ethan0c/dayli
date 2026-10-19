# Semli design system

Decided October 19, 2026. The live, readable version is the design-system page: https://claude.ai/artifact/Y3JnVE1gxVuvGrxjq795Z2. The review canvas with every screen is https://claude.ai/artifact/QgE4ddmEytZ2PyHMCT3QoV. Keep this file and the page in step.

## Direction
Robinhood's 2024 identity is the reference: neutrals first, one accent used sparingly, a simplified mark next to a wordmark, one typeface, "less is more". Smoothness is discipline, not the language the app is written in.

- Ink on paper. About 72% of any screen is paper and surfaces, 18% ink, 7% grey rows, 3% accent.
- One big number per screen (Light, 56px). Everything under it is one step smaller than iOS defaults. Contrast reads as premium, size does not.
- Color only when it means something: terracotta is behind or in conflict, green is ahead, amber is "Semli needs something from you".
- Pills act, rectangles hold. Every action is fully round; rows, cards, fields and composers keep corners.
- No decoration: no tinted cards, no icon tiles, no illustrations, no logo on in-app screens. Photography only on moment days and showcase pages.

## Brand
- Mark: two dots (big = today, small accent = next), ratio 240 : 102 on a fixed diagonal. `design/icon-b-dots.svg`.
- Wordmark: lowercase `semli.` in Onest SemiBold; the tittle of the i and the full stop are the two dots. Outlines are generated with `design/generate-wordmark.py`. Mark and wordmark use the app's ink and accent values, never their own.
- Where it appears: app icon, splash, onboarding welcome, settings footer, website, store. Never on Today, Plan, School or other in-app screens. "You" is the fourth tab; there is no account button in a header.

## Color
Six roles (light / dark): paper #FAF9F6 / #151515 · row #F0EFEB / #292929 · surface #FFFFFF / #202020 · ink #222320 / #F5F4F0 · secondary #686963 / #B4B4AC · line #E5E4DE / #363632 · accent #7057BD / #C3AFF8. Status: terracotta #9F431F / #E8A274 (bg #F8EDE5 / #3A2A20), green #246C43 / #5CC08A (bg #DDF2E6 / #16301F), amber #80510A / #E2A84B (bg #FBEFD5 / #3A2D14). The former pink course tint is muted clay; its persisted `rose` key stays compatible with saved courses.

The accent (lavender, kept) is allowed in exactly five places in the app: the small dot in the mark, text buttons, the now-marker on the timeline, the word Plus, the selected week day. Course and category tints are a 6px dot beside text, never a fill.

Meaning: filled terracotta pill for due today / overdue; terracotta text on a grey pill for a colliding time; green pill for done and newly added, green check when complete; grey pills for times and neutral states; amber only when Semli needs input. Filled status colors use `onPrimary` for legible text and icons in either theme.

## Type
Geist carries product text: Light 300 for the one big number, Regular 400 for section titles and text, Medium 500 for pills and the primary label, and SemiBold 600 for emphasis. The separate outlined wordmark uses Onest SemiBold. Tabular numerals wherever a number can change. Sentence case always.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| displayXl | 56 / 60 | 300 | The one big number (countdown, price, moment) |
| display | 34 / 40 | 300 | Screen heading on covers, the item title |
| title | 24 / 30 | 400 | Section titles with a chevron |
| headline | 16 / 22 | 500 | Button labels |
| body | 16 / 22 | 400 | Rows and text |
| callout | 14 / 20 | 400 | Supporting lines, eyebrows |
| subhead | 13 / 18 | 500 | Text buttons, pills |
| caption | 12 / 16 | 400 | Secondary context; never smaller |
| overline | 13 / 18 | 500 | Sentence-case group labels |

Fonts load locally on iOS from the Geist release (OFL); the web uses the same files.

## Buttons
Five roles, all fully round, press shrinks 3% and dims to 88% on `spring.snappy`, one haptic per role.
1. Primary: ink fill, 52 high, one per screen. Haptic tap.
2. Secondary: grey fill, same pill. Chips are the 40-high version; tiles (icon + label) the 64-high version. One component shared by capture and onboarding.
3. Text: accent, underlined (offset 5, 1.5px); muted variant in the same accent without underline. Haptic select.
4. Icon: 44 circle, grey or ink. The glass plus in the tab bar is the one 56 exception.
5. Destructive: a text button in terracotta, confirms inline. No filled capsule, no SwiftUI bordered button.

Rows are not buttons: they highlight on press and never shrink. Icons in ink, no tiles behind them. The onboarding choice card (two lines) is the one rectangular secondary at radius 16.

## Icons
One outline set in content (`apps/mobile/src/components/Icon.tsx`): 24-unit grid, 1.75 stroke, round caps and joins, no fills. Sizes: 24 in heroes and tiles, 20 in rows and buttons, 16 only for chevrons. Colors: ink for the subject, grey for navigation and metadata; accent only on sparkle when it marks an AI result. New glyphs: send, remove, appearance, list.

Native chrome uses the matching SF Symbol: Today `house`, Plan `calendar` (was checkmark.square), School `graduationcap`, You `person`, add `plus`. Everything else is drawn by us.

## Chrome and inputs
- Copy uses sentence case for headings, controls, status labels, and standalone date labels: "Next due", "Today", "In 3 days", "Active". Keep units and words within a sentence lowercase ("2 courses", "4:00 pm", "Due today"); preserve names and imported titles.
- Main tabs use `TabHeader`: the same 24 horizontal margin and safe-area top + 20, current date first, a short context label 2 below it, then the large value 6 below the label. Today’s countdown and School’s "Today" occupy the same position and use the same 56/60 type. Plan, You, and Add use the same structure. Details sit 12 below the large value, with 4 between related lines. School omits the term and course count; use "Next assignment due" before Today or Tomorrow, and "Next assignment due in" before a duration. Empty and loading states preserve the header position, and moment photos appear below it. Section titles have 12 below them.
- Plan replaces the date/context lines with a 44-high calendar control: selected month/year and date, plus glass previous/next week buttons. Tapping the month expands a Monday-first month grid below the large heading, with month browsing and a Today shortcut. A date selection updates the header, week chart, agenda, and saved Plan date together; it also closes the grid. Calendar controls remain available before the first import.
- Headers: system bar, native SF Symbol chevron and X in glass on iOS 26 (our 1.75-stroke icons in grey circles elsewhere), Geist 16 Medium title, paper background, no shadow, hairline only when content scrolls under.
- Fields: one line is a pill (52 high); rest grey with no border, focus white with a 1.5px ink ring. Never a blue ring.
- Composer: white rectangle, radius 20, attachment icons inside, send as an ink circle. Replaces textarea plus tiles.
- Date and time fields: grey pills (36 high) that open the native picker.
- Toggle: green when on in both themes, grey when off, white thumb. All switches share this default, including settings, create, and the paywall. Segmented control: sliding pill with a selection tick. Check: grey ring, green when done. Radio: ink dot.
- Progress: eight-segment ink bar in onboarding; a 2px line under the header while loading. Toast: ink, rises on `spring.gentle`.
- Controls use Semli's palette: no default blue tint; toggle green comes from `added`.

## Navigation
- Liquid Glass tab bar with five tabs: Today, Plan, School, You, and Add. Add carries the `search` role, so iOS 26 draws it as the detached circle beside the main pill (the pattern helthy uses for its fifth tab); older iOS shows it as a trailing tab. Every "add" entry point navigates to the Add tab, with `?source=image|file` to open a picker on arrival. There is no add menu.
- Chrome buttons at the top of a screen (the Today list/graph toggle, close, back, the onboarding chevron) sit in a Liquid Glass circle on iOS 26 (`components/Glass.tsx`: `GlassCircle`, `GlassGroup` for several together), and in the grey circle elsewhere.
- Detail screens push with one glass back chevron on the left (item detail, every settings page). Set this explicitly even for the first route in a nested stack: opening Appearance from the You tab does not give it a native back button automatically.
- Create and Review slide up as full-screen covers with one glass X on the left. Add is a tab; `/capture` redirects there. No half sheets for primary flows.
- `navigationButtonOptions` in `components/NavButtons.tsx` owns header controls: one native glass item on iOS 26, one circular fallback elsewhere, automatic back hidden to prevent duplicate controls. Configure it in the navigator before mounting; `Sheet` only updates it for a custom close action. Back returns through the parent stack when needed, or goes home when opened without history.

Navigation audit:

| Screens | Exit control |
| --- | --- |
| New to-do / New event, import review | Glass X; review retains its discard/cleanup action |
| Item detail, item unavailable | Glass back chevron |
| You via `/settings`, Name, Reminders, Appearance, Field of study, Semli Plus, Your data, Semli server | Glass back chevron, including direct entry from a tab |
| Onboarding after the first step | Glass back chevron to the previous step |
| Today, Plan, School, You, Add tabs; onboarding welcome | Root screens; tab navigation or forward action |

- Loading is a progress line, never a spinner or a bouncing-dots box; results fill in as rows.

## Motion
Tokens in `packages/tokens/src/motion.ts`, presets in `apps/mobile/src/lib/motion.ts`, rules in `docs/motion.md`. Two springs (snappy 22/380/0.9, gentle 26/190/1), three durations (120/220/360), one easing (0.2, 0, 0, 1), press 0.97/0.88, stagger 45ms. Lists animate layout; revealed content drops in; numbers roll; every wait has a skeleton; one haptic per meaning.

## Charts
One chart, the timeline, at three zooms. `DayBar` is the day as a horizontal bar (with `highlight` for the item screen). `HourView` is the same day opened by the hour, behind the top-right toggle on Today. `WeekChart` is seven vertical day bars, the Plan header and the schedule review. `TermLine` is a span with dots and rings, the four-week map on School and the syllabus review. Marks everywhere: ink booked, green done or new, terracotta overlap or dropped, dashed outline where a shift was, ring exam, dot due date, hairline now, amber outline needs a time.

## Deleting and editing
One tap deletes, the toast carries Undo, and Your data keeps it undoable after. Rows swipe right to complete and left to delete (`SwipeRow`). A repeating item asks the scope inline under Delete: Just this one, This week, From now on. Review never blocks: untimed shifts go in with an amber "Add a time" pill, undated items are skipped by default ("Add 14 · skip 2"), a class with no end date asks "Until when?" with a 15-week default.

## Screens
- Today: no header, no cards. Countdown to the next commitment as the big number, the day as a timeline bar (green done, ink booked, terracotta overlaps, hairline now), then "On your list" and "Coming up" at 24 Regular with chevrons, rows with status pills.
- Moments: on days that matter, a photo becomes the header fading into the paper and the big number becomes the moment. No promo carousel, no counter, no X.
- Add: composer, recent-screenshots strip, two "start with" rows. Reading: progress line and rows filling in with New pills.
- Item detail: pushed; light title, large time pair, plain rows, Notes and Same week, primary pill, destructive text button.
- Overlaps: agenda titles and status times use the conflict ink. The day bar marks the overlapping interval in red even in an item's highlighted view; hourly events use separate columns. Below the detail graph, a named warning links to each conflicting event. Fixed events point toward the flexible plan to review. Plus offers an explicit move button with a calendar-free time and a 15-minute buffer; nothing moves automatically. Overlap warnings, the flexibility switch, and manual edits stay free.
- You: "You" as the main heading with "Profile and preferences" above it, then the plan/import pill. Name and field of study belong in the Profile rows. Hairline rows in groups, footer with mark, version, legal links.
- Onboarding: eight steps; one-tap rows, pill chips, a composer for the own import; Watch it work, Heads-up and Plus are full-bleed photo pages in dark.

## Applied in code (Oct 19, 2026, second pass)
Display and title tokens at Light and Regular; the Today list/graph toggle and `HourView`; Plan with `WeekChart` as the header; School with the four-week `TermLine` map and flat course rows; Review rewritten around the week chart and the term line, no toggles, never blocking; Create with the pill field, hairline rows, `Segmented` and course chips; the item screen with tappable time and date, plain rows, the series row, the day-around-it bar and the delete scope chooser; swipe actions on every `ItemRow`; Add as the fifth tab; glass chrome buttons; Appearance without card style; the add menu, starter cards, clock header, week strip and card surface removed. `seriesId` on items ties the occurrences of a repeating class together.

## Applied in code (Oct 19, 2026, first pass)
Geist fonts and tokens; the new type scale; pill buttons and the five roles (`components/Controls.tsx`); hairline rows with status pills (`ItemRow`); the Today countdown, day timeline (`DayBar`) and sections; the composer Add screen; the item detail; the You tab and settings home without tiles; the ink toggle; the progress-line loading state; the wordmark regenerated from Onest SemiBold (`packages/tokens/src/wordmark.ts`, `design/wordmark-*.svg`); the four new glyphs; the Plan tab symbol; the paywall as price-first rows with the trial timeline; the recent-screenshots strip on Add (`expo-media-library`, asks only on tap); Watch it work and Heads-up as dark showcase pages.

## Open items
- Moments: the photo header on special days needs a calendar of breaks and finals, and licensed photos (Unsplash with attribution, or a commissioned set).
- Showcase onboarding steps (Watch it work, Heads-up) ship dark without a photo until photos are sourced; Plus stays on paper. The layout is ready for a full-bleed image.
- App icon, splash and store assets regenerated from the new wordmark with the app's ink and accent.
- Verify 12px captions on a real phone in bright light; 13 is the fallback.
