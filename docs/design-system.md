# Semli design system

Quiet direction · October 19, 2026 · Implemented in shared tokens, mobile screens, and the website. The original exploration is preserved in [redesign-direction.md](redesign-direction.md).

## Principles

1. **Make the next commitment clear.** Today features a current or upcoming event, then an open agenda. Suggestions, overdue work, and completed tasks remain discoverable through disclosures.
2. **Use color with intent.** Warm neutral surfaces carry the layout. Lavender emphasizes a featured item or selection. Course colors appear in small markers and labels. Conflicts retain explicit text and an alert icon.
3. **Keep navigation stable.** A custom three-destination pill sits beside a detached Add circle on iOS and web. Destinations retain their labels at standard text sizes. At very large text sizes, accessible labeled icons preserve room for the controls.
4. **Preserve trust.** The redesign retains review before saving, source context, schedule diffs, and undo. Original due dates remain distinct from dates chosen to work on a task.

## Typography

Inter 4 carries everything, at three optical sizes from the official release: the 18pt cut for text, the 24pt cut for titles, and the 28pt Display cut for headings and the clock. The wordmark is a drawn logo (outlines from Urbanist SemiBold) and is not affected by the text font. Fonts load before the app leaves its splash screen.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `displayXl` | 56 / 56 | Inter Display Regular | Display numerals; Plan clock overrides size to 48 / 56 |
| `display` | 34 / 40 | Inter Display Medium | Main screen heading |
| `title` | 24 / 30 | Inter 24pt Medium | Featured title and sheet title |
| `headline` | 17 / 24 | Inter Medium | Section heading |
| `body` | 17 / 24 | Inter Regular | Item titles and body text |
| `callout` | 15 / 22 | Inter Regular | Supporting explanation |
| `subhead` | 14 / 20 | Inter Medium | Actions and short labels |
| `caption` | 13 / 18 | Inter Regular | Time, source, and secondary context |
| `overline` | 14 / 20 | Inter Medium | Sentence-case context labels |

Body text and labels have normal letter spacing. Only large headings and display numerals tighten tracking. Dynamic Type expands row and sheet content. The Plan clock retains a size cap; date-selection labels scale within the seven-column strip.

## Palette

The source of truth is `packages/tokens/src/index.ts`; web CSS mirrors the core surface tokens.

| Role | Light | Dark |
|---|---|---|
| Canvas and header | `#FAF9F6` | `#151515` |
| Surface | `#FFFFFF` | `#202020` |
| Quiet fill | `#F0EFEB` | `#292929` |
| Primary ink | `#222320` | `#F5F4F0` |
| Secondary ink | `#686963` | `#B4B4AC` |
| Divider | `#E5E4DE` | `#363632` |
| Completion outline | `#82837B` | `#92938A` |
| Accent ink | `#7057BD` | `#C3AFF8` |
| Accent wash | `#F0ECF8` | `#2B253A` |
| Accent border | `#DCD4EF` | `#453B5A` |
| Conflict ink | `#A2342F` | `#FFACA4` |
| Conflict wash | `#FBEDEB` | `#3B2524` |

The six existing course tints retain their identity and text contrast. They are available for small course markers, onboarding choices, and contextual controls; ordinary agenda events have neutral backgrounds. Semantic New / Changed / Removed treatments stay visible in schedule review.

## Personalized previews

Before a person adds their own content, Today and Plan show personalized upload cards instead of empty agendas or seeded calendar records. The prompts use the saved name, student/work choices, and field of study. School shows a syllabus preview until a real course is added. Each example is visibly labeled and cannot be completed or mistaken for a saved task.

Previews are presentation content. They never enter live counts, conflict detection, course matching, employer context, or reminders. The real agenda appears after confirmed imports or manual entries. Legacy records marked `sourceId: sample` stay stored but are excluded from live selectors and reminder planning.

## Flat and raised cards

**Appearance → Card style** is a persisted local preference. Raised is the initial default; existing installations receive that default when their saved settings merge with the new settings.

- **Flat:** opaque surface, rounded corners, no border or shadow.
- **Raised:** the same content and geometry, a fine border, and a restrained shadow. Dark appearance uses a darker shadow.
- **Open rows:** ordinary agenda items use neither treatment. Their alignment, time column, and subtle dividers carry the structure.

`useCardSurface()` applies the shared preference to the featured commitment, course cards, empty-state capture cards, review cards, and the live Appearance preview. `useCardSurface('accent')` uses the lavender wash. Conflicts and menus keep their specific semantic or floating treatments.

Card style changes visual depth only. It does not change the order, content, dates, navigation, or capture behavior.

## Geometry

- Grid: 4 pt; spacing: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen gutter: 24 pt through `SCREEN_GUTTER`.
- Section separation: 28 pt on Today.
- Agenda row: at least 72 pt, growing for wrapped titles and larger text.
- Completion target: 44 × 48 pt around a 22 pt visible circle.
- Control radius: 14 pt; featured/course/review card: 16 pt; sheet: 28 pt; navigation: pill.
- Scroll content reserves 140 pt below the last row for safe areas and floating controls.
- Icons: shared outline set on a 24-unit grid, rounded caps, generally 1.75 pt strokes.

## Screens and components

| Component or screen | Behavior |
|---|---|
| `BrandHeader` | Existing outlined wordmark on the left; two-dot account control on the right. The account control opens settings. |
| `ScreenHeader` | Shared brand row, optional date/context, a large title, and a short subtitle. |
| Today | Actual event/task counts; warnings before the featured event; one current or upcoming commitment; remaining items in open rows; disclosures for completed, overdue, and suggested work. |
| `ItemRow` | Event start time or “All day” on the left; title and context in the center. Tasks say “To do” and have an independent trailing completion target. A deadline's due time stays explicit. |
| Plan | Urbanist clock and selected date, seven-day selector, visible previous/next week controls, selected-day heading, neutral agenda, and explicit missing work schedules. The date control returns to today. |
| `WeekStrip` | Day names above numbers; selected date is ink with reversed text. Today retains a text-accessible identity. Swipe and accessibility increment/decrement change week. |
| School | Course count and near-term deadlines, small stable course markers, course summaries and next deadlines. Expanding a course preserves its instructor and upcoming items. |
| `PlannerTabs` | Shared headless Expo Router tabs, an equal-width custom pill, and a detached Add circle. Add preserves the selected tab. |
| Add menu | Tell Semli, To-do, Event. Outside tap, close, Escape/Back, or accessibility escape dismisses. Manual creation from Plan receives its selected date. |
| Capture | A single input and existing screenshot, camera, and PDF acquisition. The content scrolls above the fixed action and supports the keyboard. |
| Review | Neutral review cards with editable titles, dates/times, inclusion toggles, evidence, uncertainty prompts, schedule diffs, and one commit action. |
| Sheet | Left-aligned title, close target, supporting copy, and a consistent 14 pt primary button. |
| Settings | Native-style groups with the same type and palette; Appearance offers light/dark/system and Flat/Raised with a live preview. |
| Toast | Undoable batch feedback remains above the floating navigation. |

## Motion and accessibility

The full motion system, including the Robinhood teardown, the tokens, and the rules, is in [motion.md](motion.md). The short version: two springs, three durations, one easing, `Press` for every button, layout animation on every list, skeletons for every wait, tickers for every changing number.

Respect Reduce Motion in the Add menu. Keep completion feedback direct and retain haptics for selection, completion, review readiness, confirmation, and undo. Avoid ornamental looping motion.

Text contrast is at least 4.5:1 on core surfaces, event tints, buttons, and semantic fills. Empty completion outlines meet 3:1. `packages/tokens/src/colors.test.ts` checks those combinations in both appearances. The custom navigation uses independent press targets; agenda completion no longer nests inside the item-detail button.

Color never carries an item's kind or a conflict alone. VoiceOver announces item kind, time, completion, selection, and conflicts. Rows wrap instead of truncating important text. Validate the final native layout at large accessibility sizes and on smaller iPhones before release.

## Website and marketing

The website uses Inter text, Urbanist clock numerals, warm neutral surfaces, and open agenda rows in the app preview. The primary headline is “Your week, already organized.” Preserve the existing wordmark and two-dot icon assets.

App Store frames should show one benefit and one readable product screen. Capture stories should show the review step. Screenshot export and publishing are separate release tasks; the exploration contains fictional sample content rather than release screenshots.
