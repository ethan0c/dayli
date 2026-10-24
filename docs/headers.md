# Main-tab headers: number first, one line above

Status: built Oct 21, 2026 (not yet on a device beyond the simulator). The `TabHeader` rules in `design-system.md` now follow this doc. Decided with the founder the same day: number first on Today and School, the month as Plan's title, title only on You and Add.

## What is wrong now

- **Two grey lines before anything matters.** Every tab opens with the date and a context label ("Monday, Oct 19" / "Ends in") stacked above the big value. You read a label before you know what it labels, and "Ends in" only makes sense after reading the line under the number.
- **Plan says the date three times.** "October 2026", "Tuesday, Oct 20", and the selected 20 in the week chart. The largest type on the screen spells "Plan", which the tab bar already says; the chevron floats away from the month it opens; two glass arrows duplicate the chart's swipe. The chart starts about 430pt down.
- **Words at number size.** "Plan", "You", "Add" and "School" (empty) use `displayXl`, the token reserved for the one big number. When the word is as big as the countdown, neither is special.

## The rules

1. **At most one small line above the big value**, and on planner tabs it is the date. Nothing else goes above.
2. **The meaning goes under the value**, as a sentence that finishes it: "34m" then "until Stats lecture ends". Numbers first, the way Weather and Fitness read.
3. **`displayXl` (56) is for numbers and countdowns only.** Word titles (a month, a tab name) use `display` (34 / 40). One big number per screen still holds; a tab without a number has no 56.
4. **The date is for planner tabs** (Today, Plan, School). You and Add are not about a day and show no date.
5. Same positions as now: 24 gutter, safe area + 20 on top, trailing control top-aligned with the first line, details 12 below the value with 4 between related lines.

## Today

```
Monday, Oct 19                 [|||]

34m

until Stats lecture ends · 10:15 am
STAT 200 · Coursework

[====|==  ===   ======■■===]
6 am     Noon      6 pm   Midnight
```

| State (`timingLabel`) | Value | Line 1 (body 18/26) | Line 2 (callout, secondary) |
|---|---|---|---|
| Ends in | `34m` | until Stats lecture ends · 10:15 am | STAT 200 · Coursework |
| Next in | `1h 20m` | until Bio lecture · 10:30 am | BIOL 110 |
| Happening now | `Now` | Stats lecture · 9–10:15 am | STAT 200 · Coursework |
| Nothing timed left | `Clear` | Nothing timed left today. | — |
| Nothing today | `Clear` | Nothing scheduled today. | — |

- The `timingLabel` strings stop being shown; they become the start of line 1 ("until …"). The accessibility label keeps the full sentence: "34 minutes until Stats lecture ends, 9 to 10:15 am".
- The header stays one tap target that opens the featured item.
- **Moments:** the photo header keeps its layout. Its context line becomes the date alone ("Monday, Oct 19"), not "Monday, Oct 19 · ends in", and the countdown under it follows the same value-then-line order at `display`.
- **First run (`TodayStart`):** the date line, then "Today" at `display`, then the existing line ("Add one thing and Today fills in…"). The "Your week starts here" label goes.

### Today's sky

Decided Oct 21, 2026: Today gets a sky photo behind its header, the one place a planner screen carries a photo outside moment days. It is a greeting, not a theme, so it stays on Today and, since Oct 21, 2026, the welcome screen: the store screenshots, the welcome and Today then share one sky. The questions in between, and the term at a glance, stay plain paper.

- **A sky, not a scene.** Clouds and light only: no horizon, buildings, people or sun disc. `PhotoHeader` (already used by moments) at about 280pt tall, fading into the paper before the day bar; the date line and the big number sit on the faded part, never on busy pixels.
- **Five slots from the phone's clock:** dawn 5–8, morning 8–12, afternoon 12–17, golden hour 17–20, night 20–5. Night is also the dark-mode sky at every hour. No location, no weather, nothing leaves the phone.
- **Moments win.** On a moment day the moment's photo replaces the sky.
- **The fade is one SVG gradient**, so the fade has no seams.
- **The photo shows at full strength; the text adapts** (Oct 23, 2026, replacing the 22% paper wash). Measured with `design/check-sky.py`, each sky's look is in `SKY_LOOK` (`lib/sky.ts`). A light sky (dawn, morning, afternoon) takes ink for every line over it, the date line and the grey line under the featured item included: grey measured 3.2 to 3.9:1 on even the brightest sky, ink 8.2:1 or more with no wash at all. A dark sky under the light page (night) takes the dark palette for the header and the day bar (`ForceAppearance`), stays dark behind them down to the end of the bar (the photo is drawn tall enough that its dark top, `darkTo`, reaches there), then fades into the paper in the room Today leaves below the bar; the status bar turns light until the page scrolls past it. Golden hour's photo is a mid-tone, too dark for ink and too light for white, so it keeps a 34% wash until a photo that is clearly light or clearly dark at the top replaces it. Dark mode keeps the night sky under a 10% wash.
- **No motion while reading.** The sky changes only on open or when the hour crosses a slot, with the existing `PhotoHeader` fade. Reduce Motion: no fade, a straight swap.
- **Contrast:** callout grey and the 56pt number must clear 4.5:1 and 3:1 against the pixels behind them. If a photo fails, lighten that photo in the export (or start the fade higher); never add a scrim or tint.
- **Assets:** five photos, 1290 wide, cropped to the top 40% of a portrait frame, WebP at about 100 KB each, in `assets/images/sky/`, with photographer credit in `docs/photo-credits.md` (Unsplash License: free for apps, no attribution required, credit kept anyway). Candidates in **Sky candidates** below.

## School

```
Monday, Oct 19

3 days

until Stats exam 2 · Fri 9 am
STAT 200 · Next deadline
```

| State | Value | Line 1 | Line 2 |
|---|---|---|---|
| Due in 2+ days | `3 days` | until Stats exam 2 · Fri 9 am | STAT 200 · Next deadline |
| Due tomorrow | `Tomorrow` | Stats exam 2 is due · 9 am | STAT 200 |
| Due today | `Today` | Stats exam 2 is due · 9 am | STAT 200 |
| Nothing upcoming | `Clear` | No upcoming deadlines. | — |
| No courses yet | "School" at `display` | Add a syllabus and the whole term lands here. | — |

"Next assignment due (in)" goes; "Next deadline" on line 2 carries it only where the line would otherwise not say what the number counts to.

## Plan

```
October ⌄                  ( Today )

Mon  Tue  Wed  Thu  Fri  Sat  Sun
 19  (20)  21   22   23   24   25
▇▇   ▇▇   ▇▇   ▇▇   ▇    ██   ██
▇▇   ██   ▇    ██
31 things · 30 work hours

Tuesday                    9 things
○ Pre-lab worksheet        Due today
```

- **The title is the selected date's month** at `display`, with the year only when it is not the current year ("January 2027"). The chevron sits right after the word and rotates when the month grid is open; the whole title is the button. Its accessibility label stays "Choose date, Tuesday, October 20, 2026".
- **No date line.** The chart's selected day already says which day, and the day section below names it ("Today", "Tuesday").
- **No arrows.** The chart already swipes by week. A **Today** pill (subhead, fully round) appears top right only when the selected week is not this week, and jumps back. When `SHARING_ENABLED`, the share button sits in the same slot when the Today pill is not showing.
- **VoiceOver:** the week chart gets `accessibilityActions` increment / decrement ("Next week", "Previous week"), so removing the arrows removes no capability.
- **The totals move under the chart** ("31 things · 30 work hours", callout, tabular), replacing the legend line. The legend ("Green is done, orange is an overlap, a ring is an exam") stays under the totals until the person first moves by week, swipe or VoiceOver action (`firsts.week`), then goes.
- **The month grid** still opens below the title, now directly above the chart instead of below a 56pt word.
- **First run:** the same title row; `TodayStart` content follows with the chart hidden, as now.

Result: the chart starts roughly 150pt higher (estimated from the 6.9-inch capture), the date appears once, and the screen's biggest type says when you are rather than where.

## You and Add

```
You                                   Add

( Plus · Trial, 5 days left )         Type it, paste it, or drop in a
                                      screenshot. You review everything
                                      before it's added.
```

Title at `display`, no date, no context line; the pill (You) and the existing details line (Add) stay 12 below. "Profile and preferences" and "What's coming up?" go.

## Code

1. **`TabHeader`** (`components/TabHeader.tsx`): replace `label` with an optional `date` line, add `size: 'number' | 'title'` (56 vs 34) and keep `value`, `details`, `trailing`, `onPress`. Drop the two-line `labels` block and its 44 min-height. Callers: Today, Plan, School (two), You (`SettingsHome`), Add (`AddScreen`), `TodayStart`.
2. **Today** (`(tabs)/index.tsx`): build line 1 from the timing state instead of `timingLabel` + `nextTitle`; one helper in `@dayli/core`'s `today.ts` (`countdownLine(featured, state)`) so the accessibility label and the line agree and get a test.
3. **School** (`(tabs)/school.tsx`): the same order with the table above.
4. **Plan** (`(tabs)/plan.tsx`, `components/PlanCalendar.tsx`): `PlanCalendarControl` becomes the title row (month button plus the Today pill); arrows removed; chart accessibility actions; totals under the chart; the legend as a first (`FirstKind` gains `week`, defaulted in the store's `firsts` merge).
5. **You, Add, `TodayStart`**: drop `date`/`label`, `size="title"`.
6. **Sky** (`(tabs)/index.tsx`, `lib/sky.ts`): `skySlot(time, dark)` in a pure helper with a test for the slot edges; `PhotoHeader` behind the non-moment header.
7. **Docs:** update `design-system.md` (Layout bullets on `TabHeader` and Plan; the type table's `displayXl` and `display` uses), and rerender the App Store screenshots (shots 1, 3, 4 and 7 show these headers).

Motion: the Today pill enters and exits with `enter.fade` / `exit.fade`; the month title changes with the existing `Ticker`, nothing new.

## Done when

- Today, School, Plan, You and Add each show at most one line above their title or number, on a device, in light, dark and with the largest text size.
- Plan's chart starts within one screen-third of the top on a 6.1-inch phone with the grid closed.
- VoiceOver can move Plan by week without the arrows, and reads each Today state as one sentence.
- `countdownLine` has tests for the five Today states.

## Open

- **School's line 2 wording**: "Next deadline" vs nothing. Try both on device before deciding.

## Sky candidates

Searched and mocked as the Today header Oct 21, 2026 (photo, the 45% fade into the paper, the date, "34m" and the lines under it). All are under the free Unsplash License (each downloaded without an account, which Unsplash+ photos do not allow); confirm on each page before shipping.

| Slot | Pick | Photographer | Why | Runner-up, and why not |
|---|---|---|---|---|
| Dawn 5–8 | [Soft pink and orange clouds in a pastel sky](https://unsplash.com/photos/soft-pink-and-orange-clouds-in-a-pastel-sky-A3u8Ugv1EAw) | Scott Goodwill | Wispy and pale; the number sits on clear sky | [Pink and orange clouds against a pale sky](https://unsplash.com/photos/pink-and-orange-clouds-against-a-pale-sky-at-sunset-bziUIonXyI4) (Agnese Rudzīte): a dense orange cloud right behind the number |
| Morning 8–12 | [Soft white clouds against a pale blue sky](https://unsplash.com/photos/soft-white-clouds-against-a-pale-blue-sky-dmQhktXQ0ew) | Cuvii | The calmest of the set; ink reads everywhere | [Fluffy white clouds against a bright blue sky](https://unsplash.com/photos/fluffy-white-clouds-against-a-bright-blue-sky-3ohksq_MLjQ) (Ishan Sharma): saturated blue, the date line disappears |
| Afternoon 12–17 | [White fluffy clouds float in a blue sky](https://unsplash.com/photos/white-fluffy-clouds-float-in-a-blue-sky-Pe332zREgZ8) | Miguel Ángel Padriñán Alba | Bright and pale; busiest of the picks, so check contrast on device | [Fluffy white clouds drift against a deep blue sky](https://unsplash.com/photos/fluffy-white-clouds-drift-against-a-deep-blue-sky-CK3hWcz83ls) (Linus Belanger): navy behind the number fails contrast |
| Golden hour 17–20 | [Cloudy sky during golden hour](https://unsplash.com/photos/cloudy-sky-during-golden-hour-AUrK7wuV8fE) | Andres Perez | Lavender and rose, close to the brand's paper and accent; reads cleanly | [Photo of white clouds during golden hour](https://unsplash.com/photos/photo-of-white-clouds-during-golden-hour-hZe5eOlvqDk) (Daniel Gregoire): dense orange texture, the secondary line is lost |
| Night 20–5 and dark mode | [A dark sky with clouds](https://unsplash.com/photos/a-dark-sky-with-clouds-chWryC7O0H8) | Cici Hung | Near-black with faint cloud; white type reads, fades cleanly into the dark canvas | [The sky is dark and blue with a few clouds](https://unsplash.com/photos/the-sky-is-dark-and-blue-with-a-few-clouds-liuRkMSgNXo) (Alexandra Nicolae): a mountain silhouette, which breaks "a sky, not a scene" |

Before export: lighten the afternoon and dawn picks slightly where the number sits, and crop each to its calmest upper area. Credits go in `docs/photo-credits.md` with the shipped files.
