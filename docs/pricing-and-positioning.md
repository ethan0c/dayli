# Semli — Positioning, pricing, platforms

Status: decided Oct 19, 2026 · Sources: the Jan–Mar 2026 student survey (66 responses, `docs/Student Survey (Responses) - dayli.pdf`) and competitor pricing checked Oct 2026.

## 1. Positioning

**Semli is the daily planner for college students.** Drop in a syllabus, a work schedule, or a text, and Semli tells you what matters today.

Why "daily planner" and not "life organizer" or "AI assistant":
- Students already search for "planner". Nobody searches for "life organizer".
- The survey's top pain is not storage, it's focus: 68% said their problem is *seeing too many tasks at once* and/or *not knowing what actually matters today*. A daily view that ranks the day is the product. The capture magic (screenshots, syllabi) is how it gets filled without effort.
- "For college students" is a real niche with real channels (campus orgs, nursing cohorts, TikTok study content). We can widen later.

One-liner for the store: *The daily planner that reads your syllabus so you don't have to.*

## 2. What the survey says (n = 66)

| Question | Result | What it means for Semli |
|---|---|---|
| Missed or almost missed an assignment because it got buried | **83%** yes (42% multiple times) | The core promise, "never miss one", is a felt problem |
| What's harder | 42% both · 32% too many tasks at once · 26% not knowing what matters today | Today screen must rank, not list |
| Classes use Canvas | **71%** Canvas; 15% a mix; 14% other LMS | Canvas sync is the #1 integration after launch |
| Assignments posted outside Canvas | **73%** at least occasionally (syllabus PDFs, Google Docs, textbook sites, email) | Why one feed matters; syllabus + screenshot import covers the gaps Canvas can't |
| Device for schoolwork | **65% laptop** · 24% both · 11% phone | Web is not optional (see §4) |
| Want phone reminders | **65% "yes, definitely"** · 26% sometimes · 9% no | Reminders stay free; they're retention |
| Weekly study hours | 30% 0–5 · 33% 5–10 · 21% 10–20 · 15% 20+ | Heaviest users (nursing, engineering) are the beta targets |
| Would pay if it reduced stress and prevented misses | **26% yes · 53% maybe · 21% no** | 79% are open; "maybe" converts with a free trial, not a pitch |
| What feels reasonable | **47% $1–5/mo** · 27% $5–10/mo · 20% nothing · 5% yearly · 2% $10–15 | Price inside $1–5 per month *as perceived*; annual billing makes $29.99 feel like $2.50 |
| Who answered | 33% sophomores, 33% juniors, 21% freshmen, 12% seniors; 18% nursing | Go after sophomores/juniors; nursing is over-represented and high-hours |

Caveats: convenience sample from one campus network, self-reported willingness to pay (treat 26% "yes" as the ceiling, not a forecast).

## 3. Competitors and their prices (checked Oct 2026)

| App | Free tier | Paid | Notes |
|---|---|---|---|
| Structured | Yes | $6.99/mo · **$29.99/yr** · $99.99 lifetime | The closest look-alike; no AI import. [source](https://habitbox.app/blog/structured-app-review), [pricing post](https://structured.app/blog/new-pricing) |
| MyStudyLife+ | Yes (ads, task limits) | $6.99/mo · **$39.99/yr** | The incumbent student planner. [App Store](https://apps.apple.com/us/app/my-study-life-school-planner/id910639339), [media page](https://mystudylife.com/media/) |
| Shovel | 7-day trial only | ~$9.79/mo · ~$35/yr | Study-time planner; sources conflict. [comparison](https://www.coursicle.com/blog/shovel-vs-coursicle/), [guide](https://dormway.app/blog/best-ai-study-planner-apps-2026) |
| Todoist Pro | Yes | $7/mo · $60/yr | General to-do app. [overview](https://cal.com/blog/planner-apps-for-students) |
| Motion | No | $19/mo annual, $29 monthly, 25% student discount | AI scheduling for professionals; too expensive for this market. [overview](https://mystudylife.com/best-ai-school-planner-apps-for-students-in-2026-free-paid/) |
| Notion | Free Plus for students | — | The "I'll build my own planner" alternative |
| Saturn | Free | Premium exists, price not published | High-school/college social calendar. [App Store](https://apppricinglab.com/app/apple/1454483188) |

Takeaway: the student planner market has settled at **$30–40 per year**, with monthly at $5–7. Nobody in this tier does AI import from screenshots and syllabi. That is the thing to charge for.

## 4. Platforms: iOS + web, no Android

- **iOS**: the phone is where reminders land and where schedule screenshots already live. Primary app.
- **Web**: required by the survey (89% use a laptop at least equally). But not a second codebase. The Expo app already runs on the web (`npx expo start --web`), same screens, same code. The Next.js site stays small: landing page, try-it, API, checkout.
- **Android**: dropped. Not in the plan, not in `app.json`. Revisit only if campus demand is loud.

## 5. Pricing (recommended)

### Free
Calendar, tasks, Today, reminders, repeating classes, manual add, **3 AI imports per month** (text, screenshot, or PDF). Enough to feel it work; not enough to run a semester. Never meter the basics: Structured's single loudest complaint (Oct 2026 reviews) is recurring events locked behind Pro. Say "always free" in the listing.

### Semli Plus
| Plan | Student | Regular | Student effective | Why |
|---|---|---|---|---|
| Monthly | **$4.99** | $7.99 | $4.99/mo | Sits at the top of the "$1–5" band; under Structured and MyStudyLife monthly |
| **Semester** | **$14.99** / 4 months | $24.99 | $3.75/mo | Matches how students think about time and money; the plan to push in-app |
| Yearly | **$29.99** | $49.99 | $2.50/mo | Matches Structured's anchor; the plan to push on web |

Student pricing is on the honor system. The toggle in onboarding says so plainly: we don't check IDs or .edu emails, we trust you, switch it off when you graduate. The regular price exists so the student price reads as a real discount (~40%) and so non-students (parents, grads, shift workers) have a way to pay.

Plus includes: unlimited AI imports, syllabus import, work-schedule diffing, and (later) Canvas sync and planning suggestions.

Rules:
- First import is free and *before* sign-up. The paywall appears after the first confirmed import, when the value is visible.
- 7-day free trial on every plan (converts the 53% "maybe").
- Sell yearly and semester plans through **web checkout** (allowed in the US since the 2025 Epic ruling) to avoid Apple's 15–30%. Keep monthly available in-app for impulse buys.
- Show "$2.50/month, billed yearly" style framing everywhere; the survey anchor is monthly.

### Unit economics
Claude Opus 5.5 at $4 / $20 per million tokens:
- Text message import ≈ $0.01–0.02
- Schedule screenshot ≈ $0.02–0.04
- 10-page syllabus PDF ≈ $0.08–0.15

A heavy Plus user (5 syllabi + 16 weekly schedule screenshots + 40 text adds per semester) costs roughly **$1.50 per semester** in AI. Against $14.99 per semester that is a ~90% gross margin. If costs ever matter, route short text imports to Haiku 5.5 after checking accuracy against the eval set; that is a product decision to make with data, not a default.

### What 1,000 paying students looks like
- All yearly on web: ~$29k/yr net of fees (~3%)
- All semester plans (2 per year): ~$28k/yr net on web, ~$21k if through Apple
- Realistic mix at 5% free-to-paid conversion needs ~20,000 free users. Campus-by-campus growth, nursing cohorts first.

## 6. Revenue checklist (in order)
1. Prove extraction on real screenshots and syllabi (the product promise).
2. Free-import-then-paywall flow in the app, with RevenueCat or StoreKit for in-app, Stripe on web.
3. Landing page: "the daily planner for college students" + try-it + student annual price.
4. Launch with 2–3 campus groups (nursing programs first), weekly interviews.
5. Canvas sync as the first paid-only feature after launch (71% of classes are on Canvas).
