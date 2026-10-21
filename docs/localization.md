# Localization: the markets, the order, the tooling

Status: plan, Oct 21, 2026. Nothing here is built. Semli ships in US English only, with US semesters, a US-dollar paywall, and Canvas as the LMS. Roughly 400 user-facing strings in the app (`<T>` text plus labels, subtitles and placeholders), no i18n library, `expo-localization` installed but unused, three `toLocaleDateString()` calls, and `formatTime` hard-coded to am/pm.

## 0. The honest premise

Localization is not translation. For a planner, each market is three things a translator cannot supply: **the academic calendar** (when terms start and end, so "until when?" guesses right), **the LMS** (which feed to connect), and **the date and clock conventions** (24-hour time, day-before-month, Monday weeks). Get those wrong and a perfectly translated app says "Fall semester ends Dec 11" to a German student whose Wintersemester ends in March, with a Moodle she cannot connect.

So the plan is staged by cost: first the markets that need **no translation** (ASO and calendars only), then the markets worth a full translation, and only when a store page shows demand.

## 1. The markets

Per-user App Store spend is highest in, roughly this order: United States, Japan, United Kingdom, Australia, Canada, Germany, Switzerland, the Nordics (Norway, Denmark, Sweden), the Netherlands, South Korea, France, New Zealand, Ireland, Austria, Singapore, Finland, Taiwan, Hong Kong. The order is directional: no public source gives a clean 2026 per-country subscription ARPU table, and the vendor blogs that rank markets disagree with each other ([LocalizeListings](https://localizelistings.com/blog/12-highest-revenue-app-store-markets), [AppsOps](https://appsops.store/blog/app-store-subscription-arpu-by-geography-2026), [Apptunix](https://www.apptunix.com/blog/apple-app-store-statistics/)). The US is 40–50% of global App Store spend; Japan is second and its subscribers renew longer; Australia and the UK are high-ARPU with English parity. Once Semli is live, **App Store Connect → Sales and Trends by territory** replaces every number in this section.

What matters more than ARPU for a student planner: **English-medium universities, a syllabus culture, and an LMS with a calendar feed.** That reorders the list.

| Tier | Markets | Language | Term system | Dominant LMS | What it takes |
|---|---|---|---|---|---|
| **A. No translation** | United States, Canada, United Kingdom, Australia, Ireland, New Zealand, Singapore | English (en-US, en-GB, en-AU, en-CA variants) | US/CA semesters; UK three terms (Sep–Dec, Jan–Mar, Apr–Jun); AU/NZ two semesters (Feb–Jun, Jul–Nov) | Canvas (US, CA, AU, UK, NZ), Moodle and Blackboard (UK, IE), Brightspace (CA) | Store listing per storefront, local calendars, local pricing, LMS feeds, spelling and clock conventions |
| **B. Translate, high value** | Germany, Austria, Switzerland (de); Netherlands (nl, but English listings convert well); Norway, Denmark, Sweden, Finland (local, English fallback widely accepted); Japan (ja) | de, nl, nb, da, sv, fi, ja | DE/AT/CH: Wintersemester Oct–Mar, Sommersemester Apr–Sep; NL: Sep–Jan, Feb–Jul; Nordics: Aug–Dec, Jan–Jun; JP: Apr–Sep, Oct–Mar | Moodle, itslearning (NO, DE), Canvas (NL, SE, NO), Brightspace (NL); JP: manaba, WebClass, Google Classroom | Full app and listing translation, native review, calendar and LMS per market, 24-hour clock, day-month order |
| **C. Later** | South Korea (ko), France (fr), Taiwan (zh-Hant), Hong Kong (en/zh) | ko, fr, zh-Hant | KR: Mar–Jun, Sep–Dec; FR: Sep–Jan, Jan–May | KR: own campus portals; FR: Moodle | Same as B, plus LMS access is weaker; wait for Tier B results |

Japan sits in B rather than C because of spend and renewal behaviour, but it is the hardest: a different syllabus culture (the "シラバス" is a catalogue entry, not a schedule), campus portals without feeds, and the extraction model reading Japanese schedules needs its own eval set. Treat it as its own project.

## 2. What "localized" means for Semli, in order of leverage

1. **Store listing per storefront** (name, subtitle, keywords, description, screenshots). The cheapest and the most measurable: Apple reports impressions and conversion per territory. Do this for every Tier A storefront before translating one string of the app.
2. **Pricing per storefront.** Apple's price tiers per territory, set in App Store Connect; RevenueCat returns the local `priceString`. Decide equalized (Apple's automatic conversion) vs manual (round local numbers: £3.99, A$7.99, €4.99, ¥700). Manual, rounded, for Tier A and B; the survey's "$1–5" band is a US fact, and local anchors (Structured's local prices) are the comparison students make.
3. **Academic calendar per region.** `typicalTermEnd` becomes `typicalTermEnd(start, region)`, with a table per country and a quarter/semester (or trimester) choice in onboarding where a country has both. The region comes from `expo-localization`'s `regionCode`, overridable in You.
4. **Date, time and week conventions.** Replace the hand-rolled `formatTime`/`formatRange` with `Intl.DateTimeFormat` driven by the device locale (`hour12` from the locale, not hard-coded); day-month order in `monthDay` and the cue parser (`10/24` is October in the US and nonsense in the UK; `24/10` is the reverse). Weeks already start Monday. Pass `locale` and `region` in `ExtractContext` so the model resolves `7/10` correctly and reads local spellings.
5. **LMS feeds.** Canvas is a Tier A win; Moodle, Blackboard, Brightspace and itslearning all publish iCal feeds and are the difference between "nothing to connect" and a full semester in Germany, the UK and the Nordics. Already on the phase-2 list; localization moves it up.
6. **The app's strings.** Only after 1–5 show a market converting on its English store page. ~400 strings today; German runs 30% longer, so the paywall rows, pills and the Today header need room.
7. **The website.** Localized landing pages with `hreflang` (`next-intl`, `/de`, `/ja`), the pricing page per currency, the try-it demo in the local language (the model handles it; the sample text does not).
8. **Legal and support.** Privacy and terms translated for Tier B (a machine translation reviewed by a native speaker is acceptable for a beta; not for launch); support stays English with translated canned replies; EU consumer-rights and GDPR wording on the account page (data minimal already; the deletion flow exists).

## 3. The tooling

| Need | Choice | Why |
|---|---|---|
| App strings | **Lingui** (`@lingui/core`, `@lingui/react`, the Babel/SWC macro) with ICU messages in `.po` catalogs per locale | Compile-time extraction from `t\`…\`` and `<Trans>`, real plurals and selects, a pseudo-locale for testing, works with Expo and the React Compiler. `react-i18next` is the common alternative; Lingui's extraction and catalog diffing fit a solo developer better than hand-maintained JSON. |
| Device locale and region | `expo-localization` (`getLocales()[0].languageTag`, `regionCode`, `uses24hourClock`, `firstWeekday`) | Already installed. Region drives calendars, pricing display and the cue parser; language drives strings. The two are separate on purpose (a German student in Canada). |
| Dates and times | `Intl.DateTimeFormat` / `Intl.NumberFormat` from Hermes | Hermes ships full ICU on iOS; no polyfill needed. One `lib/format.ts` (already on the todo list to consolidate) becomes the only place a date or time is turned into text. |
| Store listings | **EAS Metadata** (`store.config.json`, `eas metadata:push`) | Every storefront's name, subtitle, keywords, description, promotional text and release notes in one versioned file; no clicking through App Store Connect per language. |
| Screenshots | `design/render-screenshots.py` with a captions table per locale | The pipeline exists; add a `--locale` that swaps the caption strings and the simulator language (`xcrun simctl` with `-AppleLanguages`). |
| Keyword research | App Store search suggestions per storefront (free, in the App Store app with the region switched), then one paid tool (AppTweak or Astro) once Tier A listings exist | Student search terms differ by country ("uni planner", "Stundenplan", "時間割"), and the free suggestions are what students actually see. |
| Translation | Claude with a project glossary and the ICU catalog as input, then **one native-speaker student per market** paid in Plus (a year) to review in the app, not in a spreadsheet | Machine-first is fine for a beta; the reviewer catches what the glossary cannot (the register for "shift", "due", "Plus"). The glossary lives in `docs/localization-glossary.md` when the first locale starts. |
| Pseudo-localization | Lingui's `pseudo` locale in dev builds | Finds hard-coded strings, truncation and concatenation before any translator does. Run it before Tier B starts. |
| Measurement | PostHog person properties `locale` and `region` (next to `role`, `major`, `lms`); App Store Connect per territory | Conversion by storefront decides which Tier B market gets a translation. |

What not to add: a translation-management SaaS (Lokalise, Crowdin). The catalogs are a few hundred strings; a `.po` file in git plus one reviewer per language is enough until there are five languages.

## 4. Sequence

| Step | Scope | Gate to start | Done when |
|---|---|---|---|
| 1 | **Make the code locale-safe.** `lib/format.ts` through `Intl`; `typicalTermEnd(start, region)`; `locale`/`region` in `ExtractContext` and the cue parser; the `region` and `locale` person properties; pseudo-locale wired. No translation yet. | The device pass of Phase 1 | US behaviour unchanged (tests), UK date `24/10` read correctly in an eval, 24-hour clock on a de-DE device |
| 2 | **Tier A storefronts.** Listings via EAS Metadata for GB, AU, CA, IE, NZ, SG with local spelling and terms; local prices; UK and AU calendars; LMS feeds for Moodle and Blackboard. | Step 1; the US listing converting at a known rate | Impressions and conversion per territory visible in App Store Connect for a month |
| 3 | **Pick the first Tier B market by data**, likely Germany (spend, Moodle, a syllabus-like "Modulhandbuch") or the Netherlands (English-tolerant, Canvas, cheap to validate). Translate the listing first; the app only if the listing converts. | Step 2 numbers | Store-page conversion in that storefront within 20% of the US rate on the English listing, then the translated app ships |
| 4 | **Japan** as its own project: listing, app, a Japanese extraction eval set, a portal strategy. | A Tier B market paying | Japanese syllabus eval at the US pass rate |

## 5. What this costs

- Step 1 is engineering only, about a week, and it also fixes real bugs for US users with 24-hour clocks or non-US date settings.
- Step 2 is a few days of listing work plus pricing decisions; screenshots are a script run per locale.
- Each Tier B language is roughly: two days of machine translation and catalog work, a reviewer's week of in-app review, and the calendar/LMS work for that country. Budget a year of Plus per reviewer and expect two review rounds.
- The ongoing cost is every new string in every release. Lingui's catalog diff makes it visible; the rule is that a release with untranslated strings in a shipped locale waits for them.

## 6. Risks worth naming

- **Translating before the product fits one campus.** Every locale multiplies the cost of every copy change. Step 2 exists so that the question "does a UK student want this?" is answered with an English listing before a translator is paid.
- **The extraction model in other languages.** It reads German and Japanese fine in general; the eval set does not cover them. Each Tier B market needs ten real documents in the eval fixtures before launch there.
- **Canvas's share abroad.** It is the first integration because it is 71% of one US survey. In Germany it is near zero. The LMS answer in onboarding (`settings.lms`) tells you the share per country from day one; read it before building the next feed.
- **Name and brand.** "Semli" reads fine in every Tier A and B language checked (no meaning in German, Dutch, the Nordic languages or Japanese katakana セムリ); check Korean and French before Tier C.
