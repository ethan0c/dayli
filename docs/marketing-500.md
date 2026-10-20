# Marketing on $500: beta recruiting and hype

Status: Oct 20, 2026. Replaces the $2,000 budget in [launch-guide.md](launch-guide.md) §4.4 for the beta. Positioning, channels and rules stay as written there. Numbers to watch are in §4.5 of the launch guide.

## 1. The constraints this plan is built for

- **Nobody is on campus until Jan 11, 2027**, and the campus is a liberal arts college of about 4,000. Campus-by-hand recruiting is a January tactic, and it can only ever be one campus. The beta has to be recruited online.
- **The founder is not the face.** No talking-head video, no name on posts. Everything is screen recordings, captions, a brand account, and a pseudonymous founder account on Reddit. The faces in this campaign are paid creators.
- **About three hours a week.** Full-time job plus two other businesses. The plan front-loads one four-hour setup, then runs on two to three hours a week, most of it replying.
- **No tester gets free Plus.** The beta exists to run the purchase test in [strategy.md](strategy.md) §2 (50 engaged testers, real trial, real price, 10 or more subscribe). Free Plus goes only to people who bring testers.

One honest note on timing: a beta that runs Nov to Dec hits finals and the break. It tests the monthly plan and the product. The semester plan gets its real test in January, and that is the moment every post, creator video and dollar should point at.

## 2. The $500

| Line | Amount | Paid when | What it buys |
|---|---|---|---|
| Creator videos, 4 × $75 | $300 | On publish | Nursing and study micro-creators (5k to 50k). They are the face. No script; one real import on screen; beta link in bio. Plus free for a year. Two in November, two the week of Jan 5. |
| January campus push | $150 | Jan 11 onward | Two ambassadors at $50 after 25 installs, plus $50 of flyers and stickers for the nursing building and library. |
| Interview thanks, 5 × $10 | $50 | When testers hit the paywall | Coffee cards for five 20-minute calls. |

Apple Search Ads are out of this budget. Start them from the first subscription revenue, at public release, exact match on competitor terms.

Everything else is free: TestFlight public link, waitlist on semli.app, Reddit, Discord, Product Hunt coming-soon page, App Store offer codes, a brand TikTok account with scheduled posts.

## 3. One-time setup, about four hours

1. **Waitlist on semli.app.** Done: one field in the hero and a `#beta` section, "Get the TestFlight link". Rows land in the `waitlist` table (migration `20261020100000_waitlist.sql`; the site needs `SUPABASE_URL` and `SUPABASE_KEY`, which it already has for imports). The count is the number in every post: `select count(*) from waitlist`.
2. **Public TestFlight link.** Group "Beta Oct 2026", public link, cap 200. `semli.app/beta` is live and goes to the waitlist until `TESTFLIGHT_URL` is set on Vercel, then to TestFlight. `?r=name` on it names the creator or ambassador; clicks go to `beta_clicks` and a signup keeps the tag, so `select ref, count(*) from waitlist group by ref` is the leaderboard.
3. **Eight faceless clips, made from the simulator.** Done: `design/clips/out/` holds them, 1080×1920, captions and an end card, no voice. Shifts, syllabus, update, today, plan, ask (the review's question for the shift with no time), switch (the two-minute setup, for the MyStudyLife angle) and free (the paywall's always-free line). Re-record with `design/clips/record.sh` and re-caption with `design/clips/compose.py`; the demo runs by itself, no taps.
4. **A brand TikTok and Instagram account**, not a personal one. Schedule all eight clips through the built-in schedulers, one a week. After this step the video channel costs zero hours until January.
5. **Product Hunt coming-soon page.** Collects followers for the public release. Zero effort afterwards.
6. **The founder post, written once.** "I surveyed more than 50 students; 83% had missed an assignment because it got buried, so I built a planner that reads the syllabus. Beta open, 200 spots, here is what is not built yet." Screenshot of Today. Reused across subreddits with the first paragraph adjusted.

## 4. Where the 50 testers come from, online

In order of expected yield.

0. **The 66 survey respondents.** They answered in Jan to Mar 2026, 83% said they had missed an assignment, and their emails are in the original form responses (stripped from the PDF in the repo; keep it that way). One email, from you, the week the public TestFlight link clears: "You took my survey in the spring. I built the thing. 200 beta spots, here is the link." Expect 15 to 25 installs from this alone, and they are the warmest testers you will ever have. Send it before any Reddit post.
1. **Creators (two in November).** Each video with a beta link in bio should bring 10 to 30 installs. This is the main channel, and it is the one that needs no founder face or time beyond two DMs and one payment.
2. **Reddit founder posts**, one per subreddit, ever: r/StudentNurse, r/college, r/GetStudying, r/sideproject, r/iosapps. Post Tuesday evening, reply to every comment for 48 hours. Thirty minutes to post, an hour of replies spread over two days.
3. **Discord.** The large study servers (Study Together, nursing student servers) have a self-promo or feedback channel. One post each, same text, with the clip attached. Read the rules first.
4. **Competitor refugees.** MyStudyLife sits at 1.6 stars right now. Answer "what should I switch to" threads on r/college and r/StudentNurse with a real answer and one line about the beta. This is the ongoing Reddit work, 20 minutes a week.
5. **Referral with no cash.** A tester who brings three friends gets a one-time App Store offer code for a free semester of Plus, sent after the purchase test window closes.

Scarcity that is true: the TestFlight cap is 200. Say "200 beta spots" everywhere and post the count as it fills.

## 5. The weekly three hours, Nov through Dec

| When | Minutes | What |
|---|---|---|
| Monday | 20 | Read the funnel: waitlist, installs, first imports, paywall views, trials. |
| Tuesday | 30 | Week 1: the survey email. Weeks 2 to 6: one founder post or one Discord post each; after that, none. |
| Wed to Thu | 60 | Reply to comments and tester messages. |
| Friday | 20 | One build-in-public post on the brand account: a number, a bug, a ship. Text only. |
| Any day | 30 | DM one creator, or answer one "which planner" thread. |

The clips post themselves. If a week only has 90 minutes, do Monday and the replies.

## 6. January 11: the semester push

The two weeks before classes are when students buy a semester plan, at every campus, not just yours. Everything in November and December is building the list for this.

- Jan 5: the two January creator videos go live. One email to the waitlist: "Semester starts next week, set it up in two minutes."
- Jan 5: public release and Product Hunt launch, if the purchase test passed.
- Jan 11: flyers and stickers go up on campus, the two ambassadors start, with the semester plan as the ask.
- Second email to the waitlist on day one of classes.

## 7. What good looks like

| Number | By Dec 15 | By Jan 20 |
|---|---|---|
| Waitlist | 150 | 400 |
| TestFlight installs | 50 | 150 |
| First import within a day of install | 60% | 60% |
| Paying | 10 of the first 50 testers | the semester plan selling |

If installs are under 25 by mid-November, the message is wrong, not the channel: rewrite around the missed-assignment line and run the same posts again. If installs are fine and first imports are low, stop recruiting and fix onboarding.

## 8. Not now

A personal account, talking-head video, daily posting, Apple Search Ads before revenue, any giveaway that hands testers free Plus, paying for reviews or upvotes, Instagram or Google ads.
