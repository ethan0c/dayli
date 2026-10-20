# App Store Connect: every field, ready to paste

October 20, 2026. App record **Semli: AI Student Planner**, Apple ID `6824600264`, bundle id `app.semli.mobile`. Character counts are in brackets where Apple has a limit. Where a field needs something only you have (a phone number, a demo account), it says **you**. Finished screenshots: `design/screenshots/` (6.9-inch), `design/screenshots/6.3-inch/`, `design/screenshots/2007x2853/` and the header and search card in `design/screenshots/header/`, all made by `design/render-screenshots.py`. Sidebar order follows App Store Connect: General → App Store → Trust & Safety → Growth & Marketing → Monetization.

## 1. General → App Information

The page as App Store Connect shows it, top to bottom.

| Field | Value |
|---|---|
| Name [30] | `Semli: AI Student Planner` (25) |
| Subtitle [30] | `Syllabus, shifts & deadlines` (28) |
| Apple ID | `6824600264` (read-only) |
| Bundle ID | `app.semli.mobile` (read-only once a build is uploaded) |
| SKU | `semli-ios` (any unique string; never shown to customers) |
| Primary Language | English (U.S.) |
| Category → Primary | Productivity |
| Category → Secondary | Education |
| Content Rights | **Set Up** → "Does not contain, show, or access third-party content". The bundled showcase photos are licensed to us, not third-party content in Apple's sense. |
| License Agreement | Apple's Standard License Agreement. Do not upload a custom EULA; the subscription terms on the paywall and `semli.app/terms` are enough. |

**Age Ratings → Set Up.** Answer the questionnaire like this; the result is 4+ everywhere.

| Section | Question | Answer |
|---|---|---|
| In-App Controls | Parental controls | No |
| In-App Controls | Age assurance | No |
| Capabilities | Unrestricted web access | **No** (the app opens only our own links and the Canvas feed the user pastes; no browser) |
| Capabilities | User-generated content | **No** (plans are private to the device or the account; nothing is shared with other users; `SHARING_ENABLED` is off) |
| Capabilities | Social media | No |
| Capabilities | Messaging and chat | No |
| Capabilities | Advertising | No |
| Mature Themes | Profanity or crude humor; horror; alcohol, tobacco, drugs | None |
| Medical or Wellness | Medical or treatment information | None |
| Medical or Wellness | Health or wellness topics | None (nursing *students* plan their classes; the app gives no health content) |
| Sexuality or Nudity | All three | None |
| Violence | All four | None |
| Chance-Based Activities | Gambling, simulated gambling, contests, loot boxes | None |

If the questionnaire asks about "frequent or intense" anything, every answer is None. If it asks about Made for Kids: No.

**App Encryption Documentation.** Nothing to upload. `ITSAppUsesNonExemptEncryption = false` is already in `app.json` (`ios.infoPlist`), so each build answers the export-compliance question itself. The app uses only HTTPS through the operating system, which is exempt.

**App Store Regulations & Permits**

| Item | Value |
|---|---|
| Digital Services Act → trader status | Keep **trader** (already set). Apple shows the trader's name, address, email and phone on the EU product page, so under **Edit** confirm the address and a phone number you are willing to publish. A PO box or registered-agent address is fine. If you will not sell in the EU for the beta, leave the EU out of availability instead. |
| Add Labels and Markings | None. Nothing in the app is a regulated product. |
| Vietnam Game License | Not applicable; not a game. |
| Regulated Medical Devices | **Declare** → "Not a regulated medical device". Required only if the category were Medical or Health & Fitness, or "Medical or Treatment Information" were frequent; it is neither, but declaring costs nothing and stops the reminder. |

**App Store Server Notifications**

| Field | Value |
|---|---|
| Production Server URL | From RevenueCat → Project → Apps → Semli (App Store) → "Apple Server Notifications": the production URL (`https://api.revenuecat.com/v1/subscribers/…/apple_server_notifications…`). Version 2. |
| Sandbox Server URL | Same page, the sandbox URL. Version 2. |

**App-Specific Shared Secret.** Manage → Generate. Copy it once into RevenueCat → Semli (App Store) → App-Specific Shared Secret. It is not needed in the app or the repo.

**Additional Information.** View on App Store (inactive until live); Edit User Access: add Rico as App Manager if he configures products; Remove App: no.

**Draft Submissions (1).** The 1.0 version page. It submits when sections 2 to 6 below are complete and a build is attached.

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

Today, at a glance
One screen with what’s next, a countdown to it, and the day as a bar. Due dates in red, done in green. Nothing to scroll through.

The week as a chart
Classes, shifts and study time on one timeline. Overlaps show in red before they become a problem, and Semli suggests a free slot for anything you can move.

A syllabus becomes the term
Upload the PDF and every exam, reading and assignment lands on your calendar. Use Canvas? Paste your Canvas calendar feed once and assignments come in on their own.

New work schedule? Only the changes
Send next week’s schedule and Semli compares it with the shifts you already have: what moved, what’s new, what was dropped. Keep anything with one tap.

Reminders that match your day
A heads-up before classes and shifts, the day before a due date, and one morning note with what’s on. Quiet at night. Mark anything urgent and it rings like an alarm.

Free, forever
The calendar, to-dos, reminders and 3 AI imports a month are free, with no time limit.

Semli Plus
Unlimited imports, Canvas kept in sync, schedule-change comparisons and suggested times for overlaps. Student pricing is on the honor system: $4.99 a month, $14.99 a semester, or $29.99 a year, with a 7-day free trial. Regular pricing is $7.99, $24.99 and $49.99.

Private by default
Your plan lives on your phone. Files you import are read by our AI provider and not stored. An account is optional; it backs up your plan so a new phone can restore it.

Semli is built for students in nursing, engineering, business and every other major that mixes lectures, labs, clinicals and part-time work. iPhone only for now.

Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel in your Apple ID settings. Terms: https://semli.app/terms. Privacy: https://semli.app/privacy.
```
Section headers are sentence case, like everything else we publish; Apple allows no other formatting in this field, so each header sits on its own line with a blank line above.

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

**Screenshots, 6.9-inch display** (1320 × 2868, `design/screenshots/`, upload in this order; the first three show in search):

| # | File | Caption on the image |
|---|---|---|
| 1 | `01-school.png` | A semester in two minutes |
| 2 | `02-review-update.png` | Screenshot your shifts |
| 3 | `03-today-mon.png` | Know what matters today |
| 4 | `04-plan.png` | School and work in one week |
| 5 | `05-review.png` | Nothing saves until you say so |
| 6 | `06-paywall.png` | The planner stays free |
| 7 | `07-today-mon-hours.png` | Hour by hour |
| 8 | `08-add.png` | Type it or screenshot it |
| 9 | `09-item.png` | Every detail one tap away (optional) |

Apple scales the 6.9-inch set to every other iPhone size. The 6.1"/6.3" slot (1206 × 2622) and the foldable inner-display slot (2007 × 2853) are optional; downscaled and re-laid-out copies are in `design/screenshots/6.3-inch/` and `design/screenshots/2007x2853/`. No iPad set (`supportsTablet: false`). App previews (video): none for 1.0.

**Growth & Marketing → Custom Product Pages / Asset Library** (optional, iOS 27): Header `design/screenshots/header/header-3840x1646.png` (wordmark and tagline centered); Search Results `design/screenshots/header/search-3840x2560.png` (tagline and the Today phone). Check both in the Preview tool; the crop differs per device.

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

## 5b. Trust & Safety → App Accessibility (Accessibility Nutrition Label)

Declare only what is true on a device; Apple can check. Current state of the code, with what still needs verifying marked **verify**:

| Feature | Declare? | Basis |
|---|---|---|
| VoiceOver | Yes, **verify** | Rows, pills, toggles and charts carry `accessibilityLabel`/`accessibilityRole`; the review chart has per-day labels. Walk Today, Plan, Review and the paywall with VoiceOver on before declaring. |
| Voice Control | Yes, **verify** | Follows from labelled controls; check that pill buttons are reachable by name. |
| Larger Text | **Verify** | Text tokens are fixed sizes (Geist 12–56). If Dynamic Type is not honored, do not declare it. |
| Dark Interface | Yes | Appearance: Match iPhone / Light / Dark, full dark palette. |
| Differentiate Without Color Alone | Yes | Status pills carry words ("Due today", "Moved", "Dropped"); overlaps say "Overlaps"; charts have legends. |
| Reduced Motion | Yes | Reduce Motion suppresses the purchase confetti and the motion tokens respect it. |
| Sufficient Contrast | Yes, **verify** | Ink on paper and the status colors were chosen for contrast; check the 12px captions and secondary text with Apple's checker. |
| Captions / Audio Descriptions | Not applicable | No video or audio content. |

## 5c. Everything else in the sidebar

| Page | 1.0 answer |
|---|---|
| Growth & Marketing → In-App Events | None. |
| Growth & Marketing → Custom Product Pages | None for 1.0; later one per intent page (nursing, shifts, syllabus). |
| Growth & Marketing → Asset Library | Upload the header and search card from `design/screenshots/header/`. |
| Growth & Marketing → Product Page Optimization | Nothing until there is traffic; first test: screenshot 1 with and without the wordmark. |
| Growth & Marketing → Promo Codes | Generate 20 for beta students once approved; they unlock a subscription for free. |
| Game Center | Off. |
| Monetization → Featuring / Nominations | Nominate for the back-to-school window (early January 2027) after launch. |
| Ratings and Reviews | Nothing to set; respond to every review once live. |

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
- [x] Production keys in EAS env (pushed Oct 20, 2026 to `production` and `preview`): every `EXPO_PUBLIC_*` value from `apps/mobile/.env` with `EXPO_PUBLIC_API_URL=https://semli.app`, plus `SENTRY_AUTH_TOKEN` so EAS uploads source maps and dSYMs to the `semli-mobile` Sentry project. Re-push after a key changes: `npx eas-cli env:push --environment production --environment preview --path <file>`.
- [ ] Web host env: `SUPABASE_URL`, `SUPABASE_KEY`, `REVENUECAT_SECRET_KEY`, `ANTHROPIC_API_KEY`.
- [ ] Supabase: anonymous sign-ins on (off as of Oct 20), all three migrations run. Done Oct 20: Resend SMTP on (dashboard), code email templates pushed from `supabase/config.toml`, Site URL `https://semli.app`. See `supabase/templates/README.md`.
- [ ] One sandbox purchase per term works, Restore works, the trial shows as a trial in RevenueCat.
- [ ] A reminder fired on a real phone; a Canvas feed synced on a real phone.
- [ ] `APP_STORE_LIVE = true` in `apps/web/lib/site.ts` once approved, so the site's "Get the app" links to the store.

**Sign in with Apple (Oct 20).** Native Apple sign-in is implemented alongside Google on welcome, login and signup. Before submission, enable the App ID capability and Supabase Apple provider (`app.semli.mobile`), build a new binary, and verify a real-device sign-in with Hide My Email. Setup and the remaining account-deletion revocation check are in [supabase.md](supabase.md#sign-in-with-apple-oct-20-2026).
