# Welcome and paywall conversion

Research Oct 21, 2026, and what Semli does with it. Most vendor numbers are self-reported, so treat them as direction for A/B tests, not guarantees.

## Welcome screen

| Finding | Source | Semli |
|---|---|---|
| Delay sign-in; people abandon apps that ask for an account before anything useful. Duolingo moved sign-up after the first lesson and reported ~20% more daily actives. | [HIG, Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple), [Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding) | Built: one accent "Get started" pill (guest into onboarding), a muted "I have an account" link to log in, "Free to start. No account needed." |
| Sign in with Apple no smaller than other sign-in buttons; any Google sign-in needs it alongside (4.8). | [HIG](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple), [Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Sign in and sign up keep Apple, Google and email together. |
| Accounts can't be required for features that don't need one (5.1.1(v)). | Guidelines | The guest path stays the default. |

Built with it (Oct 21, 2026): You shows a guest "Back up your plan · Your plan is only on this iPhone"; after a sign-out the welcome offers "Continue as <name> · <provider>". Next: ask at the moment there is a plan worth saving (after the first confirmed import, or at a Plus purchase).

## Paywall

| Finding | Source | Semli |
|---|---|---|
| Paywall at the end of onboarding drives about half of trial starts; 82% of trials start on install day. Gates at locked features add more. | [RevenueCat guide](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps.md), [SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) | Both exist: onboarding step and the import, Canvas and alarm gates. |
| Hard paywalls convert more but refund more, and education refunds most; a soft close suits a freemium product. | SOSA 2025, [BoldVoice](https://www.revenuecat.com/blog/growth/anada-lakra-boldvoice-sub-club-podcast-2026), [Adapty](https://adapty.io/blog/markdown/paywall-experiments-playbook.md) | Soft: "Continue free" always visible, no countdown. |
| A trial timeline (today, reminder, charge day): Blinkist +23% trials, −55% complaints, reminder opt-in 6% → 74%. | [growth.design](https://growth.design/case-studies/trial-paywall-challenge) | Built. The reminder row promises the reminder once notifications are on and has a "Remind me" button that asks for them. Plus never depends on notifications. |
| Three plans beat two; yearly retains 44% after a year against 17% for monthly. | [Superwall](https://superwall.com/blog/how-many-products-should-you-offer-on-your-paywall), SOSA 2025 | Three plans. 6 months stays preselected (see the open decision below). |
| No free-trial on/off toggles (rejected since Jan 2026). | [RevenueCat](https://www.revenuecat.com/blog/growth/rip-toggle-paywall) | The student toggle is gone: pricing follows the onboarding answer, with a quiet "Not a student?" / "In college? See student prices" link. |
| "No commitment, cancel anytime" under the button: about +10%. | [Superwall](https://superwall.dev/blog/the-paywall-tactics-behind-usd100k-month-apps) | Built, then the full terms line. |
| The billed amount is the most prominent price; per-month and savings smaller; trial length and price after it shown; restore, terms and privacy reachable (3.1.2). | [Apple, Subscriptions](https://developer.apple.com/app-store/subscriptions/), Guidelines | The billed price is the `displayXl` number; Save % and per-month are small; Restore · Terms · Privacy under the button. |

## Open decisions

- **Pricing tie, resolved Oct 21, 2026.** 6 months and yearly used to cost the same per month ($2.50 student, $4.17 regular). Yearly is now $24.99 student ($2.08/mo) and $44.99 regular ($3.75/mo, the Education median), so it is the best deal and the paywall preselects it; 6 months stays as the lower upfront price.
- **Exit offer** after "Continue free" (yearly framed weekly, or a one-time discount): a later test.
- **Social proof** only if real (for example syllabi imported); no measured lift, and invented reviews are a rejection risk.
