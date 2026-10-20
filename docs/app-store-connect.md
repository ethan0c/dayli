# App Store Connect: every field, ready to paste

October 20, 2026. App record **Semli: AI Student Planner**, Apple ID `6824600264`, bundle id `app.semli.mobile`. Character counts are in brackets where Apple has a limit. Where a field needs something only you have (a phone number, a demo account), it says **you**. Finished screenshots: `design/screenshots/out/`, made by `design/screenshots/compose.py`.

## 1. App Information

| Field | Value |
|---|---|
| Name [30] | `Semli: AI Student Planner` (25) |
| Subtitle [30] | `Syllabus, shifts & deadlines` (28) |
| Primary category | Productivity |
| Secondary category | Education |
| Content rights | Does not contain, show, or access third-party content |
| Age rating | Answer **None** to every question. Set "Unrestricted web access" to No, "Gambling" No, "Contests" No. Result: 4+ |
| Privacy Policy URL | `https://semli.app/privacy` |
| License agreement | Apple's standard EULA (leave custom EULA empty) |
| App-Specific Shared Secret | Generate, paste into RevenueCat → Semli (App Store) app settings |
| App Store Server Notifications | Production and Sandbox URLs from RevenueCat → Project → Apps → Semli (App Store); version 2 |

## 2. Pricing and Availability
- Price: **Free** (Plus is sold inside the app).
- Availability: United States only for the beta; all territories at public launch.
- Pre-orders: off. App distribution: public.

## 3. Version information (the 1.0 page)

**Promotional text** [170], editable without a new build:
```
Drop in a syllabus or a screenshot of your work schedule. Semli reads the dates and tells you what matters today. Free to start.
```

**Description** [4000]:
```
Semli is the daily planner for college students who also have a job, a life, and no time to type their schedule into a calendar.

Send Semli what you already have. A syllabus PDF, a screenshot of your work schedule, a photo of a printed shift sheet, a message from the group chat. Semli reads the dates, times, exams and due dates and lays them out on your week. You check what it found before anything is saved, and every import can be undone.

TODAY, AT A GLANCE
One screen with what’s next, a countdown to it, and the day as a bar. Due dates in red, done in green. Nothing to scroll through.

THE WEEK AS A CHART
Classes, shifts and study time on one timeline. Overlaps show in red before they become a problem, and Semli suggests a free slot for anything you can move.

A SYLLABUS BECOMES THE TERM
Upload the PDF and every exam, reading and assignment lands on your calendar. Use Canvas? Paste your Canvas calendar feed once and assignments come in on their own.

NEW WORK SCHEDULE? ONLY THE CHANGES
Send next week’s schedule and Semli compares it with the shifts you already have: what moved, what’s new, what was dropped. Keep anything with one tap.

REMINDERS THAT MATCH YOUR DAY
A heads-up before classes and shifts, the day before a due date, and one morning note with what’s on. Quiet at night. Mark anything urgent and it rings like an alarm.

FREE, FOREVER
The calendar, to-dos, reminders and 3 AI imports a month are free, with no time limit.

SEMLI PLUS
Unlimited imports, Canvas kept in sync, schedule-change comparisons and suggested times for overlaps. Student pricing is on the honor system: $4.99 a month, $14.99 a semester, or $29.99 a year, with a 7-day free trial. Regular pricing is $7.99, $24.99 and $49.99.

PRIVATE BY DEFAULT
Your plan lives on your phone. Files you import are read by our AI provider and not stored. An account is optional; it backs up your plan so a new phone can restore it.

Semli is built for students in nursing, engineering, business and every other major that mixes lectures, labs, clinicals and part-time work. iPhone only for now.

Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel in your Apple ID settings. Terms: https://semli.app/terms. Privacy: https://semli.app/privacy.
```
Apple's own guidance accepts section headings in capitals inside the description field; the sentence-case rule is for our UI and site. Change them to sentence case if you prefer.

**Keywords** [100], no spaces, no words already in the name or subtitle:
```
college,schedule,assignment,tracker,class,work,semester,homework,calendar,nursing,organizer,canvas
```
(96 characters.)

**What’s New in This Version** [4000], for 1.0:
```
First release. Syllabus and work-schedule import, Canvas sync, reminders, and the week as a chart.
```

| Field | Value |
|---|---|
| Support URL | `https://semli.app/contact` |
| Marketing URL | `https://semli.app` |
| Copyright | `2026 Chibudom Onyejesi` (**you**: or your company name once there is one) |
| Version | `1.0.0` (must match `expo.version` in `app.json`, currently `0.1.0`: bump before the build) |
| Build | Uploaded by `eas submit`; pick the latest |
| App Clip, Game Center | none |

**Screenshots, 6.9-inch display** (1320 × 2868, upload in this order; the first three show in search):

| # | File | Caption on the image |
|---|---|---|
| 1 | `1-today.png` | Know what matters today |
| 2 | `2-review.png` | Screenshot your work schedule. Done. |
| 3 | `3-update.png` | New schedule? See only what changed |
| 4 | `4-plan.png` | Your whole week as a chart |
| 5 | `5-school.png` | Every syllabus, mapped to the term |
| 6 | `6-paywall.png` | Calendar, to-dos, reminders: always free |

Apple scales the 6.9-inch set to every other iPhone size. No iPad set (`supportsTablet: false`). App previews (video): none for 1.0.

## 4. App Review Information

| Field | Value |
|---|---|
| Sign-in required | **Yes** (the app has optional accounts; reviewers need a way in). Create a reviewer account in the app with email `review@semli.app` (**you**: the password), confirm it, and paste both here. |
| Contact first/last name, phone, email | **you** |
| Notes | see below |
| Attachment | none |

Notes for the reviewer:
```
No account is needed to use the app; the reviewer account is only for testing login and backup.

To see a populated planner: in onboarding, pick Student, any major, then tap "Explore my preview first".

To test an import: on the Add tab, type "I work Fri 4-10 and Sat 11-5 at the campus café, exam Monday at 9" and send. The review screen shows what was found; tap Add to confirm.

To test Canvas sync: You → Canvas, paste any Canvas calendar feed link (webcal://…/feeds/calendars/….ics). A test feed: [you: paste a feed URL from a Canvas test account, or remove this line].

Subscriptions use StoreKit through RevenueCat. Each product has a 7-day free trial. Price, period, renewal terms and Restore purchases are on the paywall (You → Your plan).

Photos permission is used only to show recent screenshots on the Add tab. Notifications are local reminders. AlarmKit (iOS 26) is used for items the user marks urgent.
```

## 5. App Privacy (the nutrition label)

Data collected, with purpose. Nothing is used for tracking; do not check "Tracking".

| Data type | Linked to you? | Purpose | Source |
|---|---|---|---|
| Contact Info → Email Address | Linked | App Functionality (account) | Supabase, only when they sign up |
| Identifiers → User ID | Linked | App Functionality | Supabase user id, RevenueCat app user id |
| Purchases → Purchase History | Linked | App Functionality | RevenueCat |
| User Content → Other User Content | Not linked | App Functionality | Messages, screenshots and PDFs sent for extraction; not stored |
| User Content → Photos or Videos | Not linked | App Functionality | Same, when the import is an image |
| Usage Data → Product Interaction | Not linked | Analytics | PostHog (no content, no titles) |
| Diagnostics → Crash Data, Performance Data | Not linked | App Functionality | Sentry |
| Identifiers → Device ID | Not linked | Analytics | PostHog anonymous id |

Not collected: name (optional, stays on the phone unless they sign up with it; if you keep it in the Supabase user metadata, add Contact Info → Name, linked), location, contacts, health, financial info, browsing history, search history.

Privacy policy must name Anthropic as the processor of uploaded content and Supabase as the host of account data. Check `apps/web/app/privacy/page.tsx` says both.

## 6. In-App Purchases

Subscription group **Semli Plus** (group display name shown to customers: `Semli Plus`). Six auto-renewable subscriptions, product ids exactly as in `docs/revenuecat-offerings-brief.md`:

| Product ID | Display name [30] | Description [45] | Duration | Price | Intro offer |
|---|---|---|---|---|---|
| `semli_plus_monthly_student` | Plus Monthly, student | Unlimited imports and Canvas sync | 1 month | $4.99 | Free, 1 week |
| `semli_plus_semester_student` | Plus Semester, student | Unlimited imports and Canvas sync | 6 months | $14.99 | Free, 1 week |
| `semli_plus_yearly_student` | Plus Yearly, student | Unlimited imports and Canvas sync | 1 year | $29.99 | Free, 1 week |
| `semli_plus_monthly_regular` | Plus Monthly | Unlimited imports and Canvas sync | 1 month | $7.99 | Free, 1 week |
| `semli_plus_semester_regular` | Plus Semester | Unlimited imports and Canvas sync | 6 months | $24.99 | Free, 1 week |
| `semli_plus_yearly_regular` | Plus Yearly | Unlimited imports and Canvas sync | 1 year | $49.99 | Free, 1 week |

Each product also needs: availability (all territories or US), a **review screenshot** (use `6-paywall.png`), and review notes ("Student pricing is on the honor system; nothing is verified."). Subscription levels in the group: yearly = level 1, semester = level 2, monthly = level 3, student and regular at the same level, so upgrades and downgrades behave.

Agreements: the **Paid Applications** agreement must be signed (Business → Agreements) with banking and tax forms done, or the products stay "Missing Metadata".

## 7. TestFlight

| Field | Value |
|---|---|
| Beta App Description | `The daily planner for college students. Drop in a syllabus or a screenshot of your work schedule and Semli reads the dates.` |
| Feedback email | `hello@semli.app` |
| Marketing URL / Privacy Policy URL | `https://semli.app`, `https://semli.app/privacy` |
| What to Test | `Add a syllabus or a screenshot of your work schedule, then check Today. Try Canvas (You → Canvas) if your school uses it. Reminders and the 7-day trial are real; sandbox purchases don't charge you. Log in or sign up is optional and backs up your plan.` |
| Beta App Review contact | **you** |
| Export compliance | "No" to non-exempt encryption; `ITSAppUsesNonExemptEncryption = false` is in `app.json` |
| Groups | Internal: you and Rico. External: "Beta Oct 2026", public link, cap 200 |

## 8. Before you press Submit

- [ ] `expo.version` bumped to `1.0.0`; build number set by EAS (`autoIncrement` in `eas.json`).
- [ ] Production keys in EAS env: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (`appl_…`), `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, `EXPO_PUBLIC_API_URL=https://semli.app`.
- [ ] Web host env: `SUPABASE_URL`, `SUPABASE_KEY`, `REVENUECAT_SECRET_KEY`, `ANTHROPIC_API_KEY`.
- [ ] Supabase: anonymous sign-ins on, both migrations run, Resend SMTP on, email templates pasted, Site URL `https://semli.app`.
- [ ] One sandbox purchase per term works, Restore works, the trial shows as a trial in RevenueCat.
- [ ] A reminder fired on a real phone; a Canvas feed synced on a real phone.
- [ ] `APP_STORE_LIVE = true` in `apps/web/lib/site.ts` once approved, so the site's "Get the app" links to the store.

**One review risk to decide now.** Guideline 4.8: an app that offers a third-party login (Google) must also offer a login that limits data collection to name and email and lets people hide their email. Sign in with Apple is the usual answer. We removed it on Oct 19. If review rejects on 4.8, add it back (about an hour: `expo-apple-authentication`, the Apple provider in Supabase, `usesAppleSignIn` in `app.json`). Email + password alone may satisfy the rule since it collects only an email; reviewers vary.
