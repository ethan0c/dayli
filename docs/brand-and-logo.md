# Nowli — Brand & logo plan

Status: draft · October 2026

## 1. Brand platform

| | |
|---|---|
| **Name** | Nowli (always capital D in sentences; lowercase `nowli.` in the wordmark) |
| **Tagline** | Your life, already organized. |
| **Promise** | Send it the mess. Get back a plan. |
| **Positioning** | The personal assistant that turns scattered information into an organized life. |
| **Personality** | Calm · capable · warm · quietly clever. Never hype-y, never corporate, never cutesy. |
| **Feels like** | A friend who's good with schedules, not a productivity coach. |
| **Brand idea** | **"The day, already in order."** Every visual element points back to a single day held in a soft circle: the selected day in the week strip, a ring that fills as the day goes, the dot at the end of `nowli.` |

## 2. Voice
- Talk like a person: "Got it. 3 shifts added."
- Lead with what changed, then the option: "Your Friday shift moved to 5 PM. Update your study block?"
- Reassure without fuss: "Nothing's saved until you confirm."
- Avoid: exclamation marks in system copy, productivity jargon ("optimize", "crush"), guilt ("You missed 4 tasks").

## 3. Logo: the wordmark is the whole logo

Decision (Oct 19, 2026): Nowli has one logo, the `nowli.` wordmark, and it is used everywhere including the app icon, splash, favicon, and social image. There is no separate symbol and no cropped variant. The wordmark is stored as glyph outlines (`packages/tokens/src/wordmark.ts`, generated from Onest SemiBold with −4.5% tracking) so it renders identically in the app, on the web, and in every exported asset.

### 3.1 Wordmark
Lowercase `nowli.` in Onest SemiBold, tracked −4.5%. Two lavender (500) circles: the tittle of the i and the closing period, both 0.19 em wide. Today, and what's next.

- Custom pass before launch: shorten the y descender so it sits tight on the baseline, open the a slightly, and round terminals to match the icon stroke. These make the mark ownable against the word "daily".
- Always lowercase, always with the period. In running text the product is "Nowli".

### 3.2 App icon: the abstract mark (changed Oct 19, 2026)

The app icon, favicon, and avatar use an abstract mark: the wordmark's two dots, enlarged. A large white circle low-left and a small lavender circle high-right on ink ("today, and what's next"). Chosen by the user over a ring, a list, and a day-cell concept. The wordmark stays for everything with room: splash, website header, social image, email. Source: `design/icon-b-dots.svg`; alternates in `design/`. Older text below describes the previous full-wordmark icon.

### 3.2a Previous: the full wordmark
| Variant | Background | Letter | Dot |
|---|---|---|---|
| **Primary (recommended)** | Ink `#1C1B21` (the nav pill color) | White | Lavender 400 `#A796F0` |
| Light | Lavender 200 `#DCD4FB` | Ink | Lavender 600 `#6F57D4` |
| Tinted / dark (iOS 18+) | System | Single-color from the layered file | |

The wordmark spans 78% of the icon width and sits on the optical centre (nudged up 3% of its height). Assets in `design/`: `icon-1024.png`, `icon-light-1024.png`, `splash-icon.png`, `og-1200x630.png`, and the SVG sources; regenerate with the asset script if the outlines change.

### 3.3 Requirements checked
1. Legible at 60 px (iOS icon) and 32 px (browser tab). At 16 px it reads as a shape, which is acceptable.
2. Works in one color: letter and dot in ink or white.
3. Distinct from "daily": the custom letterforms and the double dot carry it.
4. Echoes the UI: the dot is the selected-day circle and the week-strip dots.

## 4. Directions considered and set aside
Five symbol concepts were explored on the brand board (Day Ring, Stacked Day, Note to Plan, Horizon d) before settling on wordmark-only. The Day Ring was the strongest and remains a fallback if a standalone symbol is ever needed for merchandise or a watch face.

## 5. Lockups and clear space
| Asset | Spec |
|---|---|
| Wordmark | `nowli.` as above |
| Icon | The wordmark on ink, as above |
| Clear space | The wordmark's x-height on all sides |
| Minimum size | Wordmark 56 px wide; icon 16 px |
| One-color | All ink or all white, dots included |

## 6. Motion
On launch and after an import is confirmed, the period drops in last. Keep it under 400 ms.

## 7. Color & type in brand use
- Brand color: lavender-500 `#8A74E6` with ink `#1C1B21` and white. Lavender is an accent; never a full-bleed gradient.
- Marketing type: Onest for everything; display set at 400 weight with tight tracking (like the clock). Optional serif accent for editorial marketing only: Fraunces Soft (italic), sparingly.

## 8. Imagery & illustration
- Product screenshots on soft lavender or near-black stages (as in the reference render).
- Real student moments: scrubs, a break room, a library at night, shot warm and natural. No stock "productivity" desks.
- Illustration (empty states): simple rounded shapes from the icon system (circles, pills, the ring), 2 colors max.

## 9. Deliverables & timeline

| Week | Deliverable |
|---|---|
| 0 | Name clearance kicked off (USPTO TESS search, App Store search, domain options: nowli.app, getdayli.com, nowli.co) |
| 1 | Concept round: A–E as sketches → pick 2 for refinement (board already covers this) |
| 2 | Refined Day Ring + custom wordmark; optical corrections; small-size tests |
| 3 | Final logo pack: SVG/PDF masters, PNG exports, lockups, one-color, favicon, app icon layered file |
| 3 | Mini brand guide (this doc + visuals), App Store screenshot template, social avatar |
| 4 | Launch animation (Lottie/Rive): arc sweep + dot drop |

## 10. Name clearance checklist
- [ ] USPTO search classes 9 (software) and 42 (SaaS) for "Nowli", "Daily-" phonetic equivalents
- [ ] App Store + Google Play search for "Nowli" and near-spellings
- [ ] Domain + handles (@dayli / @getdayli / @dayliapp) on Instagram, TikTok, X
- [ ] Search test: does "nowli app" return us within 3 months of launch? Plan ASO accordingly
- [ ] Backups ready: Tendi, Orbi, Kivo (from overview), so brand work can switch without redrawing the system (Day Ring adapts to any name starting with a round letter or used as a standalone mark)
