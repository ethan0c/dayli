# Semli — Brand & logo plan

Quiet direction · Updated October 19, 2026

## 1. Brand platform

| | |
|---|---|
| **Name** | Semli (capital S in sentences; lowercase `semli.` in the wordmark) |
| **Tagline** | Your week, already organized. |
| **Promise** | Send it the mess. Get back a plan. |
| **Positioning** | The daily planner for students balancing school and work. |
| **Personality** | Calm · capable · warm · quietly clever. Never hype-y, never corporate, never cutesy. |
| **Feels like** | A friend who's good with schedules, not a productivity coach. |
| **Brand idea** | **"The day, already in order."** Every visual element points back to a single day held in a soft circle: the selected day in the week strip, a ring that fills as the day goes, the dot at the end of `semli.` |

## 2. Voice
- Talk like a person: "Got it. 3 shifts added."
- Lead with what changed, then the option: "Your Friday shift moved to 5 PM. Update your study block?"
- Reassure without fuss: "Nothing's saved until you confirm."
- Avoid: exclamation marks in system copy, productivity jargon ("optimize", "crush"), guilt ("You missed 4 tasks").

## 3. Logo and symbol

Semli uses the existing outlined `semli.` wordmark where there is room, and the two-dot symbol for the app icon, favicon, avatar, and compact account control. Keep the master paths in `packages/tokens/src/wordmark.ts`; product text and logo lettering have separate font roles.

### 3.1 Wordmark
Lowercase `semli.` in Onest SemiBold, tracked −4.5%. Two matching lavender circles form the i tittle and closing period, sized and positioned from Onest’s letter geometry. Today, and what's next.

- Always lowercase, always with the period. In running text the product is "Semli".

### 3.2 App icon: the abstract mark (changed Oct 19, 2026)

The app icon, favicon, and avatar use an abstract mark: the wordmark's two dots, enlarged. A large white circle low-left and a small lavender circle high-right on ink ("today, and what's next"). Chosen by the user over a ring, a list, and a day-cell concept. The wordmark stays for everything with room: splash, website header, social image, email. Source: `design/icon-b-dots.svg`; alternates in `design/`. The larger dot represents today; the smaller dot represents what comes next.


### 3.3 Requirements checked
1. Legible at 60 px (iOS icon) and 32 px (browser tab). At 16 px it reads as a shape, which is acceptable.
2. Works in one color: letter and dot in ink or white.
3. Distinct from "daily": the custom letterforms and the double dot carry it.
4. Echoes the UI: the dot is the selected-day circle and the week-strip dots.

## 4. Directions considered and set aside
Five symbol concepts were explored on the brand board (Day Ring, Stacked Day, Note to Plan, Horizon d) before choosing the two-dot symbol alongside the wordmark. The Day Ring was the strongest and remains a fallback if a standalone symbol is ever needed for merchandise or a watch face.

## 5. Lockups and clear space
| Asset | Spec |
|---|---|
| Wordmark | `semli.` as above |
| Icon | Two-dot symbol on ink, from `design/icon-b-dots.svg` |
| Clear space | The wordmark's x-height on all sides |
| Minimum size | Wordmark 56 px wide; icon 16 px |
| One-color | All ink or all white, dots included |

## 6. Motion
On launch and after an import is confirmed, the period drops in last. Keep it under 400 ms.

## 7. Color & type in brand use
- Product palette: warm white `#FAF9F6`, ink `#222320`, lavender accent `#7057BD`, and lavender wash `#F0ECF8`. Existing logo masters retain their lavender dot color. Use color sparingly and keep large planning surfaces neutral.
- Type: Inter Regular/Medium for UI and marketing text. Urbanist Regular for large dates and clocks. The Onest SemiBold outlined wordmark is independent of both text roles. Body text uses normal tracking and comfortable line spacing.

## 8. Imagery & illustration
- Product screenshots on soft lavender or near-black stages (as in the reference render).
- Real student moments: scrubs, a break room, a library at night, shot warm and natural. No stock "productivity" desks.
- Illustration (empty states): simple rounded shapes from the icon system (circles, pills, the ring), 2 colors max.

## 9. Deliverables & timeline

| Week | Deliverable |
|---|---|
| 0 | Name clearance kicked off (USPTO TESS search, App Store search, domain options: semli.app, getdayli.com, semli.co) |
| 1 | Concept round: A–E as sketches → pick 2 for refinement (board already covers this) |
| 2 | Existing wordmark + two-dot symbol; optical corrections; small-size tests |
| 3 | Final logo pack: SVG/PDF masters, PNG exports, lockups, one-color, favicon, app icon layered file |
| 3 | Mini brand guide (this doc + visuals), App Store screenshot template, social avatar |
| 4 | Launch animation (Lottie/Rive): arc sweep + dot drop |

## 10. Name clearance checklist
- [ ] USPTO search classes 9 (software) and 42 (SaaS) for "Semli", "Daily-" phonetic equivalents
- [ ] App Store + Google Play search for "Semli" and near-spellings
- [ ] Domain + handles (@dayli / @getdayli / @dayliapp) on Instagram, TikTok, X
- [ ] Search test: does "semli app" return us within 3 months of launch? Plan ASO accordingly
- [ ] Backups ready: Tendi, Orbi, Kivo (from overview), so brand work can switch without redrawing the system (Day Ring adapts to any name starting with a round letter or used as a standalone mark)
