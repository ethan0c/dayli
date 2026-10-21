# Phase 2: what comes after the first release

Status: Oct 21, 2026. Phase 1 is the app as it stands on `main` (PRs #1–#9 of Oct 21 included: the launch hand-off, the clear flows, the firsts, What Semli can do, voice capture, the free-tier allowance, term-end estimates, markdown notes). Nothing in Phase 1 after Oct 20 has run on a device yet.

This doc is the list to pick from once the beta is in hands. Each item says what it is, why it earns a place (the survey, the benchmarks, or a gap the code already has), how big it is, what it waits on, and what number tells you it worked. Items are grouped by what they do for the business, and ordered inside each group by evidence, not by how fun they are to build.

Sources: `pricing-and-positioning.md` (the survey, n = 66), `onboarding-research.md` (the benchmarks), `strategy.md` (competitor reviews), `todo.md` (the code's own gaps), `voice-capture.md`.

## 0. Before any of this: two gates

| Gate | Why it comes first |
|---|---|
| **A device pass of Phase 1.** Cold launch in both appearances and with Reduce Motion; Clear everything as a guest and Clear my plan signed in; the four firsts; What Semli can do; voice (needs a development build, not an OTA update); the allowance copy in You; a syllabus with no end date. | Nine merged changes with no device run. Every Phase 2 item below builds on them. |
| **Server-side import quota.** Authenticated extract requests, RevenueCat entitlement verification on the server, a durable per-account import ledger. The website demo uses the same endpoint. | Today the allowance lives on the phone and resets with a reinstall. "Five to start, then three a month" is a suggestion until this exists. It is the one profit item that outranks every feature. Size: about a week (Supabase table, an edge check in `apps/web/app/api/extract/route.ts`, the RevenueCat webhook). Metric: free imports per account per month converges on the allowance. |

## 1. Revenue

| Item | What | Why | Size | Waits on | Metric |
|---|---|---|---|---|---|
| **Trial timeline + day-5 reminder** | On the paywall: "Today: everything. Day 5: a reminder. Day 7: $14.99." Then actually send the day-5 local notification, and make sure the morning briefing is on from the moment a trial starts. | Blinkist: +23% trial starts from the timeline. RevenueCat: over half of cancellations happen on day 0 when nothing is scheduled for tomorrow. The paywall rows already show the timeline; the reminder is not scheduled. | Days | Nothing | Trial start rate on the onboarding paywall; day-0 cancellations. |
| **Web checkout for semester and yearly** | Stripe on the site for the two plans people should buy; monthly stays in-app. | Avoids 15–30% on the plans that carry the revenue; allowed in the US since the Epic ruling. | A week | Accounts live (sign-in links the purchase) | Share of paid revenue net of store fees. |
| **First urgent item free** | One urgent item rings without Plus; the second asks. | 83% have missed an assignment; the alarm is the emotional hook. Considered Oct 21 and deferred: `alarms.ts` refuses to schedule without an entitlement, so it needs a per-item exception in AlarmKit code that has not run on a device. | Days | The device pass confirms alarms ring for Plus | Paywall shown with reason `urgent` → trial start. |
| **Siri: "Hey Siri, add to Semli…"** (Plus) | An App Intent that takes a sentence, runs the same text extraction, opens the review sheet. | Hands-free is the version of voice people use when walking out of a lecture. Decided Plus-only Oct 21 (`voice-capture.md` §8). | Two weeks (native: an App Intent through a config plugin or a small Expo module) | Voice capture used on a device; `voice_started` is healthy | Imports with kind `siri` per Plus user. |
| **Hard-paywall test on a slice** | A true paywall after the first import for 10–20% of new installs, retention as the tie-breaker. | RevenueCat: 10.7% vs 2.1% paid by day 35. Freemium was chosen for ASO and reputation; the cost is real and should be measured, not assumed. | Days to build, a semester to read | ~1,000 installs | Paid by day 35 and day-30 retention, slice vs control. |
| **Ratings prompt** | `expo-store-review` after the second confirmed import, never on first launch. | Listed for Phase 2 in `launch-guide.md`. Ratings move search rank. | Hours | Nothing | Rating count per 100 installs. |

## 2. Retention

| Item | What | Why | Size | Waits on | Metric |
|---|---|---|---|---|---|
| **Accounts, finished** | Google OAuth, email verification, reset, session refresh, authenticated deletion, RevenueCat identity migration, onboarding persisted separately from auth so sign-out never deletes a guest plan. | `lib/auth.ts` is still the unconfigured boundary (`todo.md`). Accounts are what make the laptop (89%) and a new phone work. Tiimo lifted trial starts by moving account creation just after welcome; the welcome is built for it. | A week | Supabase project live | Sign-ups per install; plans restored on a second device. |
| **Extraction fills notes** | Add `notes` to the extraction schema and prompt; a syllabus's "bring a lab coat", "chapters 4–6" land in the item's notes. | Notes render like a markdown file now (PR #9), but imports never fill them. A server change that affects every import, so it ships with the eval set green. | Days + an eval run | Nothing | Share of imported items with notes; review commit rate unchanged. |
| **Course notes** | A notes page per course, same renderer, stored on the course. | "Like an md file" (founder, Oct 21). Mostly a storage question once item notes exist. | Days | Nothing | Courses with notes after week 2. |
| **Other LMS feeds** | Blackboard, Brightspace and Moodle also publish iCal feeds. Same sync, a different link page. | 71% Canvas; the rest is 29% of students with nothing to connect. The onboarding `lms` answer says which to build first. | Days each | A real Canvas feed verified on a device | `lms` answer → connected rate, per platform. |
| **Quarter vs semester** | One onboarding question (or a School setting) so the term-end estimate ends in March/June for quarter schools. | PR #8 guesses US semesters; a quarter school gets the wrong default, visibly. | Hours | Seeing a quarter-school tester | "Until when?" pill accepted vs picked. |
| **Semester-over prompt** | School: "Fall 2026 is over · Remove 4 courses?" | In `todo.md`. The app otherwise carries dead courses into spring. | Hours | Nothing | Courses removed in the first week of a term. |
| **Overdue auto-collapse** | The "Still open" pile folds after 14 days. | In `todo.md`. A long pile is the thing that makes a planner feel like a debt. | Hours | Nothing | Day-14 retention of people with ≥5 overdue. |
| **Firsts, reviewed** | Read `first_note {kind, action}` and `can_do {item}`: which notes get "See it" vs "Got it", which rows get tapped. Rewrite or remove the ones nobody opens; add the toast line ("Added 4 things. One overlaps your shift.") if the overlap note is scrolled past. | The firsts replaced a tour on the bet that in-place beats a walkthrough. Data decides. | Hours | Two weeks of beta data | Opened / shown per kind. |

## 3. Capture (the product promise)

| Item | What | Why | Size | Waits on | Metric |
|---|---|---|---|---|---|
| **Share sheet into Add** | A share extension: a screenshot, a PDF, a message or a note shared from any app opens Semli's Add with it attached. | Removes the copy-paste step for the 73% whose assignments arrive outside Canvas. Listed in `todo.md`. | A week (native extension) | Nothing | Imports from the share sheet per user. |
| **Undated schedule screenshots** | When a shift screenshot has weekday names but no dates, the model should anchor to the coming week and the review should say "Assumed next week · change" with a one-tap week picker. | Raised Oct 21. Today undated shifts land in Plan's needs-a-date state one at a time. A prompt change plus a review affordance. | Days + an eval run | Nothing | Undated items per schedule import; review commit rate. |
| **Streaming "Found so far"** | Rows appear in the Reading state as the model streams, instead of all at once at the end. | In `todo.md`. The Heard rows already set the rhythm; this is the real version of it. | Days (server streaming + the skeleton) | Nothing | Time-to-first-row; cancel rate during reading. |
| **Heard rows, tuned** | Expand the cue table from real transcripts: phrases that were missed, am/pm guesses that were wrong. | The parser is rules; rules improve from examples. | Hours per pass | Voice on a device | Heard rows per voice import; corrections in review. |
| **Resume a closed review** | "Finish reviewing Campus Café · 7 shifts" on Add. | In `todo.md`. A closed review is a lost import today. | Hours | Nothing | Resumed reviews. |
| **Sample week removal** | On the first real import, remove the sample with a toast. | In `todo.md`. | Hours | Nothing | Sample rows alive after first import → 0. |

## 4. Sharing and growth

| Item | What | Why | Size | Waits on | Metric |
|---|---|---|---|---|---|
| **Schedule share links** | A named, private, read-only link a parent or friend opens in a browser: owner and date range in the message preview, titles hideable, school/work only, revocable, "updated 2 h ago". | `share-schedule.tsx` is built behind `SHARING_ENABLED = false`; the screen says links are coming. Every shared link is marketing; this stays free (`pricing-and-positioning.md`). | A week (a public route on the site, a token table, the allowlisted payload that already exists) | Accounts | Links created per user; installs from link views. |
| **Referral on the share link** | The viewer's page ends with "Plan your week like this" → the store. | Free distribution on a surface that already exists. | Hours | Share links | Installs attributed to links. |

## 5. Platform

| Item | What | Why | Size | Waits on | Metric |
|---|---|---|---|---|---|
| **Web planner** | The Expo app on the web with the same screens, behind an account. | 65% do schoolwork on a laptop. The site has try-it and pricing only. Not a second codebase. | Two weeks (web layout, keyboard, no native modules) | Accounts; a web build of the router | Weekly active on web among account holders. |
| **Today widget** | A small and a medium home-screen widget: the next commitment and the countdown. | The one big number per screen, on the home screen. Strong for daily return. | A week (WidgetKit through a config plugin, shared app group storage) | Nothing | Day-7 retention of widget users vs not. |
| **Two-way calendar sync** | Apple/Google Calendar events into Today; Semli items out. | The beta copy already apologises for its absence. Big: conflicts, duplicates, which side wins. | Weeks | Accounts; a clear rule for ownership | Users with sync on; overlap notes that involve a calendar event. |
| **Android** | Not planned. Revisit only if campus demand is loud (`pricing-and-positioning.md` §4). Ringing alarms would need their own native implementation. | — | — | — | — |
| **iPad** | Not planned for 1.x (`supportsTablet: false`). | — | — | — | — |

## 6. Polish carried from Phase 1

From `todo.md` and `design-system.md`, still true:

- Moments need a calendar of breaks and finals, and licensed photos.
- Scrubbing the day bar to change the countdown; a haptic on the week-chart day tap; the hour view fading in on first open.
- "Block time to study" on an empty Plan day.
- Shared format helpers into `lib/format.ts`; one `FieldPill`; the compact 18/26 type token.
- The pill-to-native-picker second tap; the series end picker's missing min/max.
- Large text and VoiceOver pass over every screen added since Oct 19, swipe actions as accessibility actions.
- The design-system page's "what Semli would add" line and the beta copy's "no two-way sync yet" updated as the items above land.

## 7. Suggested order

1. The two gates (§0).
2. Trial timeline and day-5 reminder; ratings prompt. Cheap, measurable, revenue.
3. Accounts finished; then web checkout and share links, which both wait on it.
4. Extraction notes and undated screenshots, with an eval run each.
5. Share sheet; Today widget.
6. First urgent free; Siri.
7. The hard-paywall slice, once there are a thousand installs to split.

Re-read §2 "Firsts, reviewed" two weeks into the beta and prune this list with the numbers, not the ideas.
