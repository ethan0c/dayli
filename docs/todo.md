# Done and outstanding

October 19, 2026. The mobile UI pass against the design canvas (https://claude.ai/artifact/QgE4ddmEytZ2PyHMCT3QoV), what shipped and what is still open. Backend work is parked on purpose.

## Done

**System**
- Geist at the right weights: display Light, title Regular, pills Medium. Onboarding headings Light.
- One accent in five places; category tints only as 6px dots; no tinted cards, no icon tiles, no illustrations.
- Five button roles, pills act and rectangles hold; the sliding segmented control; ink toggles.
- Glass chrome: the Today toggle, close and back, the onboarding chevron sit in Liquid Glass circles on iOS 26 (`components/Glass.tsx`).
- Add is the fifth tab with the iOS 26 `search` role (the detached circle). No add menu. Every entry point lands on the Add tab, with a source to open a picker.

**Charts, one timeline at three zooms**
- `DayBar` on Today, Moment, and the item screen ("around it").
- `HourView` behind the Today list/graph toggle.
- `WeekChart` as the Plan header, the employer screen, and both schedule reviews. The selected day pops on a spring.
- `TermLine` on School (four-week map), the course screen, and the syllabus review.

**Screens**
- Today: toggle, hour view, swipe actions, empty state as rows, "Mark all done", Moment header.
- Plan: week chart header, empty day, rest of the week, amber "Add a time" with Start and End pills.
- School: big number, deadline map, flat course rows, keep-it-up-to-date rows.
- Course detail: the term so far, meeting pattern with Change, coming up, "Remove STAT 200 · 31 things".
- Employer: next shift, this week's shifts, next week status, imports, remove in two scopes.
- Item: tappable time and date, plain rows, series row, the day around it, delete scope chooser (just this one, this week, from now on), notes.
- Import: what it added, undo this import.
- Add: composer, recent screenshots with skeletons, three start rows.
- Review: work schedule first import and update, syllabus, general; never blocks; "Until when?"; "Add 14 · skip 2".
- Create: pill field, hairline rows, segmented category, course chips with dots.
- You: no card style, Plus in accent, inline Clear confirm. Your data: export, Add to Calendar (.ics), recent changes with Undo, clear with "Export first".
- Onboarding: all eight steps as boarded.

**Behavior**
- One tap deletes, Undo toast, undoable later from Your data. Swipe right completes, left deletes.
- Repeating classes share a `seriesId`; a class with no end date gets 15 weeks and asks.
- Course and employer removal restore fully on Undo (courses and schedules come back).
- Preview data is the board's week and shows in every list under the dev commands.

**Loading**
- Skeletons for the day bar, week chart, term line, hour view, the review shape, and the screenshot strip (`components/Skeleton.tsx`).
- Reading state is the review drawn as skeletons under the progress line.
- Plan pill on You and price rows on Plus are skeletons while the store answers. The Moment photo fades in on load.

**Site**
- Review and layout in `docs/website.md`; the desktop board is row 13 on the canvas. Rebuild in progress: DM Sans, real iPhone frames, the try-it box second, the review look for results, survey proof, prices in the open.

## Outstanding

**Needs the backend**
- Streaming "Found so far" while reading (Capture board).
- Keeping the real screenshot for the import screen (it shows the sample image).
- Canvas sync, iCloud backup, the share extension.

**UI still to do**
- Mic on the composer (speech).
- Scrubbing the day bar to change the countdown.
- "Block time to study" on an empty Plan day (needs its own board).
- Course row tint dot in the native header (Sheet takes a string title).
- A compact 18/26 type token; the hero line is a body override in Review and the new screens.
- Shared format helpers: `longMonthDay`, `clock`, `period`, the source-name helper are duplicated across item, review, course, employer, import and data. Move to `lib/format.ts`.
- `FieldPill` is duplicated as `ReviewPill` and in Create; one component in Controls.
- The pill-to-native-picker swap needs a second tap on iOS (the compact SwiftUI picker can't open programmatically).
- Series end picker cannot be clamped (DateField has no min or max).
- Large text and VoiceOver pass over the new screens; swipe actions as accessibility actions.
- Sample week removal on the first real import, with a toast.
- "Still open" overdue pile: "Mark all done" is in; auto-collapse after 14 days is not.
- Semester-over prompt on School ("Fall 2026 is over · Remove 4 courses?").
- Resume a closed review ("Finish reviewing Campus Café · 7 shifts" on Add).
- "Already in your plan" close-only review is built; the duplicate-screenshot detection depends on matching quality.

**Motion review (this pass)**
- Removed: raw durations in onboarding (now tokens).
- Added: toggle glyph crossfade, week chart selection pop, photo fade-in.
- Kept and worth watching on device: layout animations on long lists (Today with 10+ rows), the Ticker on every minute, the Plan week swap (remounts the chart with a slide), the onboarding typing demo at 28ms per step.
- Still missing: a pull-to-refresh is not needed (local data); a haptic on the week chart day tap; the hour view blocks could fade in on first open.

**Verify on a device**
- The `search` role tab, swipe actions under the gesture root view, the glass circles, the share sheet for export and .ics, the 15-week series default in a real syllabus.
