# Beta copy, ready to paste

Oct 20, 2026. Copy for the steps in [marketing-500.md](marketing-500.md). Rules for all of it: no founder name or face, say "more than 50" survey respondents, never the exact count in public, never name a vendor. There are two separate TestFlight links: **Survey has a 60-person cap for the 58 survey respondents; public Beta has a 200-person cap.** Use "200 beta spots" only in public Beta outreach. Survey emails use their own invite and do not advertise the public group's spots. Replace `LINK` in public outreach with `https://semli.app/beta?r=<source>`, which logs the click and forwards to the Beta group's TestFlight link `https://testflight.apple.com/join/j15Rp5m4` (cap 200) once `TESTFLIGHT_URL` is set on Vercel so every channel shows up in the referral leaderboard (`select ref, count(*) from waitlist group by ref`).

| Where | `r=` tag |
| --- | --- |
| Survey email | none: use the Survey group's own TestFlight link, `https://testflight.apple.com/join/vG3RD6EJ` (capped at 60 for 58 addresses) |
| Reddit, one per subreddit | `reddit-<sub>`, e.g. `reddit-studentnurse` |
| Discord | `discord-<server>` |
| Creator | `<handle>` |
| Brand TikTok and Instagram bio | `tiktok`, `ig` |

## 1. Survey email (week 1, before anything else)

From your own address, plain text, one recipient per email or BCC. Send only once that link stops saying "This beta isn't accepting any new testers" (Oct 20, 2026 it still did: the build needs Beta App Review approval and must be added to the Survey group). The roughly 60 survey addresses are already in the `waitlist` table. Before sending, give those rows `ref = 'survey'` so they stay apart from people who sign up on the site.

These people did not sign up on the site; they were added from the survey. So don't count them in the public waitlist number in posts. Use `select count(*) from waitlist where ref is distinct from 'survey'` for that.

**Subject:** An update on that student planner survey

> Hi,
>
> Earlier this year, you filled out my survey about keeping track of classes and work. Thanks again for doing that.
>
> I've been working on an app called Semli since then, and it's ready for you to try. You can add a syllabus PDF or a screenshot of your work schedule, check the dates it picks up, and save them to one calendar.
>
> I set up a separate testing group for everyone who answered the survey. Here's your iPhone invite:
>
> https://testflight.apple.com/join/vG3RD6EJ
>
> It's free to test through TestFlight. If you give it a try, let me know what works and what doesn't. You can reply right here, especially if it gets a date wrong or something feels confusing.
>
> Your answers helped me figure out what to build. I'd love to hear what you think of it.

## 2. Reddit founder post (one per subreddit, ever; Tuesday evening)

Post from the pseudonymous account. Attach the Today screenshot (`design/screenshots/03-today-mon.png`). Change only the first line per subreddit.

**Title:** I built an iPhone planner that reads syllabi and work schedules. Looking for students to try it.

> *(r/StudentNurse first line)* If you're keeping track of clinicals, classes and work shifts, I'd like to hear how you manage it.
> *(r/college first line)* I'm building a planner for students whose deadlines and work schedules are scattered across a bunch of places.
> *(r/GetStudying first line)* A planner only helps if you actually put your deadlines in it. I'm trying to make that part easier.
> *(r/sideproject and r/iosapps first line)* I've been building an iPhone planner on my own, and it's ready for some outside feedback.
>
> Earlier this year, I surveyed more than 50 college students about how they keep track of school and work. 83% said they'd missed or nearly missed an assignment because it got buried somewhere.
>
> That helped me decide what to build: Semli. You add a syllabus PDF, a screenshot of your shifts, or a message from class. It picks out the dates so you can check them before saving anything. Then you can see what's coming up and where work overlaps with class.
>
> The calendar, to-dos, reminders, overlap warnings and three imports a month are free. Plus adds unlimited imports and keeps Canvas in sync.
>
> It's still early. There's no Android app, web planner, or two-way sync with Google or Apple Calendar yet.
>
> If you'd like to try it on iPhone, there are 200 beta spots: LINK
>
> I'll be around in the comments over the next couple of days. What usually makes you stop using a planner?

Reply to every comment for 48 hours. Don't repost to the same subreddit.

## 3. Discord (study servers, self-promo or feedback channel only)

Attach one clip from `design/clips/out/` (the syllabus one).

> Hey, I've been building an iPhone planner called Semli for students who also work. You can add a syllabus or a screenshot of your shifts, check the dates it finds, and put them on one calendar. It also flags overlaps between work and class.
>
> I'm looking for people to try it with their actual schedules, especially if you're juggling clinicals or a job. It's free to test, with 200 beta spots: LINK
>
> If you try it, let me know what gets confusing or what you'd want it to do differently.

## 4. Creator DM (nursing and study creators, 5k to 50k followers)

> Hey! I built an iPhone planner called Semli. It takes dates from a syllabus or work schedule so you don't have to enter them all by hand.
>
> Would you be interested in making a paid video trying it with one of your own syllabi or schedules? No script. I'd just want you to show how it goes and say what you think.
>
> The offer is $75 when the video goes live, plus a year of Semli Plus. I'd also ask you to put the beta link in your bio. Happy to send you an invite so you can try it before deciding.

Pay on publish. Two in November, two the week of Jan 5.

## 5. Friday build-in-public post (brand account, text only)

Pick one each week:

> [installs] people have tried Semli so far. This week I fixed [one real bug and what it was doing]. Most people are starting with [kind of import]. If you've tried it, how did yours go?

> Someone tried adding [a real, unexpected type of schedule] to Semli this week. It picked up [x] of the [y] items. It missed [what it missed], so I'm working on [the actual next fix].

> There are [verified remaining spots] of the 200 beta spots left. If you've been meaning to try Semli with your class or work schedule, here's the invite: LINK

Use real numbers from the Monday funnel. Check remaining spots in the public Beta TestFlight group; total installs include the separate Survey group. Only mention a fix you're actually working on, and leave out anything that could identify a tester. Never invent a number.

## 6. TestFlight fields (already in App Store Connect doc)

Beta App Description and What to Test are in [app-store-connect.md](app-store-connect.md#L245). Use the review account `review@semli.app` for Beta App Review sign-in.
