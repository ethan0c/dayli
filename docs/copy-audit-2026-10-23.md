# Semli wording review — October 23, 2026

The wording is mostly natural and specific to students. The ASO foundations are sound, but the copy is not ready to call fully optimized: screenshot 2 shows the wrong feature for its caption, several descriptions overpromise, and the submission sources disagree on pricing.

This is an audit with proposed copy, not an applied rewrite. Existing app, website, and image changes were left alone.

## Scope and limits

Reviewed notification templates, reminder settings, alarm explanations, the website’s home page, three search landing pages, pricing, beta form, preview flow, navigation/footer, contact, 404, privacy and deletion instructions, and terms wording. Reviewed all four English storefronts in `apps/mobile/store.config.json`, the submission guide, the screenshot generator, and the nine rendered 6.9-inch screenshots. Checked that the nine 6.3-inch counterparts exist at the expected dimensions; they were not individually visually inspected. Header/search asset wording was checked in the generator.

This reviews the current working tree, including pre-existing uncommitted notification and Canvas work. It does not cover every other mobile screen or certify translations. Public website and App Store requests failed in the available network environment, so deployed wording and uploaded App Store Connect assets remain unverified. There is no keyword-volume, ranking, conversion, or A/B-test data here; optimization recommendations are hypotheses, not measured uplifts.

## Fix first

| Priority | Finding | Recommended correction |
| --- | --- | --- |
| High | `02-review.png` says “A semester in two minutes” over a Campus Café import of six shifts. | Use “Turn screenshots into shifts.” for this capture. To promote syllabus imports, capture an actual syllabus review instead. Remove the unsupported two-minute claim. |
| High | US store description lists annual prices of $29.99 student / $49.99 regular. Website constants and submission guide list $24.99 / $44.99. | Remove fixed prices from the App Store description. Verify the actual store products before aligning website prices. Apple also advises against specific prices in descriptions. |
| High | Store description implies suggested rescheduling, schedule comparisons, and ringing alarms are generally included. | Introduce those features with “With Plus.” Explain that ringing alarms need a timed urgent item, iOS 26+, and alarm permission. |
| High | “Every exam, reading and assignment,” “Nothing to scroll through,” and “Files … not stored” are too absolute. | Describe finding dates for review; remove the scrolling promise; distinguish Semli’s upload handling from the AI provider’s retention. |
| Medium | “No day gets more than five” in reminder settings is not a hard scheduler limit. | Say “We group deadlines to keep reminders manageable.” The scheduler retains all priority reminders even when that exceeds five. |
| Medium | “Get the TestFlight link” submits an email for a later invitation. | Use “Join the beta waitlist.” Keep the confirmation that an invitation will arrive by email. |
| Medium | Pricing’s “Try a schedule” points to `/#try`, but the current home page has no preview section with that ID. | Point to `/syllabus-to-calendar#try`, where the shared preview actually renders. This is a destination issue as well as a copy promise. |
| Medium | “Kept in sync” and “on its own” can suggest background or immediate Canvas updates. | Explain “With Plus, Semli checks for updates when you open the app.” The current automatic check is foreground-triggered and throttled to once per three hours; “Sync now” is available too. |

## Notification wording

These messages should help someone act on their day. Search keywords do not belong in notification copy. Keep the current calm tone, real item titles, clear times, lack of guilt, and direct links to the relevant item or Today.

| Message | Assessment | Suggested wording |
| --- | --- | --- |
| Event title: the item’s title | Good. Specific and recognizable. | Keep. |
| “Starts at 9:00 am · Ends at 10:15 am.” | Clear, slightly mechanical. The scheduled start time stays accurate even if delivery is delayed. | “Starts at 9:00 am. Ends at 10:15 am.” Optional style change. |
| One deadline: item title / “Due Tuesday at 5:00 pm.” | Good. Useful and concise. | Keep. |
| Grouped deadlines: “3 things due today” | Already conversational. | Keep; “3 deadlines today” is an alternative, not a necessary improvement. |
| Daily summary: “Today’s schedule” | Good heading. Body counts all items, then lists events, tasks, deadlines, and a future deadline; it can become dense. | Keep heading. Prefer a short body such as “2 classes, 1 shift. Due today: Lab report. Next: Essay on Thursday.” Generate counts from actual item types; do not hard-code them. |
| Upcoming exam: “Stats exam is due Thursday.” | Understandable but unnatural for an exam. | “Stats exam is on Thursday.” Use an exam-specific branch only when the item can be identified reliably. |
| Trial: “Your Semli Plus trial ends in 2 days” | Transparent and useful. Scheduled two calendar days before expiry, rather than exactly 48 hours before. | “Your Plus trial ends on [date].” Body: “Then [price and billing period]. Manage or cancel in You → Your plan.” Retain the real store price and billing period. |
| “Test reminder” / “Notifications are working. You can change reminder times in Semli.” | Good. | Keep. |
| Ringing alarm title | Uses the real item title. | Keep. |

Long user-created titles can still be truncated by iOS. Preview summaries with multiple deadlines and long course names before choosing a body-length limit; do not truncate away the only mention of an important deadline.

Reminder-settings corrections:

- Replace the event/deadline footer with: “Repeating classes stay quiet unless you turn on class reminders. Deadlines due on the same day are grouped together.” Urgent classes are an exception, explained by the separate alarm controls.
- Replace the quiet-hours footer with: “Event reminders and evening deadline reminders wait until quiet hours end, unless that would be too late. Choose your morning reminder and daily summary times separately.” Those morning/summary paths do not call the quiet-hours adjustment.
- Replace the daily-summary footer with: “Today’s plans, what’s due, and the next deadline within three days. When the summary arrives before a deadline, it replaces that morning’s deadline reminder. Nothing scheduled? No summary.” This reflects the conditional replacement more accurately.
- Keep permission errors that say what failed and how to fix it. “Allow notifications to receive reminders on this iPhone” is clear.

Sources: `apps/mobile/src/lib/reminder-plan.ts`, `notifications.ts`, `alarm-plan.ts`, `apps/mobile/src/app/settings/reminders.tsx`, and `apps/mobile/src/components/RingingAlarmInfo.tsx`.

## Website

The three search pages are the strongest copy: they answer a specific need, use familiar examples, explain review/undo, and link to related tasks. The titles cover syllabus-to-calendar, assignment tracking, and work/school planning naturally. Keep that approach. Google recommends descriptive titles and content written for people; this is an editorial assessment, not a ranking claim. [Google title guidance](https://developers.google.com/search/docs/appearance/title-link), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

| Location | Current wording | Recommendation |
| --- | --- | --- |
| Home hero and header/search art | “Your week, already organized.” | Warm and short, but broad. Test “Classes, shifts, and deadlines. One plan.” against it. Keep the existing line if brand recall is the goal; use the more explicit line to test immediate understanding. |
| Home supporting text | “Classes, shifts, and deadlines in one plan. Add a syllabus, a work schedule, or a message, and Semli lays out what’s next.” | Good. Optional tighter version: “Add your syllabus, a screenshot of your shifts, or a message. Review the dates, then see your week in one place.” |
| Home Plus introduction | “Plus is for when you import a lot.” | “Plus adds unlimited imports, Canvas updates, and help when your schedule changes.” The current sentence undersells several paid benefits. |
| Free-plan details | “3 AI imports a month” | Current implementation also has a five-import starter allowance. Subject to confirming the production migration, say “Start with 5 AI imports, then 3 a month.” Explain the initial 30-day window in the pricing FAQ. |
| Beta CTA | “Get the TestFlight link” | “Join the beta waitlist.” Use the same wording in navigation and dialogs when they lead to the waitlist. |
| Beta note | “The first 200 testers get in.” | “We’re inviting up to 200 beta testers.” This states capacity without implying an immediate guaranteed place. Keep the number only while the cap remains accurate. |
| Work/school FAQ | “Any of them, because it reads the screenshot, not the app.” | “You can upload screenshots from scheduling apps, spreadsheets, or a printed schedule. Check the shifts and fill in missing details before saving.” Avoid implying universal extraction reliability. |
| Pricing feature list | “Urgent items that ring like an alarm” | Keep the benefit; add nearby: “Ringing alarms require iOS 26 or later and alarm permission.” |
| Canvas FAQ and screenshot support text | Assignments “come in on their own” / due dates “stay in sync” | “Import assignments from your Canvas calendar feed. With Plus, Semli checks for updates when you open the app.” Apply the same expectation in app settings. |
| Privacy review promise | “Nothing Semli reads becomes part of your plan until you confirm it.” | Qualify: “Review AI imports before adding them. After you connect Canvas, Plus can apply calendar-feed updates automatically.” Canvas updates use a different confirmation flow. |

Keep the home feature explanations, explicit one-time Calendar export answer, contact wording, deletion steps, and 404 recovery action. They are plain and useful. No need to make every line more casual. Privacy and terms need accurate descriptions more than marketing language; this review is not legal advice or a legal compliance audit.

The footer’s “Try a schedule here” should link directly to a working preview. The preview’s “This is a preview, not a saved plan” is helpful and should stay. “Almost there” is a timed loading phase, not actual progress; consider “Still reading…” for long requests.

## App Store metadata and ASO

| Locale | Title / 30 | Subtitle / 30 | Keywords / 100 | Description / 4,000 | Promo / 170 |
| --- | ---: | ---: | ---: | ---: | ---: |
| en-US | 25 | 28 | 98 | 2,299 | 128 |
| en-GB | 25 | 29 | 99 | 2,238 | 123 |
| en-AU | 25 | 29 | 94 | 2,262 | 125 |
| en-CA | 25 | 28 | 99 | 2,241 | 128 |

Counts include punctuation, spaces, and commas between keywords. All configured fields fit; the submission guide’s US title/subtitle counts agree with the actual lengths of 25 and 28.

Keep `Semli: AI Student Planner` and the current subtitles as the baseline. They identify the category and differentiate the product without stuffing. Near-full keyword fields are technically efficient, but there is no evidence that their terms are the best-performing choices. Test demand for homework, assignment tracking, class schedules, and syllabus imports before reallocating space. “Nursing” is appropriate if that audience is intentional; its value versus “exam,” “study,” or “reminder” is unmeasured.

Apple documents title, subtitle, keywords, and primary category as text-relevance factors. Screenshot copy should make the benefit clear and encourage an informed download; do not assume repeating keywords in screenshots guarantees higher ranking. Promotional text does not affect search ranking. [Apple search guidance](https://developer.apple.com/app-store/search/).

Recommended shared description changes across all four English storefronts:

- Lead with the practical job rather than “a job, a life, and no time.”
- Replace “every” extraction claims with “finds … for you to review.”
- Remove “Nothing to scroll through.” Today has a list that can extend beyond one screen.
- Replace “Quiet at night” with “Choose reminder times and quiet hours.”
- Put Plus labels beside paid capabilities, and distinguish ordinary reminders from ringing alarms.
- Replace “Files … not stored” with “Semli’s servers don’t save your original uploads. Our privacy policy explains how the AI provider handles requests.”
- Remove hard-coded prices. State trial eligibility rather than promising every reader a trial.
- Use the actual billing duration “six months” instead of implying a semester has a fixed length everywhere.
- Keep UK/Australian vocabulary, but remove the absolute “Dates like 4/11 are read the UK/Australian way.” Prefer “Review dates and times in your region’s format.”

Apple recommends an informative opening, concise feature list, and no specific prices in descriptions. [Product-page guidance](https://developer.apple.com/app-store/product-page/).

Suggested US description body, retaining the existing subscription/terms/privacy footer after separately verifying it:

> Keep classes, work shifts, and assignment deadlines in one student planner.
>
> Upload a syllabus PDF, a screenshot of your shifts, or a message from class. Semli finds dates and times for you to review before adding them to your plan. You can correct the details or undo an import later.
>
> See what’s next
> Check today’s plans, view your week, and spot overlaps between work and school.
>
> Bring your course dates together
> Add exams and assignments from a syllabus, or import assignments from your Canvas calendar feed.
>
> Choose your reminders
> Set reminders for events and deadlines, with an optional daily summary.
>
> Start with the free plan
> Use the calendar, to-dos, reminders, and a free AI import allowance. No account is required.
>
> Add more with Semli Plus
> Get unlimited AI imports, work-schedule comparisons, suggested times for overlaps, and Canvas update checks when you open the app. Ringing alarms for timed urgent items require iOS 26 or later and alarm permission. Eligible new subscribers can try Plus for seven days.
>
> Your plan stays on your phone, with optional account backup. Semli’s servers don’t save your original uploads; our privacy policy explains how the AI provider handles requests.

Suggested promotional text, 127 characters:

> Turn your syllabus and work schedules into one plan for classes, shifts, and deadlines. Review the dates, then see what’s next.

The configured promotional text ends “Free to start,” while the submission guide explicitly says to avoid “free” there following the recorded rejection. The proposed version resolves that internal inconsistency. Do not generalize that repo-specific instruction into a universal Apple ban on the word “free” in promotional text.

## Every screenshot caption

The current output uses the quiet layout without sublines. Benefits and any necessary Plus qualifier must be visible somewhere in the final image; editing hidden subline strings will not change this set. Apple says screenshots should demonstrate use and make additional purchases clear. [App Review Guidelines, 2.3.2–2.3.3](https://developer.apple.com/app-store/review/guidelines/).

| File | Current caption | Recommended caption / action |
| --- | --- | --- |
| `01-today.png` | Know what matters today. | “Classes, shifts, and deadlines.” Stronger category clarity for the first image. Existing line is a reasonable variant to test. |
| `02-review.png` | A semester in two minutes. | “Turn screenshots into shifts.” Matches the actual six-shift review. Alternatively recapture a syllabus review and use “Your syllabus, in your planner.” |
| `03-review-update.png` | Screenshot your shifts. | “See what changed in your shifts.” This is a comparison screen. The UI already says “Update with Plus.” |
| `04-plan.png` | School and work in one week. | “School and work, one calendar.” More natural; keep the same visual. |
| `05-spread.png` | A heavy week, spread out. | “Plan ahead for busy weeks.” Clearer to a new user. Current image shows a proposed spread with “Sounds good” / “Not now”; the benefit is real. |
| `06-today-hours.png` | Your day, hour by hour. | Keep. Specific and matched to the screen. |
| `07-school.png` | Every class, every exam. | “Keep your course dates together.” Avoid implying automatically complete extraction. |
| `08-item.png` | Reminders that ring. | “Choose your reminders.” If retaining the ringing-alarm benefit, recapture a timed urgent item with the alarm actually enabled, and visibly identify Plus and the iOS requirement. The current capture has Urgent off. |
| `09-canvas.png` | Canvas, kept in sync. | “Bring Canvas into your plan.” The current capture is a connection form. For a sync-focused caption, show a connected state and make Plus/update timing clear. |

The strongest first-three story to test is: see your day → import a syllabus → add your work shifts. That requires a genuine syllabus capture; the current set has two work-schedule screens in its first three positions. Until that capture exists, truthful captions matching the current screens are the immediate fix.

Caption localization needs repair too: GB/AU overrides for `today-mon-hours` and `add` no longer match active shot names, and the syllabus wording is attached to `school` instead of `review`. Fix the keys and screenshot/caption pairing before generating localized assets. Only US/default image folders are currently present.

`design/screenshots/compose.py` still contains an older paywall/free screenshot set. The documented generator is `design/render-screenshots.py`; retire or clearly mark the old script so it cannot accidentally recreate superseded submission assets.

## Verification after a rewrite

Recount all storefront fields, align the submission guide and config, and visually inspect both screenshot sizes after rendering. Check that paid-feature qualifiers survive the no-subline layout. Preview real notifications with long titles and several deadlines on a device. Measure first-three screenshot treatments with App Store product page optimization rather than declaring a winner from taste alone. [Apple product page optimization](https://developer.apple.com/app-store/product-page-optimization/).
