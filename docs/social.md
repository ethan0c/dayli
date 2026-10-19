# Social features: research and decision

Status: Oct 19, 2026. Question from the founder: add a social layer (remind friends to study, schedule study sessions together, a photo feed) as a unique position, without distracting people?

## Short answer
- **A photo feed: no.** It is the one part that is not new, it is the part that distracts, and it is the part Snap and Instagram copy within a quarter.
- **Studying together: yes, narrowly, in phase 2.** The mechanic students demonstrably love is a *shared focus session* (Flora, Forest), not a social network. Scheduling a study session that lands on two calendars, running it together with a timer, and a one-tap nudge before a friend's exam fit the product and don't add scrolling.
- **Not in the MVP.** Friends need accounts and a backend, which we deliberately don't have yet. Ship it only if the beta shows a retention problem that solo features don't fix, and after at least a third of beta testers ask for it unprompted.

## What exists already

| Product | What it is | Signal |
|---|---|---|
| **Saturn** | Social calendar for high schoolers: see friends' schedules, school bell schedules, chat | Raised $44M (Bezos, Benioff), **acquired by Snap in June 2025**; claims 80% of US high schools and 30% of users interacting with a friend daily. The idea has been validated and bought. But: last 150 reviews average **2.05**, almost all "can't add my school", broken schedules. It depends on school-level data and support. |
| **Howbout** | Shared calendar with friends ("what are you doing Saturday?") | 51k ratings, 4.8 lifetime; last 150 reviews average 2.05, dominated by a new paywall. Friends' calendars are valued; charging for them is hated. |
| **Flora** | Focus timer; plant a tree, optionally *with friends*: if anyone leaves the app the shared tree dies | 83k ratings, **4.76 recent**; 70 of 150 recent reviews say it works. The social part is a shared session with real stakes, not a feed. |
| **Forest** | Same idea, older; "plant together" rooms | 50k ratings; recent complaints are about a 2026 redesign, not the mechanic. |
| **Focusmate** | One-on-one video body doubling with strangers, 25/50/75 min | Small but loyal (ADHD community); paid at ~$8/mo. Shows strangers are not needed to get the effect, presence is. |
| **StudyStream** | 24/7 study-with-me video rooms | Recent reviews 2.5; complaints about review nagging, paywalled group posts, astroturfing. |
| **BeReal** | Daily photo feed | Fell from ~73M to ~33M monthly users within a year of peak; the format was cloned by Instagram, TikTok, and Snap. |

## What the research says
- Evidence that an *accountability partner* increases study time is **mixed to negative**. An observational study of a learning platform (HICSS 2025) found partnered users checked in more but studied *less* and showed more "pretending to study"; goals and real communication reduced the effect. Small experiments with study partners found no significant effect of partner status or group membership on reaching committed goals.
- Evidence for *presence during the session* (body doubling) is anecdotal but consistent among the people who use it, and it is about task initiation and focus, not long-term retention.
- Our own survey (n=66): the problems students named were "too many tasks at once" and "not knowing what matters today". Nobody asked for friends.

Reading: the win is not accountability-as-performance (posts, streak-sharing, feeds), which the data says can backfire. The win is making the *session itself* shared.

## If we do it, this is the shape

Phase 2, after accounts exist. Three features, nothing else.

1. **Study session with a friend.** Pick a friend, a time, and a course. It lands on both calendars like any event. Either can move it; both get the change. Works for in-person or remote.
2. **Run it together.** When the session starts, both open a focus timer (25/50 min). Phones down; if either leaves, the session shows it. End of session: "You and Jess studied 50 min for Pharm exam 2." That line is the whole social surface. No feed, no likes.
3. **Nudge before an exam.** The day before a friend's exam, Semli offers one tap: "Send Jess a 'you've got this'." Pre-written, once per exam, no reply thread.

Explicitly not: a photo feed, profiles, following, seeing a friend's full calendar, chat, leaderboards. Friends are added by code or contact, not discovery.

Why this doesn't distract: nothing to scroll, nothing to post, the social moment happens inside a focus session, and the only notification is the one the user set up.

## Cost and risks
- Accounts, sync, friend graph, push notifications, and a moderation path for display names. That is the phase-2 backend decision, pulled forward.
- Virality is real but modest: each study session invites one friend, which is a cleaner loop than "share your streak".
- Risk of becoming a dating/social app in users' minds; keep it course-scoped ("study for Pharm exam 2"), never free-form.

## Decision gates
Build it when all three are true:
1. The MVP purchase test passed (we are funding phase 2 at all).
2. Week-4 retention of paying users is below target *and* interviews point at motivation rather than missing features.
3. At least a third of beta testers mention studying with friends without being asked. Add one interview question to find out: "When you study for a big exam, who else is involved?"

Sources: [Snap acquires Saturn](https://techcrunch.com/?p=3020701), [Saturn raises $44M](https://www.insightpartners.com/ideas/saturn-the-calendar-based-social-platform-raises-44-million/), [Saturn product updates](https://www.joinsaturn.com/updates), [Focusmate review](https://blog.saner.ai/focusmate-review/), [body doubling apps](https://www.pledgd.com/blog/body-doubling-apps), [accountability partners study, HICSS 2025](https://aisel.aisnet.org/hicss-58/cl/teaching_and_learning_technologies/3), [study partner commitment experiment](https://emerginginvestigators.org/articles/21-213), [social accountability among college students](https://ideas.repec.org/a/kap/iaecre/v29y2023i4d10.1007_s11294-023-09878-7.html), [how BeReal missed its moment](https://platformer.news/how-bereal-missed-its-moment), [BeReal downloads down 95%](https://thebridgeclub.beehiiv.com/p/bereal-25-million-daily-user-claim). App Store review figures are from the public reviews feed on Oct 19, 2026 (last 150 reviews per app).
