# Motion: the Robinhood teardown and Semli's rules

Status: Oct 19, 2026. Goal from the founder: every interaction as smooth and intentional as Robinhood's. This doc lists what Robinhood actually does, maps each move to Semli, and sets the rules the code enforces through `packages/tokens/src/motion.ts`, `apps/mobile/src/lib/motion.ts`, and the `Press` component.

## 1. What Robinhood does, interaction by interaction

| Where | What happens | Why it feels premium | Semli equivalent |
|---|---|---|---|
| Any button or card | Shrinks about 3% and dims slightly on touch-down, springs back on release. Never a snap. | The screen answers the finger before the action happens | `Press` everywhere. Rows highlight instead of shrinking, like iOS Settings |
| Portfolio value | Digits roll vertically to the new number, one column at a time, tabular widths | Change is shown, not swapped | `Ticker`: the Plan clock, later counts and prices |
| Chart scrub | A selection haptic on every data point; the value above ticks as you drag; the line fades everything after the finger | Touch and sound and number all agree | Week strip pill slides between days with a selection haptic; same rhythm for any future graph |
| Range tabs (1D, 1W…) | Selected pill slides to the new tab on a spring; the chart crossfades | One moving element, never two things popping | Week strip pill; segmented controls in Reminders |
| Lists | New rows fade in and others slide to make room; removed rows fade out and the list closes the gap | Nothing jumps | `layout` transition on every list row in Today, Plan, School |
| Loading | Grey rounded placeholders in the exact layout of the content, pulsing | You already know what's coming | `Skeleton`, `SkeletonRows`, the Reading state, PlanPicker prices |
| Toasts and sheets | Rise on a spring with no overshoot, sink on exit | Weight without bounce | Toast enter/exit, onboarding steps |
| Navigation | Full-screen pushes with the native iOS header and back chevron; flows that need their own context slide up as full-screen covers with an X in the header, not half sheets | Native transitions are free, interruptible, and 120 Hz | Item detail and Settings push; Capture, Create, Review are full-screen covers with an X |
| Tab bar | The system tab bar; icons switch between outline and fill | It's iOS | `NativeTabs` with the Liquid Glass "+" in the bottom accessory |
| Confirmation | A full-screen success with a drawn checkmark and one success haptic | The one moment that earns a celebration | Review confirm toast + success haptic today; a full-screen "Added" moment is a later candidate |
| Haptics | Light impact on press, selection tick on scrub and segment change, success notification on an order | Same event, same tap, every time | `feedback()` cues: tap, select, complete, success, remove, undo, warning, error |
| Type | Capsule, their proprietary grotesk, tabular numerals everywhere numbers change | Numbers line up when they tick | Tabular numerals on every count and time |

Robinhood's app is native Swift. None of the behaviours above need Swift: Reanimated runs them on the UI thread, the stack and tab bar are native, and the haptics are the system engine. What Robinhood has that we did not is discipline: one set of curves, applied everywhere. That is what the tokens are for.

## 2. The tokens

From `packages/tokens/src/motion.ts`:

| Token | Value | Use |
|---|---|---|
| `spring.snappy` | damping 22, stiffness 380, mass 0.9 | Anything under the finger: press, toggle, check, chevron, segment |
| `spring.gentle` | damping 26, stiffness 190, mass 1 | Anything moving on its own: list re-flow, toast, pill slide, digit roll |
| `duration.fast` | 120 ms | Exits and dims |
| `duration.base` | 220 ms | Fades and reveals |
| `duration.slow` | 360 ms | Screen-level fades |
| `pulse` | 700 ms | Each half of a skeleton's breath |
| `easing` | cubic-bezier(0.2, 0, 0, 1) | The only timed curve |
| `press` | scale 0.97, opacity 0.88 | Press feedback |
| `stagger` | 45 ms | Delay between siblings entering together |

`apps/mobile/src/lib/motion.ts` turns these into Reanimated configs: `springs.snappy`, `springs.gentle`, `ease`, `layout`, `enter.{fade,rise,drop,fromRight,fromLeft,staggered(i)}`, `exit.{fade,sink}`.

## 3. Rules

1. **No raw numbers in animations.** Durations, springs, and easing come from the tokens. A new need means a new token, not a local constant.
2. **No `Animated` from react-native.** Reanimated only, so everything runs on the UI thread. (`LayoutAnimation` is also out.)
3. **Buttons and cards use `Press`.** Rows (settings, agenda) use a background highlight, not scale. Nothing uses the bare `opacity: pressed ? 0.8 : 1` pattern.
4. **Lists animate layout.** Any row that can appear, disappear, or move is an `Animated.View` with `layout={layout}`, `entering={enter.fade}`, `exiting={exit.fade}`.
5. **Revealed content drops in.** Expand/collapse content uses `enter.drop` / `exit.fade`; the chevron rotates on `springs.snappy`.
6. **Every wait has a skeleton** shaped like the result. Spinners only inside a button that is busy.
7. **Numbers that change roll.** Use `Ticker` for counts, times, and prices that update while visible. Always tabular.
8. **A check-off lands before the row leaves.** On Today a checked row stays in place for two `slow` durations so the tick is seen filling, then sinks out (`exit.sink`) and drops into Completed (`enter.drop`). The last open one plays `success` instead of `complete`.
9. **One haptic per meaning**, through `feedback()`. Tap for presses that navigate, select for choosing, complete/uncomplete for checks, success for a confirmed save, remove for deletions, undo for undo, warning and error for their messages. Never two haptics for one gesture.
10. **Navigation is native.** Detail screens push with the system header and back chevron. Capture, Create, and Review are full-screen covers with an X on the left of the system header. No half sheets for primary flows.
11. **Reduce Motion is automatic.** Reanimated jumps springs and layout animations to their end state when the system setting is on; do not add manual checks, and do not add motion that only works with it off.

## 4. Checklist for a new screen

- Native header with a title; back chevron for pushes, X for covers.
- Every pressable is `Press` or a highlighted row.
- Every list row has layout, entering, and exiting.
- Every loading state is a skeleton shaped like the content.
- Every number that can change on screen is a `Ticker`.
- Every state change has exactly one `feedback()` cue.
- Tested on a real iPhone at 120 Hz with Reduce Motion both off and on.

## 5. What is still manual

- A full-screen success moment after the first confirmed import (checkmark draw, one success haptic). Candidate for the launch polish pass.
- Pull-to-refresh is not used; the app has nothing to refresh until sync exists.
- A chart (study hours, deadlines per week) would reuse the week-strip scrub rhythm when it arrives.
