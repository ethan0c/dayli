# Extraction benchmark

This suite calls the same `extract()` function used by the app. It contains 30
handwritten synthetic messages, 10 public work-schedule images from three vendors,
and five public university syllabi. Public vendor examples are demonstration
schedules, not private customer uploads. The set was deliberately selected for
difficult layouts; it is not a random or representative sample of users.

## Run

Use Node 22 or newer and install the workspace dependencies with `npm ci`.

```sh
npm run eval:download
npm run eval:extract -- --validate
npm run eval:typecheck
npm test
npm run eval:extract -- --out evals/reports/full.json
```

Live runs use `ANTHROPIC_API_KEY` from the environment or `apps/web/.env` and incur
provider charges. Validation and unit tests make no model calls. Downloads are
SHA-256 checked against `sources.json`; if a source changes, review the image/PDF
and annotations before accepting a new hash. Media and raw reports are ignored by
git. Source URLs and expected answers remain in `cases.json`.

For diagnosis, add `--kind text`, `--kind image`, `--kind pdf`, or
`--case image-wiw-user`. A subset run cannot pass the full release gate. Alternate
fixture files can be supplied with `--manifest path/to/cases.json`.

## Scoring

Expected answers were checked against the original schedules and syllabus text,
including rendered calendar tables. Each annotation explains the source-specific
rules in `notes`. Cases marked `complete: false` remain diagnostic probes and can
never qualify for release.

- Each expected item's date, start/due time, and end time is checked exactly,
  including null values. A missing item loses all three fields.
- A one-to-one assignment matches natural title patterns, using date/time matches
  to distinguish repeated shifts or assignments. Duplicate output counts as extra.
- Specified categories, deadlines, recurrence fields, required questions, and
  document metadata are graded separately.
- A full pass requires at least 30 texts, 10 screenshots across three formats, and
  five PDFs, with complete annotations and successful responses for every case.
  **Each input type** must reach 95% date/time accuracy, 95% item recall, 95% of
  other annotated fields, and no more than 2% extra items.

Reports checkpoint every response and retain per-case errors, field mismatches,
actual output, token usage, latency, model, prompt version, input hashes, and a
fixture hash. Provider/authentication failures do not count as successful outputs.
The command exits nonzero unless the full gate passes.

## Annotation decisions and limits

Syllabus class patterns count once; dates of individual generated recurrences are
not expanded. Separate meeting times require separate patterns. In-class tests
use the listed class hours unless another time is specified. Due-time policies
apply across pages: NJIT explicitly requires noon submissions, while reading-only
preparation has no stated cutoff. Readings paired
with a response assignment may be grouped with that assignment. Lecture topics,
optional readings or office hours, breaks, and conditional institutional policies are excluded.
Explicit practice quizzes are included even when ungraded.

Week-number-only assessments keep null dates and require a question. A conflicting
year or AM/PM label may use a plausible interpretation with a question. A date
window uses its last day provisionally and requires confirmation. An unspecified
Friday quiz series is one unresolved item and must not invent first/last quiz dates.
An extra item can reflect an unwanted representation (such as splitting this
series into 11 undated tasks), not necessarily an invented source fact.
Repeating class term
boundaries use the last dated course activity or teaching week when no formal
term boundary is supplied.

The current schema cannot express skipped holidays or online-only exceptions in a
class recurrence. This benchmark does not verify those exceptions, UI review,
calendar commits, notification delivery, confidence calibration, or evidence
verbatim accuracy. Nulls are included in temporal accuracy, so inspect recall and
per-case failures alongside the headline percentage. These fixtures are a
development benchmark used for prompt tuning, not an independent holdout or proof
of 95% accuracy on future customer uploads.

## Public sources

- [7shifts printed schedules](https://kb.7shifts.com/hc/en-us/articles/4417513470099-How-to-Print-a-Schedule)
- When I Work: [user grid](https://help.wheniwork.com/articles/user-view-reference-guide/),
  [coverage grid](https://help.wheniwork.com/articles/coverage-view-reference-guide/),
  [job-site grid](https://help.wheniwork.com/articles/scheduler-job-site-view-reference-guide/),
  [mobile coworker lists](https://help.wheniwork.com/articles/viewing-your-coworkers-schedules/)
- [Deputy paper and spreadsheet exports](https://help.deputy.com/hc/en-au/articles/4688737187343-Printing-your-schedule)
- [NJIT BIOL 205H](https://archives.njit.edu/vhlib/syllabi/bio/bio-2025-01-01-Sp-2025/BIOL-205-H02-Spring-2025-Barden.pdf)
- [East Texas A&M NURS 4561](https://inside.tamuc.edu/academics/cvSyllabi/syllabi/202520/22283.pdf)
- [Camosun NURS 143](https://legacy.camosun.ca/learn/course-outlines/Nursing%20%28NURS%29/NURS-143-X04-Various-2025W.pdf)
- [MSU Texas PSYC 3603](https://directory.msutexas.edu/storage/files/syllabus_20250113021948.pdf)
- [University of Florida AEB 4283](https://fred.ifas.ufl.edu/media/fredifasufledu/undergradsyll/fall2024/AEB4283Mullally.pdf)
