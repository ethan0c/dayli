# Onboarding research: what converts, and what Semli should do

Status: Oct 19, 2026. Sources: RevenueCat and Adapty 2026 benchmark reports (via their own posts and third-party summaries), published teardowns of Duolingo, Blinkist, Tiimo, Finch, and Sunsama, and vendor data on notification priming. Numbers from vendor blogs are directional; the ones to trust most are the ones that agree across sources.

## 1. What the data says

### 1.1 Value before commitment, but the sale still happens on day 0
- Duolingo moved sign-up back a few steps so people did a lesson first: **~20% more daily actives**. A hard sign-up wall later still worked, but only because the optional "Later" soft walls had primed it ([First Round interview](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker), [Taplytics summary](https://taplytics.com/blog/duolingo-ab-test-onboarding)).
- Adapty 2026: paywalls shown after a "value moment" start trials at **~2.1× the rate** of an immediate hard paywall (65% vs 31% in their sample) ([RocketShip summary](https://www.rocketshiphq.com/adapty-subscription-app-benchmark-2025-summary/)).
- And yet: Adapty reports **93% of first purchases happen on install day**, and onboarding paywalls convert views at **0.85%** vs **0.23%** for paywalls shown later ([Adapty State of Paywalls 2026](https://adapty.io/state-of-paywalls/)). RevenueCat: about a third of paid conversions on install day ([ARPU Brothers summary](https://arpubrothers.com/blog/revenuecat-subscription-app-report-2026/)).

Reading: the paywall belongs **inside the first session, after the first real result**, not before it and not days later.

### 1.2 Hard paywall vs freemium
- RevenueCat 2026: median download-to-paid by day 35 is **~10.7% with a hard paywall vs ~2.1% freemium**; revenue per install by day 60 ~$3.09 vs ~$0.38. Year-one retention is the same (~27% vs ~28%), so the paywall type changes when money arrives, not how long people stay ([RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026), [Strataigize](https://www.strataigize.com/insights/paywall-conversion-benchmarks-2026/)).
- The hard-paywall edge is shrinking year over year (12.1% → 10.7%).

Reading: we chose freemium on purpose (ASO, Structured's paywall complaints, basics-free positioning). The data says the cost of that choice is real. The compromise with the best evidence behind it: a **trial offer at the value moment with a visible but secondary free path**, and an A/B test of a true hard paywall for a slice of traffic once the beta is paying.

### 1.3 Trials: be transparent, remind before the charge, hook day 1
- Blinkist added a trial timeline to the paywall ("today: full access · day 5: we remind you · day 7: you're charged") and actually sent the day-5 reminder: **+23% trial starts**, more subscriptions overall, with a slightly lower trial-to-paid rate ([Purchasely](https://www.purchasely.com/blog/blinkist-paywall-transformation-revolutionizes-app-user-engagement), [case study](https://onboardme.substack.com/p/why-most-free-trials-fail-and-how-blinkist-gets-it-right), [indie replication](https://nemecek.be/blog/205/my-experience-with-the-blinkist-trial-big-boost)).
- RevenueCat 2026: **over half of trial cancellations happen on day 0** ([Sub Club](https://www.iheart.com/podcast/269-sub-club-by-revenuecat-81796455/episode/the-2026-state-of-subscription-apps-325838853/)). A trial with nothing scheduled for tomorrow is cancelled tonight.
- Longer trials convert better in the benchmarks (17–32 days: ~42% vs under 4 days: ~25%), but most apps are shortening trials. For a student planner the 7-day trial is right: a week is one schedule cycle.

Reading: show the timeline on the paywall, send the day-5 reminder ourselves (we have local notifications), and make sure something useful is scheduled for tomorrow morning the moment a trial starts (the briefing).

### 1.4 Permission prompts: prime, ask after value, protect the one shot
- Declining the iOS notification prompt is effectively permanent. 48–63% of top apps show a custom priming screen before it ([Lazyweb sample, July 2026](https://www.lazyweb.com/research/percent-apps-priming-screen-before-ios-notification-prompt.md)). Vendors claim 2–3× opt-in with priming and timing after a value moment, in the 55–70% range vs 30–45% without ([Plotline](https://www.plotline.so/blog/how-to-improve-push-notification-opt-in-rates), [Batch](https://doc.batch.com/guides-and-best-practices/orchestration/how-to-improve-the-push-opt-in-rate)).

Reading: never during onboarding screens. Our own sheet after the first confirmed import ("Want a heads-up before shifts and deadlines?"), with "Not now" that costs nothing, then the system prompt only on yes.

### 1.5 Personalization quizzes and length
- Adapty: productivity-app quiz funnels run **5–15 screens**; target onboarding completion is **60–80%** ([Adapty](https://adapty.io/onboarding-builder/)). One question per screen with auto-advance keeps momentum; multi-question forms stall.
- Tiimo moved account creation from just-before-the-paywall to just-after-welcome and lifted both account creation and trial starts ([Retention.Blog](https://www.retention.blog/p/app-of-the-year-tiimo)). We have no accounts, which removes a wall entirely; when accounts arrive in phase 2, this is where they go.
- Finch pre-fills goals so the first "aha" is a few taps away, and puts a shuffle button next to the name field so nobody stalls on a blank ([Finch teardown](https://medium.com/@deepthi.aipm/ux-teardown-finch-self-care-app-18122357fae7), [Retention.Blog](https://www.retention.blog/p/life-of-a-birb)).
- Sunsama runs its guided planning ritual on the next two days before dropping people into the full app ([Sunsama docs](https://help.sunsama.com/docs/daily-planning)).

Reading: our "about you" step should be three quick screens, not one form; the sample week stays as the pre-filled fallback; the briefing is our day-2 ritual.

## 2. Where Semli's current flow stands

| Current step | Keeps | Changes |
|---|---|---|
| 0 Welcome (wordmark, tagline) | Yes | Add "Takes a minute. No account." |
| 1 About you (name, role, major, chips on one screen) | Content yes | Split into 3 one-tap screens; name becomes optional and last |
| 2 Demo (typed message → rows) | Yes, it is fast | Follow it with the real thing |
| 3 Pricing (plans, honor toggle) | Content yes | **Move after the first import**; add the trial timeline; "Continue free" visible |
| 4 Done (sample or own) | Replace | The first import *is* the finish; sample week becomes the fallback inside the import step |
| Permission ask: system prompt right after first commit | Timing yes | Add the priming sheet first |

The biggest gap: today the first real import happens *after* onboarding, so the day-0 value moment and the paywall are not in the same session for most people.

## 3. Recommended flow, v2

Nine screens, ~90 seconds without the import, one real result before any ask.

| # | Screen | Copy | Notes |
|---|---|---|---|
| 0 | Welcome | "The daily planner for college students." · "Takes a minute. No account." | Wordmark animation stays |
| 1 | You are | Student · Student with a job · Working | One tap, auto-advance |
| 2 | Studying | 9 fields | Only if student; one tap, auto-advance |
| 3 | Your week | chips (profile-aware) + optional first name | "Next" |
| 4 | Watch it work | the typed-message demo | 6 s, then "Now try yours" |
| 5 | **Bring your own** | "Paste what's coming up, or add a screenshot of your schedule." Text box, Screenshot, PDF. Secondary: "Use a sample week instead." | Real extraction, `Reading…` state; errors fall back to the sample |
| 6 | Review | existing review sheet | Confirm = the aha moment; toast "Added 4 things." |
| 7 | Heads-up? | "Want a reminder before shifts and deadlines, and a short note each morning?" · Yes · Not now | Our sheet; system prompt only on Yes. Skipped if "Use a sample week" was chosen (ask later, after their first real import) |
| 8 | Plus | existing paywall + **trial timeline** ("Today: everything. Day 5: a reminder. Day 7: $14.99/semester") + honor toggle + **"Continue free · 3 imports a month"** | Then Today with a "You're set" toast |

Day 1 and 2 (the Sunsama ritual, automated): the morning briefing is scheduled the moment onboarding ends; if a trial started, a day-5 reminder is scheduled from RevenueCat's expiration date; day 2's briefing ends with "Tomorrow: 2 things. Anything to add?" deep-linking to capture.

## 4. What to measure and test

Funnel (PostHog events already exist for most of these): welcome → you are → week → demo → own import started → import succeeded → review committed → heads-up yes → paywall shown → trial started → day-2 open → day-7 paid.

Targets to beat before judging the flow: onboarding completion ≥70% (Adapty's upper band), first import inside onboarding ≥50%, notification opt-in ≥60%, trial start among importers ≥30%, trial-to-paid ≥25%.

A/B tests, in order of expected effect:
1. Paywall after the first import (v2) vs at the end of the questions (current).
2. Trial timeline + day-5 reminder on vs off.
3. "Continue free" visible vs a true hard paywall (expect more revenue, fewer users; decide with retention equal).
4. Sample week as the default on step 5 vs "bring your own" as the default.
5. Three one-tap screens vs the one-form "about you".

## 5. What it costs to build
Onboarding restructure (steps 1–3 split, step 5 with capture embedded, step 7 priming sheet, step 8 timeline and free path): about a day. Trial day-5 reminder from RevenueCat's `expirationDate`: an hour on top of the existing reminder scheduler. Nothing new in the backend.
