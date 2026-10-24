# Motion: the Robinhood teardown and Semli's rules

Status: Oct 21, 2026; second pass Oct 23, 2026 (rows, the week chart, words that change, the toast, the first-import moment). Goal from the founder: every interaction smooth and intentional, with no distracting bounce-back. This doc lists what Robinhood actually does, maps each move to Semli, and sets the rules the code enforces through `packages/tokens/src/motion.ts`, `apps/mobile/src/lib/motion.ts`, and the `Press` component.

## 1. What Robinhood does, interaction by interaction

| Where | What happens | Why it feels premium | Semli equivalent |
|---|---|---|---|
| Any button or card | Shrinks about 3% and dims slightly on touch-down, springs back on release. Never a snap. | The screen answers the finger before the action happens | `Press` everywhere. Rows use `PressRow`: a grey highlight that fades in over `fast` and out over `base`, like iOS Settings |
| Portfolio value | Digits roll vertically to the new number, one column at a time, tabular widths | Change is shown, not swapped | `Ticker`: every digit column rolls the way the number moved, and changed words slide the same way. Today's countdown, Plan's month, day title and legend, section counts, the big numbers on course and employer pages. `Swap` slides a whole label (status pills, the reading heading) |
| Chart scrub | A selection haptic on every data point; the value above ticks as you drag; the line fades everything after the finger | Touch and sound and number all agree | Plan's week chart: rest a finger for `hold`, then drag; the choice follows a day at a time with one selection tick per day |
| Range tabs (1D, 1W…) | Selected pill slides to the new tab on a spring; the chart crossfades | One moving element, never two things popping | One pill and one focus ring slide across the week on `snappy`; each day's number turns to the pill's ink exactly as it passes. Segmented controls the same |
| Lists | New rows fade in and others slide to make room; removed rows fade out and the list closes the gap | Nothing jumps | `layout` transition on every list row in Today, Plan, School. Swipe actions grow with the drag and are full size exactly at the commit line; a deleted row stays open on red while it fades out |
| Loading | Grey rounded placeholders in the exact layout of the content, pulsing | You already know what's coming | `Skeleton`, `SkeletonRows`, the Reading state, PlanPicker prices. Every skeleton breathes on one shared clock and fades out where the content fades in. Review rows land in a staggered wave |
| Toasts and sheets | Rise on a spring with no overshoot, sink on exit | Weight without bounce | Toast enter/exit and onboarding steps use the bounded timed curve. Each new message is its own toast; drag one down to put it away, or let go and it springs back with the finger's speed |
| Paging | The page follows the finger and the release carries its speed | Nothing moves only after you let go | Plan's weeks are native pages (`WeekPager`), the neighbours already drawn; the Today pill slides back |
| Navigation | Full-screen pushes with the native iOS header and back chevron; flows that need their own context slide up as full-screen covers with an X in the header, not half sheets | Native transitions are free, interruptible, and 120 Hz | Item detail and Settings push; Capture, Create, Review are full-screen covers with an X |
| Tab bar | The system tab bar; icons switch between outline and fill | It's iOS | `NativeTabs` with the Liquid Glass "+" in the bottom accessory |
| Confirmation | A full-screen success with a drawn checkmark and one success haptic | The one moment that earns a celebration | `AddedMoment`: the first import after onboarding. A green tick draws itself, the count rolls up from zero, Plan takes over on its own. The toast and the reminders prompt wait until Plan |
| Haptics | Light impact on press, selection tick on scrub and segment change, success notification on an order | Same event, same tap, every time | `feedback()` cues: tap, select, complete, success, remove, undo, warning, error |
| Type | Capsule, their proprietary grotesk, tabular numerals everywhere numbers change | Numbers line up when they tick | Tabular numerals on every count and time |

Robinhood's app is native Swift. None of the behaviours above need Swift: Reanimated runs them on the UI thread, the stack and tab bar are native, and the haptics are the system engine. What Robinhood has that we did not is discipline: one set of curves, applied everywhere. That is what the tokens are for.

## 2. The tokens

From `packages/tokens/src/motion.ts`:

| Token | Value | Use |
|---|---|---|
| `spring.snappy` | damping 37, stiffness 380, mass 0.9, overshoot clamped | Anything under the finger: press, toggle, check, segment |
| `spring.gentle` | damping 28, stiffness 190, mass 1, overshoot clamped | Rolling digits, voice level, launch handoff, onboarding progress |
| `duration.fast` | 120 ms | Exits and dims |
| `duration.base` | 220 ms | Layout re-flow, entrances, fades and reveals |
| `duration.slow` | 360 ms | Screen-level fades |
| `pulse` | 700 ms | Each half of a skeleton's breath |
| `easing` | cubic-bezier(0.2, 0, 0, 1) | The only timed curve |
| `press` | scale 0.97 (0.9 for icon buttons), opacity 0.88 | Press feedback |
| `sweep` | 1400 ms | One pass of the progress line |
| `hold` | 220 ms | Rest on a chart this long before a drag scrubs it |
| `stagger` | 45 ms | Delay between siblings entering together |

`apps/mobile/src/lib/motion.ts` turns these into Reanimated configs: `springs.snappy`, `springs.gentle`, `ease`, `layout`, `enter.{fade,rise,drop,fromRight,fromLeft,staggered(i)}`, `exit.{fade,sink}`.

## 3. Rules

1. **No raw numbers in animations.** Durations, springs, and easing come from the tokens. A new need means a new token, not a local constant.
2. **No `Animated` from react-native.** Reanimated only, so everything runs on the UI thread. (`LayoutAnimation` is also out.)
3. **Buttons and cards use `Press`.** Rows (settings, agenda, review) use `PressRow`, a highlight that fades, not scale. Text that acts as a button (headers, titles) uses `Press` with `scale={1}` and `dim={fade.pressed}`. Nothing uses the bare `opacity: pressed ? 0.6 : 1` pattern.
4. **Lists animate layout.** Any row that can appear, disappear, or move is an `Animated.View` with `layout={layout}`, `entering={enter.fade}`, `exiting={exit.fade}`.
5. **Revealed content drops in.** Expand/collapse content uses `enter.drop` / `exit.fade`; the chevron is `DisclosureChevron` (pass `turn` for one that starts pointing down).
6. **Every wait has a skeleton** shaped like the result. Spinners only inside a button that is busy.
7. **Numbers that change roll, words that change slide.** Use `Ticker` for any line with counts, times or prices that update while visible, and pass `direction` when the change has one with no number to compare (a month after a swipe: `useDateDirection`). Use `Swap` for a whole label. Always tabular.
8. **A check-off lands before the row leaves.** On Today a checked row stays in place for two `slow` durations so the tick is seen filling, then sinks out (`exit.sink`) and drops into Completed (`enter.drop`). The last open one plays `success` instead of `complete`.
9. **One haptic per meaning**, through `feedback()`. Tap for presses that navigate, select for choosing, complete/uncomplete for checks, success for a confirmed save, remove for deletions, undo for undo, warning and error for their messages. Never two haptics for one gesture.
10. **Navigation is native.** Detail screens push with the system header and back chevron. Capture, Create, and Review are full-screen covers with an X on the left of the system header. No half sheets for primary flows.
11. **Reduce Motion is automatic.** Reanimated jumps springs and layout animations to their end state when the system setting is on; do not add manual checks, and do not add motion that only works with it off.
12. **Move once, settle once.** Shared springs use at least critical damping and clamp overshoot. Layout and entrances use the bounded timed curve. Completion rings stay fixed while their fill and tick grow in; no expand-then-contract pulses, error shakes, or local bounce curves.

## 4. Checklist for a new screen

- Native header with a title; back chevron for pushes, X for covers.
- Every pressable is `Press` or a highlighted row.
- Every list row has layout, entering, and exiting.
- Every loading state is a skeleton shaped like the content.
- Every number that can change on screen is a `Ticker`.
- Every state change has exactly one `feedback()` cue.
- Rapidly press/release, switch segments, toggle completion, and add/remove rows: no overshoot, recoil, or expand-then-contract pulse.
- Tested on a real iPhone at 120 Hz with Reduce Motion both off and on.

## 5. What is still manual

- Pull-to-refresh is not used; the app has nothing to refresh until sync exists.
- A chart (study hours, deadlines per week) would reuse the week chart's hold-and-drag scrub when it arrives.
- The web keeps one week chart with a drag to swipe; a pointer can't page the native week list.
- Swipe rows give no haptic at the commit line, by rule 9: the release already gives one.
