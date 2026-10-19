# Phase 2: after the beta pays

Status: Oct 19, 2026. Starts only when the MVP test passes (≥10 of 50 beta testers subscribe). Ordered by expected effect on revenue, not by how interesting it is to build.

## Gate
- The MVP test passed, and we know which import kind people actually use (screenshots vs syllabi vs text) from the funnel.
- The name is registered (domain, App Store, handles) and a trademark search is clean.

## 2.1 Keep them paying (retention)
| Feature | Why | Notes |
|---|---|---|
| **Canvas sync** | 71% of surveyed classes are on Canvas; assignment dates change and students miss the change | Canvas LMS REST API with a per-student token; read-only; items keep their source link; diff like work schedules. Paid-only feature. |
| **Google / Apple Calendar two-way sync** | #3 complaint across all three competitors | Start with Apple EventKit (no server), then Google via OAuth. |
| **Study suggestions and replanning** | The overload card today only points at the week; the next step is "move the study block" with one tap | Suggestions are proposals; nothing moves without approval. Needs the eval discipline from extraction. |
| **Share sheet, Siri, widget, Live Activity** | Capture from anywhere; today's next item on the lock screen | Native targets in the dev build. |
| **Semester reset** | "Add next semester's syllabi" prompt in the last two weeks of a term | Drives the second semester purchase. |

## 2.2 Get paid better (monetization)
| Feature | Why |
|---|---|
| **Web checkout (Stripe)** for semester and yearly plans | Keeps ~97% instead of 70–85%; the site already has the pricing page |
| **Referral: give a month, get a month** | Students sell to classmates; cheaper than ads |
| **Campus ambassador kit** | Nursing cohorts first; a flyer, a QR, a 60-second video of a syllabus turning into a semester |
| **Family / parent plan** | Parents of first-years pay for the planner; the survey shows parents already try these apps |

## 2.3 Grow the surface (acquisition)
| Feature | Why |
|---|---|
| **SEO pages on the site**: "syllabus to calendar", "assignment tracker", "work and school schedule planner", "how to organize rotating shifts" | Cheap, specific queries; the try-it box converts them |
| **Web planner** (Expo web, polished) | 65% of students do schoolwork on a laptop; needs accounts + sync first |
| **Accounts and sync** | Required for web and for a new phone. Decision point for the backend (Supabase vs Convex vs plain Postgres); choose by the smallest thing that gives auth + sync + RLS. |
| **SMS-to-add** | The "magic" entry point; needs A2P 10DLC registration (weeks) and per-message cost |
| **Android** | Only if campus demand is loud; the Expo code already runs there |

## 2.4 Widen the audience (later)
Shift workers without school, working parents, freelancers. The engine already handles work schedules and personal items; the change is marketing, onboarding chips, and sample data.

## What we will not do
- Build a general AI assistant. The product is a planner that reads things; the assistant framing is what Tiimo gets punished for.
- Meter the basics. Calendar, to-dos, reminders, repeating classes stay free forever.
- Add a social layer.
