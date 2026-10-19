# MVP: what must ship for the paid beta

Status: Oct 19, 2026. This replaces the milestone table in product-plan.md as the working checklist. The MVP exists to run one test: **do 50 engaged students pay after a 7-day trial?** Everything below either makes that test possible or makes the product worth paying for. Anything else waits for [phase-2.md](phase-2.md).

## Already built (verified on the simulator unless noted)
- Onboarding v2 (Oct 19: one-tap questions → demo → your own import → review → heads-up sheet → Plus with trial timeline and "Continue free"), Today, Plan (reference design), School, item detail, settings stack, light/dark, native tab bar with glass "+".
- Capture: text, screenshot, camera, PDF → Claude extraction → review with evidence lines and native date/time pickers → commit with undo.
- Work-schedule diffing, duplicate matching, conflict and overload detection, pending-week state. 26 unit tests.
- Website: landing, try-it box, pricing, terms, privacy, contact, delete-account, API route.
- Extraction benchmark: 30 synthetic texts, 10 public schedule images across 3 vendors, and 5 public university syllabi tested live. Prompt `2026-10-19.7` passed the ≥95% date/time and ≤2% extra-item gates for every input type. [Results and remaining mismatches](../evals/RESULTS.md). This set was used for tuning; private user uploads and an independent holdout remain unverified.
- Not yet verified: capture → review on a real device (SwiftUI pickers, photo library); live extraction gating in CI.

## P0: must ship

| # | Feature | Why it is P0 | Done when |
|---|---|---|---|
| 1 | **Extraction proven on real inputs** | It is the promise and the thing we meter | Eval set in `evals/`: 10 work-schedule screenshots from ≥3 formats (HotSchedules, 7shifts, printed sheet), 5 syllabi PDFs, 30 natural-language texts. ≥95% date/time accuracy, ≤2% invented items. Prompt changes gated by the eval in CI. |
| 2 | **Reminders** | 65% of the survey said "yes, definitely"; it is the daily reason to reopen | **Built Oct 19** (`lib/reminder-plan.ts`, `lib/notifications.ts`, Settings → Reminders; permission asked after the first confirmed import). Not yet fired on a real device. | `expo-notifications`: local notifications for events (30 min before, configurable), deadlines (day before + morning of), quiet hours. Permission asked after the first confirmed import, with context. Settings → Reminders page. |
| 3 | **Purchases + paywall** | The beta measures payment, not opinions | SDK, paywall (Plus · monthly / semester / yearly, student toggle), quota paywall in capture: built. Needs the App Store products and offerings from the brief, the Apple public SDK key in `.env`, and a sandbox purchase on a dev build. | RevenueCat + StoreKit: Plus monthly / semester / yearly at student and regular prices; 7-day trial; day-before-trial-ends reminder; paywall sheet after the first confirmed import and when the free quota (3 imports/month) is hit; quota actually enforced. Restore purchases. |
| 4 | **Dev build + TestFlight** | RevenueCat, share extension and notifications need a real build; Expo Go can't test them | EAS dev build on a real phone; TestFlight with the App Store Connect listing (name, subtitle, 6 screenshots, privacy labels, support URL). |
| 5 | **Measurement** | Without it the test teaches nothing | **Built Oct 19** (`lib/analytics.ts`, Sentry in the root layout). Needs `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_SENTRY_DSN`; without them events log locally only. | PostHog events: onboarding step, import started/succeeded/failed (by kind), review committed, paywall shown, trial started, subscribed, churned. Sentry for crashes. No item titles in events. |
| 6 | **Daily briefing** | Cheap once notifications exist; the "value every week" loop the Structured memo asks for | **Built Oct 19** as part of the reminder plan (7 days ahead, skipped on empty days, time in Settings → Reminders). | One morning notification: "Good morning. 3 things today, exam Friday." Time configurable; off by default on web. |
| 7 | **Store listing copy** | Search is the channel | App record exists: **Semli: AI Student Planner** (id 6824600264). Since "AI" and "planner" are in the title, the subtitle should carry the other terms: "Syllabus, shifts & deadlines" (28). Keyword field: college, schedule, assignment tracker, class, work, semester, homework, calendar. First screenshot captions: "Set up your semester in two minutes" and "Calendar, to-dos, reminders: always free". |

## P1: ship if the week allows, otherwise first thing after beta
- **Share sheet** ("Share to [Name]" from Photos/Files/Safari). Needs a native share extension in the dev build. The in-app picker covers the same job for the test.
- **Export** (ICS + JSON) and "delete everything" already exist in settings; export is new.
- **Widget**: today's next item on the lock screen.

## Cut from the MVP (see phase-2.md)
SMS-to-add, Canvas sync, Google/Apple calendar two-way sync, automated study suggestions and replanning, accounts and cross-device sync, web checkout, the web version of the planner (Expo web runs but we don't invest in it), Android.

## Order of work (4 weeks)
| Week | Work | Exit |
|---|---|---|
| 1 | API key; eval set; fix the prompt until it passes; reminders | Eval ≥95%; reminders fire on a device |
| 2 | RevenueCat, paywall, quota, trial reminder; PostHog + Sentry | A sandbox purchase works end to end; events arrive |
| 3 | EAS dev build; TestFlight; listing assets; daily briefing; recruit 50 testers (nursing cohorts first) | Build installed on 10 phones |
| 4 | Beta: fix what breaks, watch funnels, interviews | Decision: ≥10 of 50 subscribe → phase 2; fewer → interview the "maybes" before building more |
