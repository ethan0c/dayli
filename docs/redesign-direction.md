# Semli brand and app redesign proposal

Direction accepted and implementation started · October 19, 2026

Move Semli toward warm white, ink, generous spacing, and open agenda rows. Use lavender for selection and the next relevant item. The product should make a busy school and work week easy to read, with capture always close at hand.

The recommended direction is **Quiet**. **Day brief** is an alternative composition with a larger next-event feature and grouped lists. The interactive exploration lives in `design/explorations/semli-directions.html`. Its dates, courses, and schedules are fictional examples. Quiet is now the implementation direction. The app uses Inter for text and Urbanist for display numerals, custom navigation, open agenda rows, and an Appearance setting to compare Flat and Raised featured cards. See [design-system.md](design-system.md) for the implemented specifications. The original exploration remains a record of the design proposal.

## Reference interpretation

These observations refer to the supplied inspiration board, rather than a fresh review of the apps.

| Reference | Useful visual cue | Application to Semli |
|---|---|---|
| Tiimo | Whitespace, restrained hierarchy, a readable daily list | Give time, titles, and completion controls clear alignment. |
| Structured | A schedule that is understandable at a glance | Use a consistent time column and distinguish events from tasks by their anatomy. |
| Opal | One dominant object or idea per composition | Each screen has one clear focus; marketing frames one product benefit at a time. |
| Stardust | An identity that carries across screens | Repeat the two dots, wordmark, and lavender accent consistently. |
| Mello | A specific student context | Show real work: syllabi, shifts, assignments, and exams. |

Semli's own visual signature is a small pair of dots and a clear vertical sequence of information. Large color fields belong in occasional marketing compositions; ordinary planning screens use mostly neutral space.

## Brand direction

Keep the Semli name, lowercase `semli.` wordmark, and existing two-dot symbol. The latest icon decision in `brand-and-logo.md` takes precedence over its older wordmark-only sections. Retain the existing outlined wordmark assets for production.

**Positioning:** The daily planner for students balancing school and work.

**Brand promise:** Send it the mess. Get back a plan.

**Primary public headline:** Your week, already organized.

The personality is calm, precise, and approachable. Warmth comes from typography, spacing, and human language. Color provides emphasis. Product copy names the next action or a concrete result:

- Capture: “Add anything.”
- Processing: “Reading your schedule…”
- Review: “3 shifts ready to review.”
- Uncertainty: “What time does this start?”
- Confirmation: “Added 3 shifts.” with an Undo action.
- Empty day: “Nothing planned yet.” with “Add something.”
- Conflict: “Your shift overlaps Pharmacology.” with “Review overlap.”

## Visual system

### Palette

| Role | Light | Dark | Use |
|---|---|---|---|
| Canvas | `#FAF9F6` | `#151515` | Main app background |
| Surface | `#FFFFFF` | `#202020` | Sheets and inputs |
| Quiet fill | `#F0EFEB` | `#292929` | Pressed or secondary controls |
| Primary ink | `#222320` | `#F5F4F0` | Titles, main actions |
| Secondary ink | `#686963` | `#B4B4AC` | Time, context, metadata |
| Divider | `#E5E4DE` | `#363632` | Section structure |
| Control outline | `#82837B` | `#92938A` | Empty completion circles |
| Lavender accent | `#7057BD` | `#C3AFF8` | Selection and accent text |
| Lavender wash | `#F0ECF8` | `#2B253A` | One upcoming event or selected context |
| Conflict ink | `#9F431F` | `#E8A274` | Overlap label and alert icon |
| Conflict wash | `#F8EDE5` | `#3A2A20` | Local conflict surface |

Aim for roughly 85–90% neutral surfaces in a populated screen. This is an art direction guide, not a measured requirement. Course colors can remain as small labeled markers; full-row category fills become an optional preference to evaluate later. Every category keeps a text label. Reserve conflict colors for an issue that requires attention.

### Type and geometry

Use Inter Regular and Medium for readable UI text, with 17/24 pt body text and normal label tracking. Keep Urbanist for large display numerals; the separate outlined wordmark uses Onest SemiBold. Use a single strong screen heading, regular row titles, and medium section labels. Large dates belong on the alternative Day brief screen; the clock becomes secondary context in Quiet.

| Element | Proposed size and treatment |
|---|---|
| Main screen heading | 34/38 pt, medium, slightly tight tracking |
| Editorial date in Day brief | 56/56 pt, regular |
| Section title | 17/22 pt, medium |
| Item title | 16/22 pt, regular |
| Time and secondary context | 13/18 pt, medium or regular |
| Screen gutter | 24 pt |
| Section separation | 28–32 pt |
| Agenda row | At least 64 pt; grows with wrapping and text size |
| Interactive target | At least 44 × 44 pt |
| Control and inset-surface radius | 12–16 pt |
| Sheet radius | 28 pt |

Use whitespace and alignment to group ordinary items. Use one surface around the next event when useful. Dividers separate sections or rows in dense views. Shadows are reserved for temporary floating surfaces. Use the shared custom three-tab pill and detached Add control on iOS and web, preserving the layout from the exploration.

## App designs

### Today

Quiet opens with the date, “Your Monday,” and a brief count of commitments. One lightly tinted next-event row appears above an open list. To-dos have trailing completion circles. Later events use the same time column as the next item. Coming up is a short text list below today's work.

The default reading order is date → next commitment → today's open tasks and later events → coming up. A real overlap moves directly under the heading, ahead of the next commitment. Completed tasks collapse into a disclosure. “Start today,” overdue work, pending imports, and suggestions use contextual disclosures or a single actionable message instead of several stacked permanent cards.

Day brief tests a different reading order: large date → prominent next event → grouped To do and Later lists. It offers a stronger feature moment while showing fewer commitments at once. Quiet is preferred for dense student schedules.

### Plan

Keep the seven-day strip. Put the month and selected date above it; the selected date uses a dark circle. Today also has a text-accessible identity when another day is selected.

The agenda below is an open list with a stable time column. Events show start/end or duration; untimed tasks say “To do.” Course or employer context is secondary text. All-day events say “All day.” Only tasks show completion controls. Browse other dates without changing the Today dashboard's date.

Retain day/week/month navigation where implemented. Week and month need a separate design pass using the same hierarchy. An unpublished work schedule must still read “Schedule not added”; a visually empty week cannot imply known availability.

### School

Use a course list with course code, name, and one useful next deadline. A small course marker carries existing course identity. Open course detail for meeting patterns, assignments, exams, and the retained syllabus source. Add a syllabus through the shared capture flow.

Keep counts narrow and concrete, such as “2 deadlines this week.” Move semester configuration and source-management controls into course detail. Empty School explains that importing a syllabus creates a course and proposes dates for review.

### Capture and review

Keep the detached Add entry. Preserve manual To-do and Event creation alongside “Tell Semli.” The concept shows the AI route: one text area plus Photo, File, and Voice. Media controls in the exploration are demonstrations; the app implementation uses the existing acquisition pipeline.

Review uses a grouped list with editable fields, inclusion controls, the original source, and one commit action: “Add 3 shifts.” Uncertain fields ask a specific question. Changes to a previously imported schedule show old → new values; removals are explicit. Review remains mandatory before AI-created items enter the plan. Save is one undoable batch.

## States and accessibility

| State | Design behavior |
|---|---|
| Empty | One explanation and one capture action; sample content stays explicitly labeled and opt-in. |
| Busy | Preserve all items, wrapping titles and useful time context; reduce decoration before reducing information. |
| Overlap | Alert icon, explicit conflicting titles/time, and a Review overlap action. |
| Completed | Checked circle and struck title; completed group remains discoverable. |
| Reading | Source filename/thumbnail and a specific processing label; retain input on failure. |
| Ambiguous | Highlight the unresolved field and state the question beside it. |
| Offline or failed import | Preserve the source and offer Retry with the actual state. |
| Unpublished shifts | Explicit “Schedule not added” state in Plan. |
| Large text | Rows grow; metadata wraps; trailing controls stay reachable. |
| Dark appearance | Neutral dark surfaces, lighter ink, deep lavender wash; preserve hierarchy. |

Text must meet 4.5:1 contrast and completion outlines 3:1 on their actual backgrounds. Verify final token combinations and both appearances when promoting tokens. VoiceOver should announce item kind, time, completion, and conflicts. Do not encode category, urgency, or selection through color alone. Reduce Motion uses immediate state changes or brief crossfades. Keep source and undo actions accessible in the simplified layouts.

## Marketing application

Use one short sentence, one product screen, and generous whitespace per App Store frame. Start with these three stories:

1. “Your week, already organized.” — populated Plan screen.
2. “Send your schedule. Get your week back.” — screenshot → review → agenda.
3. “School and work, in one place.” — course deadline beside a work shift.

Use warm white and ink stages with occasional flat lavender. Screenshots carry realistic content at a readable scale. Keep the two dots as a small repeated signature. Any extraction result or time-saving claim used in published copy must reflect demonstrated product behavior.

## Implementation sequence

1. **Set the visual baseline.** Compare Quiet and Day brief using the same sample day; review light/dark, a dense day, and long titles. Choose the composition before changing shared tokens.
2. **Build one complete Today screen.** Introduce semantic tokens and shared open event/task rows. Preserve store behavior, warnings, completion, undo, and navigation. Verify populated, empty, conflict, overdue, and large-text states on iPhone.
3. **Apply the system to Plan and School.** Update week selection, agenda rows, course rows, and detail screens. Validate day browsing, overnight shifts, all-day events, and course identity.
4. **Finish capture and review.** Restyle acquisition, processing, uncertainty, diffs, source detail, and confirmation as one flow. Exercise text, photo, and PDF imports through review, save, and undo.
5. **Extend the approved system.** Update onboarding, settings, subscription screens, landing pages, and App Store frames after the core screens are coherent. Resolve the older contradictory logo instructions when publishing the updated brand guide.

The implementation is ready when users can identify the next commitment, add an item, find a deadline, review an import, and recover an accidental change without losing information that the current app exposes. Run the relevant contrast checks, lint, typecheck, and existing behavior tests when app code changes.
