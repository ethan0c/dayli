# Website review and the new layout

October 19, 2026. What the competitors' sites do, what ours does today, and the page we build next. The board is on the review canvas, row 13. Rules from `docs/design-system.md` apply to the site too: one accent, no tinted cards, charts over lists, sentence case.

## What the competitors' sites do (checked Oct 19, 2026)

| Site | Hero | Proof | Pricing on the page | What to borrow |
|---|---|---|---|---|
| Structured | "your all in one day planner", phone with the timeline, "Start planning for free!" | 15M+ downloads, 400K+ 5-star reviews, press logos, team grid | None, FAQ says it's free | One visual idea carries the whole page (the timeline). Lowercase, short copy. |
| MyStudyLife | "The free student planner that keeps school life organised", phone mockup, "Open the web app" + store badges | 10M+ students, 187 countries, 4.7 rating, six press names, four named student quotes | None, "free" eleven times | Says "free" everywhere. Integrations row (Google, Apple, Canvas). |
| Tiimo | "A visual AI planner built for real life", device collage | Apple App of the Year, press and award marks, "half a million people", five reviews | FAQ only: free tier, 7-day Pro trial | Warm second-person copy, one feature per block with a screenshot. |
| Shovel | "Finally, A Study Planner That Gets You", lifestyle photo | A heading that promises reviews, none shown | Monthly and yearly cards with trial, on the page | Syllabus upload and "due dates into do dates" is the story. Prices in the open. |
| DormWay | "Make College Yours.", syllabus card, "Sign up free" + "Upload a syllabus" | Three named students, founder note | "Core is free, Pro in development" | Closest to us: syllabus import, web first, "links back to the source" as trust. Academic-integrity line. |
| Motion | "Get an unfair advantage by using AI to double productivity" | 1M users, logos, case studies | None, trial framing | Nothing. Wrong register for students. |
| Notion Calendar | "It's time.", looping product video | Integration logos | Free | A product video in the hero beats a static mockup. |

Patterns every one of them follows: headline + device + free CTA, a proof band, alternating feature blocks with a screenshot each, reviews, FAQ, closing CTA. Nobody shows the product doing its thing on the page. We already have that (the try-it box) and bury it under the fold.

Direct competitors on the import itself: DormWay (web, free, Canvas), Shovel (paid, syllabus PDF), Semora (new iPhone syllabus scanner, April 2026). None show a work schedule, none diff a new schedule against the old, none draw the week as a chart.

## What our site does today

- The hero phone is the old app: clock header, week strip, tinted chips per category, a three-tab pill. It no longer matches the product.
- Category tints (`--school`, `--work`, `--personal`) color rows and chips on the site and in the try-it results. The app dropped those; color is meaning only.
- The headline's second line is in the accent. Accent on headings is off the allowed list.
- The try-it result is a list of chip rows. The app's review is a big number plus a chart.
- No proof at all. We have a real survey (`docs/pricing-and-positioning.md`): 83% missed an assignment because it got buried, 73% get dates outside Canvas, 65% want phone reminders. Honest numbers beat a reviews heading with nothing under it (Shovel).
- The three SEO landing pages and pricing are fine structurally; their previews need the new look.
- What works and stays: the try-it box, the privacy line, student pricing on the honor system, the small footer.

## The new landing page

Desktop 1280 with 64 gutters, phone width stacks to one column. Geist, paper and ink, one accent in text links and the word Plus.

1. **Header.** Wordmark, Pricing, "Try it" text link, "Get the app" ink pill (App Store link once live; until then it scrolls to the demo).
2. **Hero.** Left: eyebrow "The daily planner for college students", H1 "Your week, already organized.", sub "Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.", primary "Try it with your schedule", secondary "Get the iPhone app". Right: the real Today screen in the phone (countdown, day bar, rows with pills, five-tab bar) with a schedule screenshot behind it fading into the page, the way the Moment header fades.
3. **Try it, right under the hero.** The same box, result drawn like the app's review: "7 shifts" as the big number, the week as seven day bars, rows only for what needs a time. Caption: nothing is stored.
4. **Proof band.** Three numbers from the survey with their questions, and "66 students, spring 2026" under them. No invented counts.
5. **How it works.** Three phones: Add (recent screenshots), Review (week chart, "7 shifts"), Plan right after (Undo toast). One line each.
6. **The week is a chart.** Plan with the week header beside Today by the hour. Copy: the same timeline at three zooms.
7. **New schedule, only the changes.** The update review: "4 changes", green new, red dropped, "Keep it".
8. **A syllabus becomes the term.** Syllabus review (term line, "Until when?") beside the School map.
9. **Pricing teaser.** Free forever with 3 imports a month, Plus from $2.50 a month for students, "See pricing".
10. **FAQ.** Five questions: what can I send, can I check first, is it kept, what's free, Android.
11. **Closing CTA.** "One less thing to keep in your head." and the two buttons.
12. **Footer.** As now.

Copy rules: second person, present tense, no exclamation marks, no "AI" in headings (it's in the FAQ and the pricing rows where it means something), sentence case.

## Build notes

- Replace `PlanScreen` in `apps/web/app/page.tsx` with a `TodayScreen` drawn from the app's tokens, and reuse one CSS phone for every screen on the page.
- Port `WeekChart` and `TermLine` to CSS for the try-it result and the feature blocks.
- Remove the category tint variables from `globals.css`; keep the status colors.
- Keep `LandingPage.tsx` for the SEO pages; swap their previews for the same phone components.
