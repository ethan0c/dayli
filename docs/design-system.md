# Semli design system

Decided October 19, 2026. The live, readable version is the design-system page: https://claude.ai/artifact/Y3JnVE1gxVuvGrxjq795Z2. The review canvas with every screen is https://claude.ai/artifact/QgE4ddmEytZ2PyHMCT3QoV. Keep this file and the page in step.

## Direction
Robinhood's 2024 identity is the reference: neutrals first, one accent used sparingly, a simplified mark next to a wordmark, one typeface, "less is more". Smoothness is discipline, not the language the app is written in.

- Ink on paper. About 72% of any screen is paper and surfaces, 18% ink, 7% grey rows, 3% accent.
- One big number per screen (Light, 56px). Everything under it is one step smaller than iOS defaults. Contrast reads as premium, size does not.
- Color only when it means something: red is behind, green is ahead, amber is "Semli needs something from you".
- Pills act, rectangles hold. Every action is fully round; rows, cards, fields and composers keep corners.
- No decoration: no tinted cards, no icon tiles, no illustrations, no logo on in-app screens. Photography only on moment days and showcase pages.

## Brand
- Mark: two dots (big = today, small accent = next), ratio 240 : 102 on a fixed diagonal. `design/icon-b-dots.svg`.
- Wordmark: Geist SemiBold; the tittle of the i and the full stop are the two dots. Regenerate outlines from Geist (open item). Mark and wordmark use the app's ink and accent values, never their own.
- Where it appears: app icon, splash, onboarding welcome, settings footer, website, store. Never on Today, Plan, School or other in-app screens. "You" is the fourth tab; there is no account button in a header.

## Color
Six roles (light / dark): paper #FAF9F6 / #151515 · row #F0EFEB / #292929 · surface #FFFFFF / #202020 · ink #222320 / #F5F4F0 · secondary #686963 / #B4B4AC · line #E5E4DE / #363632 · accent #7057BD / #C3AFF8. Status: red #A2342F / #FFACA4 (bg #FBEDEB / #3B2524), green #246C43 / #5CC08A (bg #DDF2E6 / #16301F), amber #80510A / #E2A84B (bg #FBEFD5 / #3A2D14).

The accent (lavender, kept) is allowed in exactly five places in the app: the small dot in the mark, text buttons, the now-marker on the timeline, the word Plus, the selected week day. Course and category tints are a 6px dot beside text, never a fill.

Meaning: filled red pill for due today / overdue; red text on a grey pill for a colliding time; green pill for done and newly added, green check when complete; grey pills for times and neutral states; amber only when Semli needs input.

## Type
Geist, one face, four weights: Light 300 for the one big number, Regular 400 for section titles and text, Medium 500 for pills and the primary label, SemiBold 600 for the wordmark only. Tabular numerals wherever a number can change. Sentence case always.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| displayXl | 56 / 60 | 300 | The one big number (countdown, price, moment) |
| display | 34 / 40 | 300 | Screen heading on covers, the item title |
| title | 24 / 30 | 400 | Section titles with a chevron |
| headline | 16 / 22 | 500 | Button labels |
| body | 16 / 22 | 400 | Rows and text |
| callout | 14 / 20 | 400 | Supporting lines, eyebrows |
| subhead | 13 / 18 | 500 | Text buttons, pills |
| caption | 12 / 16 | 400 | Secondary context; never smaller |
| overline | 13 / 18 | 500 | Sentence-case group labels |

Fonts load locally on iOS from the Geist release (OFL); the web uses the same files.

## Buttons
Five roles, all fully round, press shrinks 3% and dims to 88% on `spring.snappy`, one haptic per role.
1. Primary: ink fill, 52 high, one per screen. Haptic tap.
2. Secondary: grey fill, same pill. Chips are the 40-high version; tiles (icon + label) the 64-high version. One component shared by capture and onboarding.
3. Text: accent, underlined (offset 5, 1.5px); muted variant in grey without underline. Haptic select.
4. Icon: 44 circle, grey or ink. The glass plus in the tab bar is the one 56 exception.
5. Destructive: a text button in red, confirms inline. No filled capsule, no SwiftUI bordered button.

Rows are not buttons: they highlight on press and never shrink. Icons in ink, no tiles behind them. The onboarding choice card (two lines) is the one rectangular secondary at radius 16.

## Icons
One outline set in content (`apps/mobile/src/components/Icon.tsx`): 24-unit grid, 1.75 stroke, round caps and joins, no fills. Sizes: 24 in heroes and tiles, 20 in rows and buttons, 16 only for chevrons. Colors: ink for the subject, grey for navigation and metadata; accent only on sparkle when it marks an AI result. New glyphs: send, remove, appearance, list.

Native chrome uses the matching SF Symbol: Today `house`, Plan `calendar` (was checkmark.square), School `graduationcap`, You `person`, add `plus`. Everything else is drawn by us.

## Chrome and inputs
- Headers: system bar, our chevron and X at 1.75 stroke, Geist 16 Medium title, paper background, no shadow, hairline only when content scrolls under.
- Fields: one line is a pill (52 high); rest grey with no border, focus white with a 1.5px ink ring. Never a blue ring.
- Composer: white rectangle, radius 20, attachment icons inside, send as an ink circle. Replaces textarea plus tiles.
- Date and time fields: grey pills (36 high) that open the native picker.
- Toggle: ink when on, hairline grey when off. Segmented control: sliding pill with a selection tick. Check: grey ring, green when done. Radio: ink dot.
- Progress: eight-segment ink bar in onboarding; a 2px line under the header while loading. Toast: ink, rises on `spring.gentle`.
- Nothing from the system default palette: no blue tint, no green toggle, no bold chevron.

## Navigation
- Liquid Glass tab bar with four tabs: Today, Plan, School, You. The plus is a glass button in the bottom accessory on iOS 26, floating above the bar on older iOS.
- Detail screens push with the system header and back chevron (item detail, settings pages).
- Flows slide up as full-screen covers with an X on the left (Add, Create, Review). No half sheets for primary flows.
- Loading is a progress line, never a spinner or a bouncing-dots box; results fill in as rows.

## Motion
Tokens in `packages/tokens/src/motion.ts`, presets in `apps/mobile/src/lib/motion.ts`, rules in `docs/motion.md`. Two springs (snappy 22/380/0.9, gentle 26/190/1), three durations (120/220/360), one easing (0.2, 0, 0, 1), press 0.97/0.88, stagger 45ms. Lists animate layout; revealed content drops in; numbers roll; every wait has a skeleton; one haptic per meaning.

## Screens
- Today: no header, no cards. Countdown to the next commitment as the big number, the day as a timeline bar (green done, ink booked, red overlaps, hairline now), then "On your list" and "Coming up" at 24 Regular with chevrons, rows with status pills.
- Moments: on days that matter, a photo becomes the header fading into the paper and the big number becomes the moment. No promo carousel, no counter, no X.
- Add: composer, recent-screenshots strip, two "start with" rows. Reading: progress line and rows filling in with New pills.
- Item detail: pushed; light title, large time pair, plain rows, Notes and Same week, primary pill, destructive text button.
- You: pushed from the You tab; name as the big element, field and role, trial pill, hairline rows in five groups, footer with mark, version, legal links.
- Onboarding: eight steps; one-tap rows, pill chips, a composer for the own import; Watch it work, Heads-up and Plus are full-bleed photo pages in dark.

## Applied in code (Oct 19, 2026)
Geist fonts and tokens; the new type scale; pill buttons and the five roles (`components/Controls.tsx`); hairline rows with status pills (`ItemRow`); the Today countdown, day timeline (`DayBar`) and sections; the composer Add screen; the item detail; the You tab and settings home without tiles; the ink toggle; the progress-line loading state; the wordmark regenerated from Geist SemiBold (`packages/tokens/src/wordmark.ts`, `design/wordmark-*.svg`); the four new glyphs; the Plan tab symbol.

## Open items
- Moments: the photo header on special days needs a calendar of breaks and finals, and licensed photos (Unsplash with attribution, or a commissioned set).
- Recent-screenshots strip on Add needs `expo-media-library`; left out until the dependency is approved.
- Showcase onboarding steps (Watch it work, Heads-up, Plus) ship on paper until photos are sourced; the layout is ready for a full-bleed image.
- App icon, splash and store assets regenerated from the new wordmark with the app's ink and accent.
- Verify 12px captions on a real phone in bright light; 13 is the fallback.
