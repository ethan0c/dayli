# Nowli — Product plan

Status: draft · October 2026 · Companion to [overview.md](overview.md)

## 1. North star

> Nowli should never become another responsibility its users have to manage.

Every scope decision below is tested against one question: **does this reduce the effort it takes a user to get an accurate picture of their week?**

**North-star metric:** *Organized weeks* — the number of users per week whose upcoming 7 days contain at least one imported item (not hand-typed) that they confirmed and did not later delete.

## 2. Primary persona

**Maya, 22, final-year nursing student**
- Clinical rotations (fixed, published per term), lectures, a part-time server job (schedule posted 3–4 days ahead, as a photo of a printed sheet or a screenshot of an app like HotSchedules/7shifts).
- Gets deadlines from 4–6 syllabi PDFs and a school portal.
- Current system: phone calendar for some things, Notes app for tasks, screenshots she scrolls back to find.
- Pain: things slip through when a new work week lands on top of exam week; she doesn't have time to re-enter everything.

**Jobs to be done**
1. "When my new work schedule comes out, get it into my calendar without retyping it, and tell me what changed."
2. "At the start of the semester, turn my syllabi into deadlines I can trust."
3. "When I think of something, capture it in one breath and move on."
4. "When my week is overloaded, tell me before it's too late, and help me rearrange."

Secondary personas (post-MVP): shift workers without school, working parents, freelancers.

## 3. MVP scope

### In
| Area | Feature | Notes |
|---|---|---|
| Capture | Text-to-add (in-app) | Natural language → items; review before save |
| Capture | Screenshot/photo-to-add | Work schedules, portal screenshots, flyers |
| Capture | PDF/document-to-add | Syllabi, course schedules |
| Capture | Voice-to-add | On-device speech-to-text → same text pipeline (cheap to add) |
| Capture | Share sheet extension | "Share to Nowli" from Photos/Files/Safari — critical for low effort |
| Organize | Today (dashboard) | Today's timeline, coming up, changes, suggestions |
| Organize | Plan (day/week/month) | The reference screen: week strip + list of tasks & events |
| Organize | School | Courses, each with meeting times, assignments, exams, source syllabus |
| Organize | Tasks & events | Create, edit, complete, delete, undo |
| Work | Shift schedule versions | Import → diff → confirm; "pending" weeks |
| Smart | Conflict detection | Overlaps between fixed items; overload warnings before deadlines |
| Smart | Reminders | Per-item + sensible defaults; quiet hours |
| Trust | Source retention | Every imported item links back to the original screenshot/PDF/message |
| Trust | Undo + change history | Every import is a single undoable batch |

### Stretch for MVP (decide at milestone 3)
- **SMS-to-add** — strongest "magic" moment but carries cost and US carrier registration overhead (A2P 10DLC). Plan for it; ship it if registration clears in time.
- **Daily briefing notification** — a single morning push summarizing the day.

### Out (V1.1+)
Study-session suggestions and auto-replanning, Google/Outlook two-way sync, Canvas, employer scheduling-system integrations, shared calendars, grade tracking/GPA, Android, web app.

## 4. Information architecture

The reference design has a floating dark nav pill (Home · Plan · timer) plus a separate round action button. Nowli keeps that structure and maps the overview's four areas onto it:

```
┌─ Floating nav pill ───────────────────────┐   ┌───┐
│  Today   ·   Plan   ·   School            │   │ + │  ← Capture button
└───────────────────────────────────────────┘   └───┘
Profile ("You") = avatar in the Today header, not a tab.
```

| Destination | Purpose | Primary content |
|---|---|---|
| **Today** | "What matters right now" | Greeting, today's timeline, Coming up, Changes to review, Nowli suggests |
| **Plan** | Browse and manage time | Week strip, day list (reference screen), toggle Day / Week / Month |
| **School** | Semester structure | Courses → course detail (times, syllabus, assignments, exams) |
| **Capture (+)** | Get things in | Opens capture sheet: text field, mic, camera, photo library, file |
| **You** | Settings | Work schedules/employers, reminders, quiet hours, connected calendars, plan, privacy, export/delete data |

The V1.1 focus timer (the "15:38" segment in the reference) becomes a temporary nav segment while a timer runs, as in the reference.

## 5. Screen inventory (MVP)

| # | Screen | Key states |
|---|---|---|
| 1 | Welcome | Value prop, "Get started" |
| 2 | Onboarding: what's your week like? | Chips: School · Work · Both · Other |
| 3 | Onboarding: first import | "Drop in a syllabus, a work schedule, or just tell me your week" — the activation moment |
| 4 | Sign in (Apple / Google / email) | Deferred until after first import to show value first |
| 5 | Notification permission | Asked after first confirmed import, with context |
| 6 | Today | Empty, normal, busy day, conflict present, changes pending |
| 7 | Plan — Day | Reference screen; tasks (gray rows), events (lavender rows w/ time chip), completed (struck, sunk to bottom) |
| 8 | Plan — Week | 7 columns compact; work shifts as blocks; pending weeks hatched |
| 9 | Plan — Month | Dots per day by category |
| 10 | Item detail | Title, time, category, course link, reminder, notes, **source** (thumbnail of original), history |
| 11 | Capture sheet | Text, voice, camera, library, files; recent captures |
| 12 | Review extraction | Cards per extracted item; ambiguous fields highlighted; "Add 7 items" |
| 13 | Schedule diff | New / Changed / Removed / Unchanged groups; confirm |
| 14 | Conflict / overload sheet | What collides, options (user approves) |
| 15 | School — Courses | Course cards with next deadline |
| 16 | Course detail | Meeting times, syllabus source, assignments, exams |
| 17 | You / Settings | As listed above |
| 18 | Import history | Every import, its items, Undo |

## 6. Key flows

### 6.1 Capture → review → commit (the core loop)
1. User taps **+** (or shares a file / sends SMS / speaks).
2. Capture is saved as a **Source** immediately (never lose input, even offline).
3. Extraction runs (target: < 6 s for text, < 15 s for a 3-page PDF); UI shows a "Reading your syllabus…" card with the source thumbnail.
4. **Review screen**: one card per item. Fields the model is unsure about (ambiguous date, missing time, unclear year) are highlighted lavender with a question chip ("Which Friday?").
5. User taps **Add N items**. Commit is one batch → one Undo.
6. Toast: "Added 3 shifts and 1 task. Undo."

Rules: nothing from AI is saved without user confirmation in MVP; relative dates ("next Friday") resolve against the capture's timestamp and the user's timezone; duplicates are merged, not doubled.

### 6.2 New work schedule (diffing)
1. Import a screenshot of next week's schedule.
2. Nowli detects it's a work schedule for employer "Olive Garden" covering Oct 27–Nov 2.
3. It compares against the stored version for overlapping dates and shows:
   - **New** Thu 4–10 PM
   - **Changed** Fri 4–10 → 5–11 PM
   - **Removed** Sat 11–5
   - Unchanged (collapsed)
4. Confirm all / adjust individually.
5. Weeks with no published schedule show a hatched **Pending** band on Plan — never "free".

### 6.3 Syllabus import
1. Upload PDF → Nowli detects course code, title, instructor, meeting pattern, term dates.
2. Proposes a **Course** + N assignments/exams; matches to an existing course if the code matches.
3. Review grouped by month; confirm.

### 6.4 Conflict & overload
- **Conflict** = two fixed items overlap (e.g., shift vs. clinical). Shown as a coral badge on both items and a card on Today.
- **Overload** = committed hours in the 72 h before an exam/deadline exceed a threshold (default: < 4 free waking hours). Card on Today: "Busy weekend before your Pharm exam. Want help planning study time?" In MVP this links to the day view; automated suggestions are V1.1.

## 7. Milestones (12 weeks to private beta)

| Wk | Milestone | Exit criteria |
|---|---|---|
| 0–1 | **Foundations** | Name check started; logo direction picked; design tokens in Figma + code; repo, CI, auth, DB schema |
| 2–3 | **Plan & Today shells** | Reference Plan screen pixel-matched with local data; create/complete/delete tasks & events; week strip |
| 4–5 | **Text capture + review** | NL text → review → commit → undo; extraction eval set v1 (100 cases) ≥ 95% date accuracy |
| 6 | **Screenshot & PDF capture** | Share extension; image & PDF extraction; source retention |
| 7 | **School** | Courses from syllabi; course detail; assignment list |
| 8 | **Work schedules** | Employer, schedule versions, diff screen, pending weeks |
| 9 | **Conflicts, reminders** | Conflict & overload detection; push reminders; quiet hours |
| 10 | **SMS (stretch) + voice** | SMS round-trip with confirm link; on-device dictation |
| 11 | **Polish, privacy, onboarding** | Onboarding with first-import activation; data export/delete; accessibility pass |
| 12 | **TestFlight beta** | 15–25 working students; weekly interviews |

## 8. Success metrics

| Metric | MVP target |
|---|---|
| Time to first organized week (install → first confirmed import) | Median < 5 min |
| Extraction date/time field accuracy (eval set) | ≥ 95% |
| Items confirmed without edits | ≥ 80% |
| Undo rate on imports | < 5% |
| Imports per active user per week | ≥ 2 |
| W4 retention (beta) | ≥ 40% |
| "Would be very disappointed without Nowli" (Sean Ellis) | ≥ 40% |

## 9. Monetization checkpoints
Free during beta. Track per-user AI and SMS cost from day one (cost per import, per SMS) so Nowli Plus limits are set from data. Candidate Plus line: higher import limits, SMS assistant, planning suggestions, calendar sync.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| AI misreads a date → user misses a shift | Mandatory review step; highlight low-confidence fields; keep source one tap away; eval set gates every prompt change |
| Duplicate events from repeated imports | Fingerprint matching + schedule versioning (technical-plan §5) |
| "Nowli" vs. "daily" searchability | Always style as "Nowli" with distinctive wordmark; ASO keywords ("Nowli planner"); pursue clearance before spend |
| SMS registration delays / cost | Treat as stretch; in-app + share sheet cover the same job |
| Users don't come back after setup | Daily briefing, schedule-change pings, weekly "next week" prompt on Sundays |
| Privacy concerns (screenshots of personal info) | Clear data policy; delete-source option; no training on user data; encryption at rest |
