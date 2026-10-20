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

Send through a Resend Broadcast to the Survey segment, using the branded [survey-invite.html](emails/survey-invite.html). Send only once the Survey invite accepts testers and installs the build. The link was not accepting testers at the earlier Oct 20 check; confirm it works before sending. Keep the survey rows tagged `ref = 'survey'` in the `waitlist` table so they stay apart from people who sign up on the site.

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

### Send it in Resend

Status, Oct 20, 2026: sender-domain setup and the Survey contact import are complete, as confirmed by you. The email template is prepared locally; no broadcast or email has been sent from this repo.

1. Create a Broadcast in Resend. Select the **Survey** segment and confirm the recipient count matches the imported list, allowing for unsubscribed or suppressed contacts. Leave public Beta contacts out of this campaign.
2. Use **Semli** as the sender name and your already verified sending address. Set Reply-To to `hello@semli.app` after confirming replies reach an inbox you monitor. Subject: **An update on that student planner survey**.
3. Open the editor's HTML code view and paste the complete contents of [survey-invite.html](emails/survey-invite.html). Per your preference, it contains no pictures: Semli is a text wordmark, with a cream `#FAF9F6` background, purple `#7057BD` HTML button, and email-safe font fallbacks. No image downloads or external fonts are needed. Keep the `{{{RESEND_UNSUBSCRIBE_URL}}}` token so Resend generates each recipient's unsubscribe link. Include your sender's postal address in the footer using Resend's editor; the local template does not contain one.
4. Send previews to your own test inboxes. Check the text branding, narrow-screen layout, Survey invite, and Reply-To. The unsubscribe token resolves through Resend, not in a local browser preview. Keep open and click tracking off for this initial send; open tracking would insert a hidden image even though the template has none. Confirm the campaign's sending domain has tracking off without changing account-email settings.
5. Once the Survey invite installs the build and the previews look right, review the recipient segment and send or schedule the Broadcast. Review delivery failures afterward. Send the gift-card winner their claim code separately using [survey-follow-up.txt](emails/survey-follow-up.txt).

Resend supports [editing raw HTML in the dashboard](https://resend.com/changelog/introducing-the-new-email-editor) and [automatic Broadcast unsubscribe links](https://resend.com/blog/broadcast-api). A browser preview checks layout; inbox placement and email-client rendering still need the real preview sends.

Image research, Oct 20, 2026: [SendGrid's content-rejection guidance](https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/bounce-and-block-classifications) warns about emails made mostly of images with little readable text; it does not say a small logo automatically causes spam placement. [Gmail's sender guidelines](https://support.google.com/mail/answer/81126?hl=en) emphasize authentication, sender identity, spam complaints, and unsubscribe handling. Removing images follows your preference and avoids reliance on image loading, but does not guarantee inbox placement. [Resend's tracking explanation](https://resend.com/blog/introducing-custom-tracking-domain) confirms that open tracking embeds a 1×1 image.

### Public icon URLs

The site already serves the brand icons. Both URLs were checked on Oct 20, 2026: HTTP 200, `image/png`, with downloaded files matching this repo. No sign-in or temporary URL is needed.

| Asset | Public URL | Source |
| --- | --- | --- |
| App icon | `https://www.semli.app/icon.png` | `apps/web/app/icon.png` |
| Apple touch icon | `https://www.semli.app/apple-icon.png` | `apps/web/app/apple-icon.png` |

Use these absolute HTTPS URLs if adding icons to a future email. The existing Supabase account-email templates already use the app icon URL. The current Survey invitation stays image-free; hosting an image on the site does not by itself prevent spam placement.

### Other email templates

All five drafts use the same image-free Semli layout as the Survey invitation. Each has a standalone HTML version for Resend's code editor and a plain-text version. The first line of each `.txt` file is the subject; paste the remaining text into the message body if using that version. These are prepared files, not scheduled emails or automated flows.

| Template | Files | Subject | Audience and timing |
| --- | --- | --- | --- |
| Public beta invitation | [HTML](emails/public-beta-invite.html) · [Text](emails/public-beta-invite.txt) | Your Semli beta invite is here | Website waitlist only, excluding Survey recipients. Send once the public Beta invite installs the approved build and that group has room. Uses the separate 200-person Beta link. |
| Tester check-in | [HTML](emails/tester-check-in.html) · [Text](emails/tester-check-in.txt) | How did your first Semli import go? | People confirmed to have started testing, from either group, about 3–5 days after they start. Send once; don't treat the full waitlist as installed testers. |
| Feedback thank-you | [HTML](emails/feedback-thank-you.html) · [Text](emails/feedback-thank-you.txt) | Thanks for the Semli feedback | A personal reply to the person who sent feedback. Send after reading their message, using your monitored inbox or a one-to-one email send. |
| App Store launch | [HTML](emails/app-store-launch.html) · [Text](emails/app-store-launch.txt) | Semli is now on the App Store | People subscribed to launch updates. Hold until the App Store listing is public and the download works in the intended regions. |
| Semester reminder | [HTML](emails/semester-reminder.html) · [Text](emails/semester-reminder.txt) | Got your new syllabus yet? | People subscribed to ongoing updates, near their semester start. This version uses the public App Store link, so send only after release. |

Use Resend Broadcasts for the public invite, tester check-in, launch, and semester reminder. Select the relevant segment each time and preserve unsubscribe and suppression status. Survey participation alone does not mean someone asked for ongoing updates. Deduplicate overlapping segments rather than sending two copies to the same person. Keep the same verified sender, monitored Reply-To, and tracking-off settings described above.

Before sending a Broadcast, replace `[SENDER_POSTAL_ADDRESS]` with the real sender address in its footer. Keep `{{{RESEND_UNSUBSCRIBE_URL}}}` intact for Resend to resolve. If copying the plain-text version into another mail tool, replace that token with the actual recipient-specific unsubscribe link; it is a Resend Broadcast token, not a working URL by itself.

For the feedback thank-you, replace `[FEEDBACK_SUMMARY]` with a short description of their feedback and `[PERSONAL_REPLY]` with your actual response. For example: "I can see how that would be confusing. Could you tell me which screen you were on when it happened?" If something is fixed, explain the real change and build number; otherwise, don't promise a fix or a deadline. Reply in the original thread when possible. This one-to-one reply has no Broadcast unsubscribe token and should not be sent as a campaign.

The launch and semester drafts use the App Store URL already configured in `apps/web/lib/site.ts`; they do not claim the listing is live today. Check the free-plan wording again before the launch send. For each draft, preview the HTML in your own inboxes and verify its links and any edited fields before sending.

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
