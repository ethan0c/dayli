# Edge cases, from the student's side

October 19, 2026. Every situation a typical user runs into, and what the app does. UI behavior only. The principle throughout: one obvious action, Undo instead of confirmations, amber when Semli needs something, never a dead end.

Legend: **Board** = needs a design on the review canvas · **Rule** = behavior only, no new screen · **Have** = already works this way.

## 1. Deleting

| Case | Behavior | |
|---|---|---|
| Delete one to-do or event | Deletes on one tap, no confirm. Ink toast "Deleted Café shift · Undo" for six seconds. After that, it is still in You › Your data › Recent changes with Undo. | Rule |
| "Delete forever" | There is no forever. Everything you delete can be undone from Recent changes. The only irreversible action is Clear everything. | Rule |
| Delete from a list without opening it | Swipe left on any row reveals a red Delete. Swipe right on a to-do completes it. | Board |
| Delete one lecture of a repeating class | Deleting a repeating item asks the scope inline, under the delete button: "Just Mon, Oct 19" · "This and later ones" · "All 28 lectures". Default is just this one. | Board |
| A class is cancelled for a holiday or break | Same as above, just this one. If you add a break in You, Semli offers "Remove 6 classes during Fall break?" as a row on School with one tap and Undo. | Rule |
| Dropped a course | Course detail › "Remove STAT 200 · 31 items". One tap, toast with Undo. Takes the course, its lectures, exams and to-dos. | Board |
| Quit a job | Employer detail › "Remove Campus Café". Asks once: "Upcoming shifts only" or "Everything, including past shifts". Also stops the "Next week's shifts" row. | Board |
| Imported the wrong screenshot | Toast Undo right after. Later: tap "From a screenshot, Oct 12" on any item from it → that import, with "Undo this import" and its count. | Board |
| Delete a done item | Same as any item. | Rule |
| Remove the sample week | Disappears on its own when the first real import is confirmed; the toast says "Sample week removed · Undo". Until then, one row on Today: "This is a sample week · Remove". | Rule |
| Delete while a reminder is pending | Reminder is cancelled silently. | Have |
| Clear everything | Second tap to confirm, red, and an "Export first" text button next to it. Cannot be undone, and the screen says so. | Rule |

## 2. Editing

| Case | Behavior | |
|---|---|---|
| Rename | Tap the title, type, tap away. Saves. | Have |
| Change the time of an event | The big time on the item screen is tappable. Opens the native time picker in place. End time the same. | Board |
| Change the date | The date row opens the native date picker. Moving a to-do past today clears "Due today". | Board |
| Move one lecture vs the whole series | Editing a repeating item asks the same scope as delete: just this one, or this and later. Changing the room or a one-off time defaults to just this one. | Board |
| Shift time changed by hand, then a new screenshot says otherwise | The screenshot wins, but the review shows it as Moved with "was 5–9" so you see it before confirming. Keep it is one tap. | Have |
| Change which course or category | Tap the "STAT 200 · Coursework" row → chips, like New to-do. | Board |
| Add or edit notes | Tap Notes, type, tap away. | Rule |
| Turn an event into a to-do or back | Not offered. Delete and add. | Rule |
| Mark an event done | Events do not get a check; they pass on their own and the timeline turns green. To-dos get the circle. | Have |
| Un-complete | Tap the green check again. Lives under "Completed · 3" on Today. | Have |

## 3. Repeating things

| Case | Behavior | |
|---|---|---|
| Semester end unknown | Review shows the class with an amber "Until when?" pill, defaulting to 15 weeks out, instead of silently adding one lecture. | Board (review state) |
| Term runs longer or shorter | Item screen shows "Repeats Mon, Wed until Dec 12 · Change". Changing the end trims or extends. | Board |
| Time changes mid-semester | Edit → "This and later ones". | Board (same scope chooser) |
| Semester is over | When every item in a course is past, School shows "Fall 2026 is over · Remove 4 courses?" with one tap and Undo. | Rule |
| Shift that crosses midnight | Shows "10:00 pm – 2:00 am, next day". The timeline draws it to midnight. | Have |

## 4. Importing and reviewing

| Case | Behavior | |
|---|---|---|
| Same screenshot twice | Review opens with "Already in your plan · nothing to add" and one Close button. No empty list. | Rule |
| Two screenshots of overlapping weeks | Only the days the new screenshot covers are compared. The review says "Compared Oct 26 – Nov 1 only". | Rule |
| Group chat screenshot with several people's shifts | Review asks once, amber: "Whose shifts are these?" with name chips. | Board (review state) |
| Last term's syllabus, dates in the past | A caption on the review: "All 20 dates are in the past". Confirm still works. | Rule |
| Item with no time | Goes in. Amber "Add a time" pill on Plan. Never blocks. | Have (boards) |
| Item with no date | Does not go in by default. Shown as "Skipped · no date" with an "Add a date" pill to include it. The button reads "Add 6 · skip 1". Never blocks. | Board (review state) |
| Nothing readable in the image | Inline red line under the composer: "Nothing with a date in there. Try a clearer shot or type it." The screenshot stays attached. | Rule |
| Offline or server down | Same inline line: "Semli needs a connection to read this." The screenshot and text stay in Add until you come back. | Rule |
| Free imports used up | Plus opens in place with "Continue free next month" as the quiet option. The draft is still there when you come back. | Have |
| Closed the review by accident | Add shows a row "Finish reviewing Campus Café · 7 shifts" for a day. | Rule |
| Course exists under a slightly different name | Review says "Adds to PSYC 101 · Change" as a text button rather than creating PSYC101 twice. | Rule |
| Imported shift overlaps a class | The review row says "Overlaps STAT 200 lecture". It still goes in; both rows show the red-text time on Plan. | Have |
| App closed mid-read | Nothing was saved. Add reopens with the draft. | Rule |

## 5. Reminders

| Case | Behavior | |
|---|---|---|
| Said no to notifications, changed mind | Reminders screen shows "Turn on in Settings" as the first row, which opens iOS Settings. | Have |
| Reminder for a shift with no time | None. The amber pill on Plan says "no time yet, so no reminder". | Have (board) |
| Completed before the reminder | Reminder is cancelled. | Have |
| Too many upcoming items | Nearest sixty get reminders; the rest pick up as days pass. Invisible to the user. | Have |
| Nothing on today | No morning briefing that day. | Have |
| Tapped a reminder for something already deleted | "Item unavailable" with a back button. | Have |
| Quiet hours | Reminders that would land inside wait, unless the thing itself is sooner. | Have |

## 6. Time passing

| Case | Behavior | |
|---|---|---|
| Overdue to-dos piling up | "Still open · 5" on Today with two text buttons: "Bring all into today" and "Mark all done". Each with Undo. | Rule |
| A planned "work on it today" task not touched | Falls off Today at midnight without changing its real date. | Have |
| Midnight while the app is open | Today rolls over on its own. | Have |
| Looking at past days on Plan | Normal rows; done ones green; you can still tick a past to-do. | Have |
| A moment day (break, finals) | Photo header and the moment number replace the countdown. | Have |

## 7. Your data and account

| Case | Behavior | |
|---|---|---|
| New phone | Your data › "Export my plan" produces a file you can AirDrop or save; "Add to Calendar" sends every event to Apple Calendar. Backup to iCloud comes later. | Board |
| Want it in Apple or Google Calendar | Same "Add to Calendar" export, .ics. | Board (same screen) |
| Trial ends | Imports stop at three a month; nothing else changes and nothing is removed. | Have |
| Restore a purchase on a new phone | Restore text button on the Plus screen. | Have |
| Replay the intro | Keeps everything. | Have |

## 8. Lists and navigation

| Case | Behavior | |
|---|---|---|
| Double tap a row | Opens once. | Rule |
| Delete, then back | Returns to the list with the row gone and the toast showing. | Have |
| Keyboard over the send button | The composer rises with the keyboard. | Have |
| Very long title | Two lines, then an ellipsis. Full title on the item screen. | Have |
| Many items in a day | Rows, scroll. The day timeline still shows every block. | Have |
| Large text (accessibility) | Rows grow, pills wrap to a second line, the big number scales to 72 max. | Rule |
| VoiceOver | Swipe actions are also exposed as row actions. Every pill reads its meaning. | Rule |
| Reduce motion | Rows fade instead of slide; the digits do not roll. | Rule |

## Boards to draw

1. Swipe actions on a row: right to complete, left to delete, both states.
2. Item screen with the scope chooser open under Delete, and with the time picker open.
3. Course detail, pushed from School: meeting pattern with "Change", upcoming items, "Remove STAT 200 · 31 items".
4. Employer detail: upcoming shifts, "Next week's shifts" status, the two-option remove.
5. An import, pushed from "From a screenshot, Oct 12": what it added, "Undo this import".
6. Review states: "Until when?", "Whose shifts?", "Skipped · no date", "Already in your plan".
7. Your data: Recent changes, Export my plan, Add to Calendar, Clear everything with "Export first".
