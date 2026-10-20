# Marketing on $500: beta recruiting and hype

Status: Oct 20, 2026. Replaces the $2,000 budget in [launch-guide.md](launch-guide.md) §4.4 for the beta. Positioning, channels and rules stay as written there; this doc is what to do with $500 and the next three weeks. Numbers to watch are in §4.5 of the launch guide.

## 1. The one constraint

The beta exists to run the purchase test in [strategy.md](strategy.md) §2: 50 engaged testers, the real trial, the real price, 10 or more subscribe. Nothing below gives testers free Plus, because a tester who got Plus free tells us nothing. Free Plus goes only to the people who bring testers (ambassadors, creators).

Paid acquisition is off during the beta. 50 testers come by hand. The money goes to people who recruit, and to a small ads test at public release.

## 2. The $500

| Line | Amount | Paid when | What it buys |
|---|---|---|---|
| Ambassadors, 3 × $50 | $150 | After 25 installs each, tracked by their link | One per nursing cohort or program; they post in the cohort GroupMe and hand out the QR. They also get Plus free for a year (no cash cost). |
| Creator videos, 2 × $75 | $150 | On publish | Two nursing or study micro-creators (5k to 50k). No script; show a real syllabus import. Plus free for a year. |
| Print | $40 | Week 1 | 100 half-page flyers with the QR, 50 stickers for laptops. Nursing building, library, the student union. |
| Interview thanks, 5 × $10 | $50 | Weeks 4 to 5 | Coffee cards for five 20-minute calls with testers who hit the paywall. |
| Apple Search Ads test | $100 | Public release only | Exact match on `mystudylife`, `my study life`, `student planner`. Stop at $100 and read the cost per trial. |
| Buffer | $10 | | Domain renewal or a second print run. |

Everything else is free: TestFlight public link, waitlist on semli.app, Reddit, TikTok, Product Hunt coming-soon page, campus paper, App Store offer codes.

## 3. Start this week: securing TestFlight users

In order. Each one is a day or less.

1. **Waitlist on semli.app.** One field, one button: "Get the TestFlight link". Store the email in Supabase (a `waitlist` table, no auth). The count is the hype number for every post from here on. Mail everyone the link the day the external build clears Beta App Review.
2. **Public TestFlight link.** Group "Beta Oct 2026", public link, cap 200, What to Test text from [launch-guide.md](launch-guide.md) §1.5. Put the link behind `semli.app/beta` so the QR never changes. Add `?r=name` for each ambassador and creator; the site logs it to PostHog before redirecting.
3. **Recruit the first 20 by hand.** Your own classes, the nursing cohort chat, two study groups. Message, three sentences: "I built a planner that reads your syllabus and tells you what matters today. Beta is open, 200 spots, link here. Tell me what breaks." Attach a 15-second screen recording of a syllabus becoming a semester. Target 20 installs before any public post, so the public posts land on a live product with real users.
4. **Pick the three ambassadors.** One sophomore or junior per cohort, the person who already runs the group chat. Give them the message, the video, the QR, and their link. Pay $50 at 25 installs.
5. **Scarcity that is true.** The TestFlight cap is 200. Say "200 beta spots" everywhere, and post the count as it fills. When it fills, the waitlist stays open for the public release.
6. **Referral with no cash.** App Store offer codes are free to create. A tester who brings three friends (their link, three installs) gets a one-time code for a free semester of Plus, sent after the purchase test window closes so it does not pollute the test.

## 4. Start this week: hype

Posts are from your own account, as the founder, with the survey as the hook. One post per subreddit, ever. Reply to every comment.

| Day | Where | What |
|---|---|---|
| Mon | TikTok, Reels, X | The transformation clip: messy syllabus PDF, tap, the semester appears. Caption: "set up my whole semester in 2 minutes. beta link in bio, 200 spots." Repost weekly with a new syllabus or a work schedule. |
| Tue | r/StudentNurse, r/sideproject | Founder post: "I surveyed 66 students, 83% had missed an assignment because it got buried, so I built this. Beta open, honest list of what is not built yet." Screenshot of Today. Link to the intent page, not the home page. |
| Wed | Product Hunt | Coming-soon page. Collects followers for launch day at public release. Zero effort after setup. |
| Thu | Campus paper, nursing program newsletter | 200-word pitch plus one screenshot: a student built a planner, 66-student survey, beta open to the campus first. |
| Fri | r/college | Second founder post. Different angle: "MyStudyLife is at 1.6 stars right now; here is what I did differently" with the free-tier promise (calendar, to-dos, reminders, repeating classes always free). |
| Every week | Your account | One build-in-public post: a number (waitlist, installs, first imports), one thing testers broke, one thing shipped. |

Content to prepare once and reuse: the 15-second clip, the Today screenshot, the survey numbers card (83% missed, 71% Canvas, 68% focus problem), a "switching from MyStudyLife" clip that shows the two-minute setup against their two-hour complaint.

## 5. What good looks like by week 3

| Number | Target |
|---|---|
| Waitlist | 150 |
| TestFlight installs | 50, with 20 from direct asks |
| First import within a day of install | 60% |
| Testers who reach the paywall | 30 |

If installs are under 25 by day 10, the message is wrong, not the channel: rewrite it around the missed-assignment line and send it again to the same groups. If installs are fine and first imports are low, stop recruiting and fix onboarding before spending another dollar.

## 6. Not now

Apple Search Ads before public release, Instagram ads, Google Ads, paid creators beyond two, any giveaway that hands testers free Plus, paying for reviews or upvotes.
