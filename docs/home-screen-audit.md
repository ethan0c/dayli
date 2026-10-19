# Home screen audit: competitors, and how Semli stands out

Status: Oct 19, 2026. Companion to [strategy.md](strategy.md) §3 (review mining) and [design-system.md](design-system.md). Sources are help centers, App Store listings, vendor blogs and feedback boards, plus reviews; Reddit was not reachable. Claims marked *unverified* could not be confirmed from a primary source.

## 1. What each competitor's home screen is

| App | Home screen, top to bottom | Add / nav | Visual language | Known pain on the home screen |
|---|---|---|---|---|
| **Structured** (4.08 recent) | Month label → week strip → one vertical hour-axis timeline (not to scale, "to scale" rejected on their roadmap) with tasks and imported events in the same column; free gaps render as slots with a + and motivational lines | + bottom-right; tabs Inbox · Timeline · AI (Pro) · Settings | One accent, per-task colour + icon, glyphs, no emoji; seeded "Wake up!" / "Sleep well!" tasks frame the day | "Too many taps" to create; busy days compress into "an unreadable ribbon of colour"; no auto-scroll to now; energy monitor and cycle tracker "add clutter to a screen whose strength is restraint"; recurring tasks paywalled |
| **Tiimo** (3.56, iPhone App of the Year 2025) | Morning / day / evening buckets, pinch to switch to an hour timeline; "Planned" and a fixed "Anytime" bucket; focus timer auto-starts at task time | + top-right; AI mascot bottom-right; tabs Today · To-do · Focus · Me | 3,000 colours, emoji per task, confetti, mascot, mood faces, progress rings | Setup is "time-intensive"; busy days mean scrolling (users ask for a compact list); all-day events clutter and can't be hidden; unfinished tasks don't roll over |
| **MyStudyLife** (1.62, 92% of recent reviews ≤3★) | Dashboard of cards: next class and its location, tasks due, exams; separate Calendar tab (day / week / month) | + at bottom | Per-subject colour (custom colours paid); dark mode paid; ads on free | Redesign backlash: calendar "shows about 2 hours of the day, and the time and date take up half the screen"; dashboard customisation paywalled; bugs, data loss; home is empty until classes and rotation are configured |
| **Shovel** (4.3, no free tier) | Web first. Week time grid + task side panel; mobile is a daily timeline with a tasks bar and streaks. Free time auto-fills as "Study time" | Sidebar on web | Grey sleep / white awake blocks; photos of students in marketing | Setup is desktop-only and heavy (courses, sleep, commute, estimates per task); phone app "slow and limited"; the Cushion (time math) is the one idea everyone praises |
| **Saturn** (high school, acquired by Snap) | Now + Next with a second-by-second countdown and percent of day done; friends carousel; tasks and bulletin widgets | Tabs incl. groups, DMs, bulletin | Purple-blue-magenta gradient, confetti, Bitmoji, green active dots | Social-layer complaints (notifications, public schedules); the countdown is the loved part ("especially if you're going off campus for lunch") |

General planners students also use, in one line each: Things 3 puts calendar events at the top of Today and a quiet "This Evening" bucket at the bottom; Apple Reminders splits Today into Overdue / All-day / Timed (Morning / Afternoon / Evening) and lets you reorder sections; Todoist is a flat list with a collapsible Overdue and bulk reschedule; Motion added a plain Agenda list because its auto-filled hour grid "got cluttered"; Sunsama's retention comes from a guided daily planning ritual; Routine shows the current event's note on the agenda.

## 2. Patterns that are now table stakes

1. Events and tasks on one Today surface (Things, Sunsama, Routine, Google; Todoist and Reminders get complaints for separating them). Semli has this.
2. A visible "now" anchor: what's on now, what's next, how long until it. Saturn's countdown is its most-praised feature; Structured users ask for auto-scroll to now. **Semli's Today has no now anchor** (the clock lives on Plan).
3. An Overdue bucket you can collapse, with a one-tap "move to today". **Semli has none**: an undone task dated yesterday disappears from Today because the list filters on `date === today` ([index.tsx:26](../apps/mobile/src/app/(tabs)/index.tsx#L26)). Tiimo is punished for exactly this ("unfinished tasks don't roll over").
4. One-thumb add with natural-language parsing. Semli has the glass + and the capture sheet.
5. Some time-of-day structure (Reminders' Morning / Afternoon / Evening, Things' This Evening). Semli sorts by time but has no buckets.
6. Completed items sink or hide. Semli fades and sinks them; both Structured and Tiimo have open requests for "hide completed".

## 3. Patterns that read as template, and that Semli should keep avoiding

- A full hour grid as the phone home with a thin red now-line and colour blocks. Structured's "ribbon of colour", MyStudyLife's shrunken calendar and Motion's retreat to a list are three independent signals that this fails on a phone. Semli's list-not-grid rule (design system §1.2) is right; keep it.
- Greeting + date + "3 of 7 done" progress tiles. Common in concept shots, absent from every shipped app above. Semli's header is a greeting plus a count line, which is close to this; the fix is to replace the count with the now anchor, not add a ring.
- Many colours, emoji, confetti, mascots, mood and energy trackers. Tiimo's whole identity; Structured's reviewers call the trackers clutter. Semli's one accent, neutral tasks and tinted events are the contrast. Do not add streaks, mood or a mascot.
- Paywalled basics and paywalled personalisation (recurring tasks in Structured, dashboard and dark mode in MyStudyLife). Already decided: basics free.

## 4. The opening nobody occupies

Every app above asks the user to decide what matters. Todoist, Things, Routine and Sunsama all say "pick 1 to 3 priorities each morning" by hand; Shovel computes time math but only after an hour of desktop setup; MyStudyLife's dashboard lists what is due, not what to start. **None of them derives importance from the sources the student already has** (syllabus, work schedule, free hours). Semli already stores the source, the evidence line, deadlines, shifts and free hours before a deadline (`findOverloads`). The product promise in [pricing-and-positioning.md](pricing-and-positioning.md) is "tells you what matters today", and the survey's top pain (68%) is not knowing what matters. The home screen should make that computation visible.

## 5. Recommended Today screen

Order, top to bottom. Nothing here changes the Plan screen, which stays the reference design.

| # | Block | What it shows | Why | Cost |
|---|---|---|---|---|
| 1 | **Header: greeting + now line** | "Good afternoon, Maya." then "Psych lecture until 10:50 · next: café shift at 4" (or "Free until your 4 pm shift"). Keep the time-of-day tint. Drop "3 things today". | Now anchor is table stakes; Saturn proves it is loved; nobody in college planners does it calmly | Small: data is on the device (`useNow`, today's timed items) |
| 2 | **Heads up** (exists) | Conflicts and overload cards | Already differentiating; Structured and Tiimo only warn about overlaps if at all | Done |
| 3 | **Start today** (new, 1–3 rows) | Ranked rows with a one-line reason: "Stats exam · Fri · you work Thu and Fri evenings, about 3 free hours before it". Rank = deadline proximity × free hours before it × shift pressure. Tap → item; swipe → "not today" | This is the promise and the unoccupied territory. Reasons are the AI-trust answer that Tiimo lacks. | Medium: ranking from existing helpers; grade weight would need a `weight` field in the extraction schema (none today), so start without it |
| 4 | **Still open** (new, collapsible) | Undone tasks from past dates, count in the label, one "Move to today" action | Table stakes; currently these vanish | Small |
| 5 | **Today** (exists) | Timed items with the time column, then untimed. After the last fixed block ends (or after 6 pm), the untimed tasks get a "After your shift" / "This evening" label | Things' This Evening adapted to student days, which are cut up by classes and shifts | Small |
| 6 | **Coming up** (exists, reframe) | Keep the deadline rows and the dashed "Next week's shifts, not added yet" row. Add consequence when it applies: "Problem set 5 · Thu · only Tue evening is free before it" | Turns a date list into the thing Shovel charges for, with no setup | Small once #3 exists (same computation) |
| 7 | **Tomorrow peek** (new, evening only) | After 6 pm, one row under Today: "Tomorrow: lecture 9, shift 4–10, problem set due" | Sunsama and Tiimo's end-of-day review drive retention; this is the 5-second version and the daily briefing notification (MVP P0 #6) can reuse the same string | Small |

Empty state: today's empty text is a sentence. Make it the capture card instead: "Paste a schedule, drop a syllabus, or tell Semli your week" with the text field, photo and file buttons inline. Every competitor's home is empty until setup is done (MyStudyLife: classes and rotation; Tiimo: pick tasks; Shovel: a desktop hour); Semli's empty home should *be* the setup. The website's try-it box is the same move and is already the site's best feature.

Keep: list not grid, neutral tasks vs tinted events, done items sinking, the pending-shift row (nobody has it), the glass + and three tabs, sentence-case labels. Do not add: an hour grid, a progress ring, streaks, a mascot, mood, more tabs.

## 6. Marketing homepages, for contrast

| Site | Hero headline | Hero visual | Notable |
|---|---|---|---|
| Structured | "your all in one day planner" | Phone timeline with notebook props | Stats bar (15M+ downloads) right under the hero; all-lowercase headings |
| Tiimo | "A visual AI planner built for real life." | Multi-device illustration | Award strip first; "executive functioning" framing |
| MyStudyLife | "The free student planner that keeps school life organised." | App mockup + web app button | 10M+ students claim; long feature scroll |
| Shovel | "Finally, A Study Planner That Gets You" | Photo of a student | "Set up your semester in seconds" banner; pricing on the homepage |
| Saturn | "The first calendar for high school." | Framer page, little UI | Social framing |
| Semli (now) | "Your syllabus. Your shifts. One clear plan." | Syllabus card → phone showing Plan | Only site of the six where you can try the extraction without installing |

Two changes worth making on the site: show the **Today** screen with a now line and a "Start today" reason in the hero phone instead of the Plan list, because the reason line is the thing no competitor screenshot can show; and put the two findings from strategy.md ("set up your semester in two minutes", "calendar, to-dos, reminders and repeating classes: always free") as a plain two-line strip under the hero where Structured puts download stats.

## 7. Order of work

1. Now line in the Today header, Still open section, evening Tomorrow peek. One session; all on-device data.
2. Empty state as the capture card.
3. Start today with reasons, then reuse the computation in Coming up. Decide whether to add `weight` to the extraction schema after the eval set exists (MVP P0 #1), since it changes the prompt.
4. Site hero swap and the two-line strip, after #3 so the screenshot is real.

## Implementation notes · Oct 19, 2026

- Today now has current/next event context, collapsed overdue tasks, an inline capture card, up to two explained recommendations, and an evening tomorrow preview.
- “Work on today” stores a separate task work date. Source dates and due times are preserved; unfinished work returns to Still open after its chosen work day. “Not today” dismisses only that day's recommendation.
- Recommendations use due-date proximity and booked work, with calendar gap estimates limited to 7 am–11 pm in the three days before a deadline. Incomplete times suppress availability claims. No effort, grade-weight, or importance inference is implied.
- Following the Helthy app comparison, the three tabs share compact header controls. Today and School own their top safe-area spacing explicitly so they align with Plan. Large greeting panels have been replaced by a smaller greeting and context row.
- The Semli Pro paywall uses one selected-price card and a docked purchase footer. Brand colors and Onest remain Semli's; no reference gradients, streaks, or social controls were copied.
- Core behavior has tests covering deadline preservation, date rollover, overnight shifts, overlapping bookings, recommendations, and evening previews. The site hero swap remains separate work.
