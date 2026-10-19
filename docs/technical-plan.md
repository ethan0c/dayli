# Dayli — Technical plan

Status: draft · October 2026

## 1. Platform & stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| App | **Expo (React Native) + TypeScript**, iOS first | One codebase for iOS now and Android later; share extension, push, and on-device dictation all supported; fast iteration via EAS updates |
| UI | Custom components on design tokens (no UI kit); Reanimated for motion; FlashList for lists | Reference UI is simple and custom; kits would fight it |
| State / data | TanStack Query + local SQLite cache (expo-sqlite) | Offline-first reads; capture works offline and syncs later |
| Backend | **Supabase**: Postgres, Auth (Apple/Google/email), Storage, Edge Functions, Row Level Security | Low ops, Postgres for relational calendar data, RLS for per-user isolation |
| Jobs | Supabase queues (pgmq) or a small worker for extraction | Extraction is async; retries |
| AI | **Claude API** (`claude-opus-5-5`) with structured outputs; vision for screenshots, native PDF input for syllabi | One model handles text, images and PDFs in the same schema |
| SMS (stretch) | Twilio Messaging (A2P 10DLC registered) | Inbound webhook → same capture pipeline |
| Push | Expo Notifications (APNs) | |
| Calendar (V1.1) | Google Calendar API, iOS EventKit | |
| Analytics / errors | PostHog (product), Sentry (errors) | |

**Alternative:** native SwiftUI gives the best feel (Live Activities for the focus timer, widgets, Liquid Glass) but locks out Android. If the team is iOS-only for the next year, it is a reasonable choice; widgets/Live Activities can still be added to Expo via a native target later.

## 2. Architecture

```
 iOS app ──┬─ capture (text/voice/photo/file/share-ext) ──► Storage (sources/) + sources row
           │                                                    │
           │                                                    ▼
           │                                   extract job (Edge Function / worker)
           │                                     1. load source + user context
           │                                     2. Claude → structured items
           │                                     3. resolve dates (tz, term)
           │                                     4. match / dedupe / diff
           │                                     5. write extraction (status = needs_review)
           │                                                    │
           ◄──── realtime: extraction ready ────────────────────┘
           │
           └─ review → commit (RPC: commit_extraction) → items + change_batch (undo)
 SMS ──► Twilio webhook ──► same pipeline ──► reply with summary + review link
```

## 3. Data model (Postgres)

```sql
users            (id, name, timezone, locale, week_start, quiet_hours, plan)
sources          (id, user_id, kind[text|image|pdf|sms|voice], storage_path, raw_text,
                  received_at, status, deleted_at)
extractions      (id, source_id, user_id, model, prompt_version, status
                  [processing|needs_review|committed|discarded|failed],
                  detected_type[general|work_schedule|syllabus|course_schedule],
                  payload jsonb, created_at)
items            (id, user_id, kind[event|task], title, notes, category_id,
                  starts_at, ends_at, all_day, due_at, rrule, timezone,
                  status[active|done|cancelled], completed_at,
                  course_id, employer_id, schedule_version_id,
                  source_id, extraction_id, fingerprint, created_at, updated_at)
categories       (id, user_id, name, color_token, icon, system_kind[school|work|personal|custom])
courses          (id, user_id, code, title, instructor, term_id, location, syllabus_source_id, grading jsonb)
terms            (id, user_id, name, starts_on, ends_on)
employers        (id, user_id, name, color_token)
schedule_versions(id, employer_id, user_id, covers_from, covers_to, source_id,
                  status[published|pending], superseded_by)
reminders        (id, item_id, offset_minutes, channel[push|sms], sent_at)
change_batches   (id, user_id, origin[import|manual|suggestion], extraction_id, created_at, undone_at)
item_changes     (id, batch_id, item_id, op[create|update|delete], before jsonb, after jsonb)
suggestions      (id, user_id, kind[conflict|overload|study_plan], payload jsonb, status, created_at)
```

All tables have `user_id` and RLS `user_id = auth.uid()`. Sources are stored in a private bucket with signed URLs.

## 4. AI capture pipeline

### 4.1 One schema for every input
The model returns a single structured object regardless of input kind:

```jsonc
{
  "detected_type": "work_schedule",           // general | work_schedule | syllabus | course_schedule
  "context": { "employer": "Olive Garden", "course_code": null, "term": null,
               "covers_from": "2026-10-26", "covers_to": "2026-11-01" },
  "items": [{
    "kind": "event",                          // event | task
    "title": "Work shift",
    "category": "work",
    "start": "2026-10-30T16:00", "end": "2026-10-30T22:00", "all_day": false,
    "due": null, "recurrence": null,
    "evidence": "Thu 10/30  4:00p–10:00p",    // exact text/region it came from
    "confidence": 0.97,
    "questions": []                            // e.g. [{"field":"start","ask":"Which Friday?","options":[...]}]
  }]
}
```

### 4.2 Request design
- Model: `claude-opus-5-5` with structured outputs (`output_config.format` with the JSON schema), adaptive thinking (the default), effort tuned per route on the eval set (start `low` for short text, `medium` for PDFs/screenshots).
- Inputs: images as image blocks, PDFs as document blocks (no separate OCR), text as text.
- Context in the prompt: today's date and the user's timezone, active term dates, existing course codes, employer names, and the date range of the last schedule version. This is what makes "Friday" and "MW 9–9:50" resolvable.
- Enable the server-side refusal fallback (`fallbacks: "default"` with its beta header) so a classifier decline doesn't fail an import.
- Stable system prompt + schema first, then per-user context, so prompt caching applies.
- **Cost note:** if per-import cost becomes a problem, testing a cheaper model (e.g. Haiku 5.5) on the short-text route against the eval set is a product decision to make with data; MVP starts with one model.

### 4.3 Post-processing (deterministic code, not the model)
1. **Date resolution & validation:** parse to the user's timezone; reject impossible dates; flag items > 1 year out or in the past as questions.
2. **Term expansion:** course meeting patterns become `rrule`s bounded by term dates, minus holidays if listed.
3. **Matching:** fingerprint = normalized title + kind + date (+ course/employer). Exact match → skip (already have it); fuzzy (same day, overlapping time, title similarity > 0.8) → propose "update existing".
4. **Schedule diff** (work schedules): see §5.
5. **Low confidence** (< 0.85) or any `questions` → field highlighted on review.

### 4.4 Quality gates
- **Eval set** in repo (`evals/`): 100+ real anonymized inputs (work schedule screenshots from 5+ formats, 20 syllabi, 50 natural-language messages) with expected items.
- Metrics: item recall, date/time exact-match accuracy, false-item rate, question rate.
- CI runs the eval on any prompt/schema/model change; ship only if accuracy doesn't regress.
- Log `prompt_version` + `model` on every extraction for traceability.

## 5. Work schedule diffing

```
input:  new shifts S_new for employer E, covering [from, to]
stored: active shifts S_old for E within [from, to]

match by (date, employer):
  same date, same start/end            → unchanged
  same date, different time            → changed (old → new)
  date only in S_new                   → new
  date only in S_old                   → removed
multiple shifts on one date            → pair by max time overlap, leftovers new/removed

on commit:
  create schedule_version(from, to, published), supersede overlapping old version
  apply creates/updates/deletes in one change_batch
weeks after the latest version's covers_to → render "pending" on Plan
```

## 6. Conflicts & overload
- **Conflict:** interval overlap between two `event`s that are fixed (work, class, clinical, exam). Computed in a SQL view on write; surfaced on Today and on both items.
- **Overload:** for each exam/deadline, sum busy waking hours (07:00–23:00 default) in the prior 72 h; if free < 4 h → `suggestions` row (kind = overload). Thresholds are user-adjustable later.
- Nightly job + on-write recompute for affected days.

## 7. Notifications
- Per-item reminders (defaults: events 30 min before; deadlines 1 day + morning-of).
- Schedule-change pings when an import changes upcoming shifts.
- Optional daily briefing at a chosen time (stretch).
- Quiet hours respected; batching so a 15-item import doesn't produce 15 notifications.

## 8. SMS (stretch)
- One Dayli number; users verify their phone in You → SMS.
- Inbound text/MMS → source (kind = sms) → pipeline → reply: "Got 3 things: Fri shift 4–10, exam Mon, buy scrubs Wed. Confirm: dayli.app/r/abc" (deep link to review). Optional "YES" reply to confirm when all items are high-confidence.
- Requires A2P 10DLC brand + campaign registration (start week 1); STOP/HELP handling; rate limits per user.

## 9. Privacy & security
- RLS on every table; sources in a private bucket; signed URLs with short TTL.
- Encryption at rest (Supabase default) + TLS.
- User data is not used for model training; state this in the privacy policy.
- "Delete source after import" toggle; full account export (JSON + ICS) and delete.
- PII-minimal analytics (no item titles in events).
- Apple App Privacy labels drafted in week 11.

## 10. Repo layout (proposed)

```
dayli/
  apps/mobile/            Expo app (expo-router)
    app/(tabs)/today|plan|school
    components/           ClockHeader, WeekStrip, TaskRow, EventRow, NavPill, ...
    theme/tokens.ts       generated from design tokens
  packages/schema/        zod schemas shared by app + functions (extraction, items)
  packages/core/          date resolution, rrule expansion, diff, conflict logic (pure, unit-tested)
  supabase/
    migrations/
    functions/extract/    Claude call + post-processing
    functions/sms-inbound/
  evals/                  inputs/, expected/, run.ts
  design/tokens.json      single source for colors/type/spacing
  docs/
```

## 11. Build order
Matches product-plan §7. Pure logic (`packages/core`) and the eval harness come first, because extraction accuracy is the product's main risk and they're cheap to test without UI.
