# Semli design system

Decided October 19, 2026. The live, readable version is the design-system page: https://claude.ai/artifact/Y3JnVE1gxVuvGrxjq795Z2. The review canvas with every screen is https://claude.ai/artifact/QgE4ddmEytZ2PyHMCT3QoV. Keep this file and the page in step.

## Direction
Robinhood's 2024 identity is the reference: neutrals first, one accent used sparingly, a simplified mark next to a wordmark, one typeface, "less is more". Smoothness is discipline, not the language the app is written in.

- Ink on paper. About 72% of any screen is paper and surfaces, 18% ink, 7% grey rows, 3% accent.
- One big number per screen (Regular, 56px). Everything under it is one step smaller than iOS defaults. Contrast reads as premium, size does not.
- Color only when it means something: terracotta is behind or in conflict, green is ahead, amber is "Semli needs something from you".
- Pills act, rectangles hold. Every action is fully round; rows, cards, fields and composers keep corners.
- Planner screens use plain rows, with no decorative cards or icon tiles. Photography belongs on moment days, showcase pages and Today's sky (a time-of-day sky fading into the paper behind Today's header only; decided Oct 21, 2026, spec in `headers.md`); the Plus welcome and guide can use small accent icon badges.
- Marketing surfaces (the site, the paywall, the App Store screenshots, the header and search card, the emails) may be more playful than planner screens: a site photo under a scrim, soft lavender paper, one accent word per headline, always bold and large enough to read over the background. The in-app rules above still hold on Today, Plan, School and every row. Decided Oct 20, 2026.
- The website in light mode uses white paper (#FFFFFF) and neutral grey panels (#F4F4F5) instead of the app's cream, and its hero is solid brand purple (lavender 600) with white copy, so the purple reads rich rather than faded. Site only; the app keeps its paper. Decided Oct 21, 2026 (`apps/web/app/tokens.ts`).

## Brand
- Mark: two dots (big = today, small accent = next), ratio 240 : 102 on a fixed diagonal. `design/icon-b-dots.svg`.
- Wordmark: lowercase `semli.` in Onest SemiBold; the tittle of the i and the full stop are the two dots. Outlines are generated with `design/generate-wordmark.py`. Mark and wordmark use the app's ink and accent values, never their own.
- Where it appears: app icon, splash, onboarding welcome, account and sharing previews, settings footer, website, store. Never on Today, Plan or School. "You" is the fourth tab; account entry lives in its settings rows.
- Launch splash: white (#FFFFFF) with the ink Onest wordmark and its original purple dots in both light and dark mode, centered at 240 points wide. Render the transparent PNG at the wordmark's natural aspect ratio, with no square padding. Use contain scaling; no photo, tagline, or loading delay. Native splash changes require a new build and release-build verification.

## Color
Six roles (light / dark): paper #FAF9F6 / #151515 · row #F0EFEB / #292929 · surface #FFFFFF / #202020 · ink #222320 / #F5F4F0 · secondary #686963 / #B4B4AC · line #E5E4DE / #363632 · accent #7057BD / #C3AFF8. Status: terracotta #9F431F / #E8A274 (bg #F8EDE5 / #3A2A20), green #246C43 / #5CC08A (bg #DDF2E6 / #16301F), amber #80510A / #E2A84B (bg #FBEFD5 / #3A2D14). The former pink course tint is muted clay; its persisted `rose` key stays compatible with saved courses.

Light mode keeps the original paper-and-ink treatment: primary actions, send, selected tabs/dates, chips and segmented controls use ink. Booked graph marks use muted plum (`#76658F`) in light mode, with white text on filled hourly events. Purple stays in the original small accents such as links, Plus, today labels and brand dots. Dark mode extends lavender to those interactive controls, disclosure chevrons, and booked events across day, hourly, week and term graphs. Use `controlFill/controlInk`, `selectionFill/selectionInk`, `disclosureInk`, and `chartBooked/chartOnBooked` so both appearances stay consistent. Body text stays ink; green means done, terracotta means a conflict, and amber means input is needed. Course and category tints are a 6px dot beside text, never a fill, plus one exception decided Oct 21, 2026: a class's item rows carry its tint as a 3pt bar centred in the left gutter (`ItemRow`), so a week reads by course; done rows dim it.

Meaning: filled terracotta pill for due today / overdue; terracotta text on a grey pill for a colliding time; green pill for done and newly added, green check when complete; grey pills for times and neutral states; amber only when Semli needs input. Filled status colors use `onPrimary` for legible text and icons in either theme.

## Type
Geist carries product text: normal / Regular 400 for all large headings, the one big number, section titles and text; Medium 500 for pills and the primary label; and SemiBold 600 for emphasis. All display tokens share `largeHeadingWeight` in the tokens package; large headings use these tokens rather than local font-family or bold overrides. Onboarding follows this same normal-weight rule. The separate outlined wordmark uses Onest SemiBold. Tabular numerals wherever a number can change. Sentence case always.

EB Garamond Regular is the marketing voice: the serif was decided Oct 20, 2026 (Newsreader), and switched to EB Garamond Regular on Oct 21, 2026. It appears only through `displaySerif` (34 / 40) on lines that speak to the student: the paywall tagline, the Plus welcome, the auth welcome and the two dark onboarding showcases. On the site it is the `.serif` class on the hero, pricing and closing headlines. It was tried on the App Store captions on Oct 20, 2026 and rejected; store captions are Geist Bold, tracked 2.5% tight, with one lavender accent word (`design/render-screenshots.py`). It never carries a number, a row, a form heading, a question step or a section title; if every heading were serif, none would be special.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| displayXl | 56 / 60 | 400 | The one big number (countdown, price, moment) |
| display | 34 / 40 | 400 | Screen heading on covers |
| displaySerif | 34 / 40 | EB Garamond 400 | Paywall tagline, Plus welcome, auth welcome, onboarding showcases |
| displaySm | 30 / 36 | 400 | Onboarding questions and editable item titles |
| title | 24 / 30 | 400 | Section titles with a chevron |
| headline | 16 / 22 | 500 | Button labels |
| body | 16 / 22 | 400 | Rows and text |
| callout | 14 / 20 | 400 | Supporting lines, eyebrows |
| subhead | 13 / 18 | 500 | Text buttons, pills |
| caption | 12 / 16 | 400 | Secondary context; never smaller |
| overline | 13 / 18 | 500 | Sentence-case group labels |

Fonts load locally on iOS from the Geist release (OFL); the web uses the same files.

## Errors

Use a short, action-specific sentence and a useful next step: “We couldn’t send a test reminder. Please try again.” Technical details belong in diagnostics, not toasts, fields or alerts. Auth, purchases, imports, Canvas, reminders, alarms, export and backup use named error boundaries; known cancellations remain quiet. Unexpected screen failures have a plain retry screen, and old links offer Open Semli.

`reportError` records a specific operation, error name, code, status and sanitized message/stack once per exception. `errorDiagnostic` allowlists fields and redacts credentials, codes, URLs, email addresses and local usernames; request bodies, session objects, receipts, calendar feeds and uploaded files are never attached. Configured Sentry receives the sanitized exception. Import responses must use known shared product copy before the client displays them.

A failed local save keeps the current plan in memory and shows a persistent save warning with Retry. A failed read/decode shows recovery before the planner opens and blocks replacement writes. Recovery never clears a saved plan. Test-reminder success appears only after native scheduling succeeds; a failed confirmation resend still allows entering the latest emailed code and explains that a fresh code was not sent.

## Buttons
Five roles, all fully round, press shrinks 3% and dims to 88% on `spring.snappy`, one haptic per role.
1. Primary: ink in light mode, purple in dark, with `controlInk` text, 52 high, one per screen. Haptic tap.
2. Secondary: grey fill, same pill. Chips are the 40-high version; tiles (icon + label) the 64-high version. One component shared by capture and onboarding.
3. Text: accent, underlined (offset 5, 1.5px); muted variant in the same accent without underline. Haptic select.
4. Icon: 44 circle, grey or ink. The glass plus in the tab bar is the one 56 exception.
5. Destructive: a text button in terracotta, confirms inline. No filled capsule, no SwiftUI bordered button.

Rows are not buttons: they highlight on press and never shrink. Icons in ink, no tiles behind them. The onboarding choice card (two lines) is the one rectangular secondary at radius 16.

## Icons
One outline set in content (`apps/mobile/src/components/Icon.tsx`): 24-unit grid, 1.75 stroke, round caps and joins, no fills. Sizes: 24 in heroes and tiles, 20 in rows and buttons, 16 only for chevrons. Colors: ink for the subject, grey for navigation and metadata; accent only on sparkle when it marks an AI result. New glyphs: send, remove, appearance, list, globe, mail, star, lock. Where they go (Oct 21, 2026): every row on You, one 20 ink glyph per row and every row in a group or none; the item's own glyph on Today's Start today suggestions; one 24 grey glyph beside an empty state's line (Today's list, an empty day on Plan). Not on Today or Plan item rows: the title, course and pill already say it.

Native chrome uses the matching SF Symbol: Today `house`, Plan `calendar` (was checkmark.square), School `graduationcap`, You `person`, add `plus`. Everything else is drawn by us.

## Chrome and inputs
- Copy uses sentence case for headings, controls, status labels, and standalone date labels: "Next due", "Today", "In 3 days", "Active". Keep units and words within a sentence lowercase ("2 courses", "4:00 pm", "Due today"); preserve names and imported titles.
- Expandable rows use one chevron, pointing right when closed and down when expanded. Rotate it smoothly over the shared base duration; preserve the expanded accessibility state and honor Reduce Motion.
- Main tabs use `TabHeader` (decided Oct 21, 2026; `headers.md`): the same 24 horizontal margin and safe-area top + 20, at most one small line above the big value, and the meaning under it. Today, Plan's day and School show the date on that line; You and Add show none. Numbers and countdowns are `displayXl` 56/60 ("34m", "3 days", "Today"); word titles are `display` 34/40 ("October", "You", "Add", "School" before a course exists). The line under the value finishes it: "until Stats lecture ends · 10:15 am", "until Stats exam 2 · Fri 9 am" (`countdownLine` in `@dayli/core`). Details sit 12 below the value, with 4 between related lines. Today's sky (`SkyHeader`) sits behind Today's header; moment photos replace it.
- Plan's title is the selected month ("October", with the year only outside the current year), which opens a Monday-first month grid below it with month browsing and a Today shortcut. No date line and no week arrows: the chart swipes by week, VoiceOver has Next and Previous week actions on each day, and a round Today pill appears top right only when another week is showing. The week's totals sit under the chart with the chart key under them; "Swipe for next week" shows until the person first moves by week (`firsts.week`). A date selection updates the chart, agenda and saved Plan date together and closes the grid.
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
- Create, Review, Account preview and Share schedule preview slide up as full-screen covers with one glass X on the left. Add is a tab; `/capture` redirects there. No half sheets for primary flows.
- `navigationButtonOptions` in `components/NavButtons.tsx` owns header controls: one native glass item on iOS 26, one circular fallback elsewhere, automatic back hidden to prevent duplicate controls. Configure it in the navigator before mounting; `Sheet` only updates it for a custom close action. Back returns through the parent stack when needed, or goes home when opened without history.

Navigation audit:

| Screens | Exit control |
| --- | --- |
| New to-do / New event, import review, Account preview, Share schedule preview | Glass X; review retains its discard/cleanup action |
| Item detail, item unavailable | Glass back chevron |
| You via `/settings`, Name, Reminders, Appearance, Field of study, Semli Plus, Your data, Semli server | Glass back chevron, including direct entry from a tab |
| Onboarding after the first step | Glass back chevron to the previous step |
| Today, Plan, School, You, Add tabs; onboarding welcome | Root screens; tab navigation or forward action |

- Loading is a progress line, never a spinner or a bouncing-dots box; results fill in as rows.

## Motion
Tokens in `packages/tokens/src/motion.ts`, presets in `apps/mobile/src/lib/motion.ts`, rules in `docs/motion.md`. Two springs (snappy 22/380/0.9, gentle 26/190/1), three durations (120/220/360), one easing (0.2, 0, 0, 1), press 0.97/0.88, stagger 45ms. Lists animate layout; revealed content drops in; numbers roll; every wait has a skeleton; one haptic per meaning.

## Charts
One chart, the timeline, at three zooms. `DayBar` is the day as a horizontal bar (with `highlight` for the item screen). `HourView` is the same day opened by the hour, behind the top-right toggle on Today. `WeekChart` is seven vertical day bars, the Plan header and the schedule review. `TermLine` is a span with dots and rings, the four-week map on School and the syllabus review. Marks everywhere: plum booked in light mode and lavender in dark mode, green done or new, terracotta overlap or dropped, dashed outline where a shift was, dot due, ring quiz or test, ring with a centre (target) exam, hairline now, amber outline needs a time. Shape is the kind of thing, colour is its status, and a course's colour is only the 6px dot beside its name in rows; charts never colour by course or category.

Every line and dot on a chart is placed, not drawn by eye (decided Oct 21, 2026):
- One geometry. Sizes come from `chart` in `packages/tokens`: track 6, dot 8, ring 12 with a 2 stroke, now hairline 1.5 overhanging the track by 5, hour-view now dot 7. The site's mockups (`apps/web/components/mock.module.css`) use the same numbers. No mark picks its own size.
- Centred on the value. Dots, rings and the now line go through `Mark` and `NowLine` (`components/ChartMark.tsx`), which hang each mark from a zero-size anchor at its value and centre it by half its own size. Never position a mark with a hand-tuned `top` or `marginLeft`.
- Nothing hangs off the end. A line with marks insets its plot by half a ring, and its scale and labels share that inset, so a mark on the first or last day sits inside the rounded cap. Column marks clamp inside the column.
- One stacking order: track, blocks, overlap spans, now hairline, then dots and rings, with rings over dots and red over ink. Rings knock out the track under them (surface fill), so a ring never reads as a dot.
- Collisions resolve, never pile up. When two labels under a line would touch, the later one is dropped and its mark stays; labels keep at least `labelGap` (8) between them. Two marks on one date show the more important one on top, and every dot and ring carries a 1.5 canvas halo, so a mark on a block of its own colour or next to another mark still reads as its own.
- Text never sits on a mark or a line. Axis labels stand on their value (Noon centred on noon, the ends flush with the bar's ends), never spread by `space-between`. A month with too few days on the line to hold its name keeps its space and drops its name. In the hour view, the current time takes the gutter and the hour label it would cover steps aside; the now line runs under event blocks, never through their titles.
- One answer for "is this a test". `assessment(title)` in `packages/core` decides exam (midterm, final, exam), quiz (quiz, test) or neither, skipping look-alikes such as a final project, an exam review or a practice quiz. The import's `exam` icon, every chart's shape (`shapeFor`) and the term's end all use it. No screen keeps its own pattern.
- A mark answers "what is this?" in place. Where a line is interactive (School's four-week map), a tap anywhere on a course's line picks the nearest mark within 22 points, rings it in ink (`selected`, `focusGap` 2) and shows that item as a real `ItemRow` under the map; tapping it again clears it. The count beside the title ("4 due") is a text button that lists everything on the map, which is also the VoiceOver path. No tooltips or popovers over the chart.
- Every chart explains its marks. A chart with anything beyond plain bars has a `ChartKey` under it: each mark drawn at its real size beside one word ("Due", "Quiz", "Exam", "Due today", "Done", "Overlap", "Needs a time"), only for marks on screen now. The key stays; it is not a first-run hint. Plan, School, the course page and Review carry one.
- Straight, flat and quiet: no hand-drawn SVG paths, curves, glows, shadows, gradients or decorative gridlines. Hour rules are hairlines in `line`; axis labels are caption at 11 in the secondary ink, sentence case.

## Deleting and editing
One tap deletes, the toast carries Undo, and Your data keeps it undoable after. Rows swipe right to complete and left to delete (`SwipeRow`). A repeating item asks the scope inline under Delete: Just this one, This week, From now on. Review never blocks: untimed shifts go in with an amber "Add a time" pill, undated items are skipped by default ("Add 14 · skip 2"), a class with no end date asks "Until when?" with a 15-week default.

## Screens
- Today: no header, no cards. Countdown to the next commitment as the big number, the day as a timeline bar (green done, plum booked in light mode / lavender in dark mode, terracotta overlaps, hairline now), then "On your list" and "Coming up" at 24 Regular with chevrons, rows with status pills.
- Moments: on days that matter, a photo becomes the header fading into the paper and the big number becomes the moment. No promo carousel, no counter, no X. The moments: a break coming up, the first day of term (classes added days ahead, none met yet), a heavy week, the last deadline of the week done, and the first quiet day after two or more exams; each has its own photo. An action on a moment does the thing (spread the work), never only opens another tab. Text never sits on the photo: it has fully faded into the paper before the moment's first line (`solidAt` on `PhotoHeader`), so any photo works in light and dark mode. Only the glass view toggle sits on it.
- Add: composer, recent-screenshots strip, two "start with" rows. Reading: progress line and rows filling in with New pills.
- Item detail: pushed; light title, large time pair, plain rows, Notes and Same week, primary pill, destructive text button.
- Overlaps: agenda titles and status times use the conflict ink. The day bar marks the overlapping interval in red even in an item's highlighted view; hourly conflicts use plain terracotta blocks with contrasting text in separate columns, a 4px gap, and no outside stripe or border. Taller blocks put Overlaps below the time; compact blocks keep the title and time on one line. Below the detail graph, a named warning links to each conflicting event. Fixed events point toward the flexible plan to review. Plus offers an explicit move button with a calendar-free time and a 15-minute buffer; nothing moves automatically. Overlap warnings, the flexibility switch, and manual edits stay free.
- You: "You" as the main heading with "Profile and preferences" above it, then the plan/import pill. Name and field of study belong in the Profile rows. Hairline rows in groups, footer with mark, version, legal links.
- Auth starts with the original welcome design at `/auth`: wordmark, welcome copy, Google, email signup, login and optional guest continuation. Login, signup and forgot-password screens share labelled fields, password visibility and glass back chevrons. No preview badges or simulated successful authentication; unavailable identity actions explain the connection is not ready. Guest continues into seven onboarding steps; Watch it work, Heads-up and Plus use dark photo showcases.
- Plus: onboarding, settings and feature gates share the fireworks photo fading into a dark canvas, readable price-first rows, a green student switch and one primary action. Feature gates open a full-screen cover with a glass X; settings keeps its back chevron. A confirmed new purchase celebrates with one brief confetti burst, then offers a skippable feature guide. Restore and ordinary launches do not celebrate again. Guide copy covers only the three implemented Plus features; account and live sharing previews are not paid benefits. Reduce Motion suppresses the burst, and the guide stays available in You → Semli Plus.

## Applied in code (Oct 19, 2026, second pass)
Display and title tokens at Regular; the Today list/graph toggle and `HourView`; Plan with `WeekChart` as the header; School with the four-week `TermLine` map and flat course rows; Review rewritten around the week chart and the term line, no toggles, never blocking; Create with the pill field, hairline rows, `Segmented` and course chips; the item screen with tappable time and date, plain rows, the series row, the day-around-it bar and the delete scope chooser; swipe actions on every `ItemRow`; Add as the fifth tab; glass chrome buttons; Appearance without card style; the add menu, starter cards, clock header, week strip and card surface removed. `seriesId` on items ties the occurrences of a repeating class together.

## Applied in code (Oct 19, 2026, first pass)
Geist fonts and tokens; the new type scale; pill buttons and the five roles (`components/Controls.tsx`); hairline rows with status pills (`ItemRow`); the Today countdown, day timeline (`DayBar`) and sections; the composer Add screen; the item detail; the You tab and settings home without tiles; the ink toggle; the progress-line loading state; the wordmark regenerated from Onest SemiBold (`packages/tokens/src/wordmark.ts`, `design/wordmark-*.svg`); the four new glyphs; the Plan tab symbol; the paywall as price-first rows with the trial timeline; the recent-screenshots strip on Add (`expo-media-library`, asks only on tap); Watch it work and Heads-up as dark showcase pages.

## Open items
- Moments: the photo header on special days needs a calendar of breaks and finals, and licensed photos (Unsplash with attribution, or a commissioned set).
- Showcase onboarding and all Plus paywalls use the bundled photos. Confirm image rights/attribution and check contrast on device before release.
- App icon, splash and store assets regenerated from the new wordmark with the app's ink and accent.
- Verify 12px captions on a real phone in bright light; 13 is the fallback.
