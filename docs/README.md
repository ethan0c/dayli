# Dayli docs

| Doc | What it covers |
|---|---|
| [overview.md](overview.md) | Product concept, audience, feature summary (source of truth for *why*) |
| [product-plan.md](product-plan.md) | MVP scope, information architecture, screens, key flows, milestones, metrics, risks |
| [design-system.md](design-system.md) | Visual language derived from the reference UI: tokens, type, components, motion, accessibility |
| [brand-and-logo.md](brand-and-logo.md) | Brand platform, voice, logo concepts, the recommended mark, app icon, deliverables |
| [technical-plan.md](technical-plan.md) | Stack, architecture, data model, AI capture pipeline, schedule diffing, integrations, privacy |
| [pricing-and-positioning.md](pricing-and-positioning.md) | Survey results (n=66), competitor prices, positioning as the daily planner for college students, price points, iOS + web only |

## Open decisions (need an owner)

1. **Platform** — decided: iOS + web, no Android. The Expo app runs on both; Next.js is only the landing page, try-it, API, and checkout. Backend/sync deferred until the beta shows it is needed; everything is on-device for now.
2. **Logo** — decided: wordmark only, app icon is a `d.` crop of it. See brand-and-logo §3.
3. **Typeface** — decided: Onest.
4. **Name clearance** — trademark, App Store, and domain checks for "Dayli" before any public brand spend.
5. **SMS in MVP** — keep (strong differentiator) or move to V1.1 (A2P 10DLC registration takes weeks and costs money). See product-plan §7.
6. **Pricing** — proposed: Free (3 imports/mo) · Plus $4.99/mo · $14.99/semester · $29.99/yr, web checkout for the longer plans. See pricing-and-positioning §5.
