# Strategy: goal, competition, and what we do about it

Status: Oct 19, 2026. Reconciles [goal.md](goal.md) and [structured.md](structured.md) (two outside memos) with our plan, plus review-mining data pulled from the App Store on Oct 19, 2026.

## 1. The goal, in our numbers

The goal memo targets **$20K MRR** and prices it at $5/month = 4,000 subscribers. Our actual price mix (see [pricing-and-positioning.md](pricing-and-positioning.md)) is lower per month because most students will take the semester or yearly plan:

| If the mix is… | Blended $/mo | Payers for $20K MRR |
|---|---|---|
| All monthly ($4.99) | $4.99 | 4,000 |
| Mostly semester ($14.99 / 4 mo) | $3.75 | 5,300 |
| Mostly yearly ($29.99) | $2.50 | 8,000 |
| Realistic mix (40/40/20) | ~$3.60 | ~5,600 |

So the honest target is **5–6k paying students**, or ~110–170k free users at a 3–5% conversion. That is 10–15 campuses at real penetration, not a viral hit. Plan acquisition campus by campus.

The memo's reading of the survey ("45 of 66 willing to pay") is off. The tallies from the CSV: **17 yes, 35 maybe, 14 no**. 17 firm yeses is the honest base; the 35 maybes are the trial's job.

## 2. The test that matters next

The goal memo is right that stated willingness is not purchasing. The test: **50 engaged testers, a short free trial, then the real $4.99 / $14.99 offer. 10–15 subscribers (20–30%) is a strong signal; 5 is still informative.**

That test is impossible today because buying is not switched on. Roadmap change: **in-app purchases (StoreKit via RevenueCat) move from "after launch" into milestone 9**, before TestFlight, so the beta measures payment, not opinions. Web checkout (Stripe) follows for the semester and yearly plans.

## 3. What the competitors' own users say (last 250 reviews each, Oct 2026)

| App | Recent avg | 1–3 star share | Top complaints |
|---|---|---|---|
| Structured | 4.08 | 25% | **Paywall** (recurring events locked behind Pro, "useless free version"), recurring/repeat handling, calendar sync |
| MyStudyLife | **1.62** | **92%** | Bugs (can't edit class times, changes don't save), **setup time** ("over 2 hours"), subscription, sync |
| Tiimo | 3.56 | 38% | Paywall, "the AI sucks", charged during free trial, notifications |

Three openings:
1. **The incumbent student planner is failing its users right now.** MyStudyLife's rating has cratered on bugs and setup friction. "Set up your semester in two minutes" is a direct answer to its most common complaint.
2. **Don't paywall the basics.** Structured's loudest complaint is that recurring events need Pro. Our free tier keeps calendar, to-dos, reminders, and repeating classes free; only AI imports are metered. Say that out loud in the listing.
3. **Make the AI accountable.** Tiimo's AI reviews are brutal because it acts without showing its work. Our review step with the evidence line ("read from: Fri 10/30 4:00p–10:00p") and nothing-saved-until-you-confirm is the differentiator. Also: never charge inside a trial without a reminder the day before.

## 4. Structured memo, point by point

| Memo says | Our position |
|---|---|
| Structured already has AI planning and scanning; don't just copy it | Agreed. Our wedge is the *semester* (syllabus → every deadline) and the *shift schedule diff*, which Structured doesn't do. |
| Ideal first-run: syllabus or Canvas → classes/deadlines → work screenshot → one calendar → conflicts and study suggestions | This is our onboarding and capture flow, minus Canvas (post-launch) and automated study suggestions (V1.1). Conflicts and overload warnings are built. |
| Win a specific student audience first (nursing, working students) | Agreed; it is the survey's heaviest-hours group and 18% of respondents. |
| Make importing the signature feature | Agreed; it is what the paywall meters, so it has to be the thing people feel. |
| Build an ASO/SEO engine on "student planner", "syllabus to calendar", "assignment tracker", "work school schedule planner" | Agreed. Website pages per query are cheap; the other session has the site. Name choice is tracked in [README.md](README.md). |
| Nav: Home, Calendar, School, You, one Add action | Built: Today, Plan, School, You, glass "+". |
| Student planner that expands, or life assistant with great student features? Memo leans life-assistant | We market as **the daily planner for college students** and keep the engine general (work shifts, personal items, any screenshot). Same thing in practice; the label is the only difference, and "student planner" is the searchable one. Revisit the label after the first 1,000 payers. |

## 5. What changes in the plan because of this
- Milestone 9 gains **purchases** (RevenueCat + StoreKit), trial with a day-before reminder, and the paywall after the first confirmed import.
- Beta exit criterion adds: **≥10 of 50 engaged testers subscribe** within two weeks of the trial ending.
- Store listing copy leads with the two findings: "Set up your semester in two minutes" and "Calendar, to-dos, reminders and repeating classes: always free."
- Keep a quarterly review-mining pass (the script lives in this session's notes; it is 40 lines against the App Store RSS feed) so we hear competitors' users before they do.
