# Dayli docs

| Doc | What it covers |
|---|---|
| [overview.md](overview.md) | Product concept, audience, feature summary (source of truth for *why*) |
| [product-plan.md](product-plan.md) | MVP scope, information architecture, screens, key flows, milestones, metrics, risks |
| [design-system.md](design-system.md) | Visual language derived from the reference UI: tokens, type, components, motion, accessibility |
| [brand-and-logo.md](brand-and-logo.md) | Brand platform, voice, logo concepts, the recommended mark, app icon, deliverables |
| [technical-plan.md](technical-plan.md) | Stack, architecture, data model, AI capture pipeline, schedule diffing, integrations, privacy |

## Open decisions (need an owner)

1. **Platform** — decided: Expo (iOS first) + Next.js web, one TypeScript codebase. Backend/sync (Supabase or other) deferred until the beta shows it is needed; everything is on-device for now.
2. **Logo** — decided: wordmark only, app icon is a `d.` crop of it. See brand-and-logo §3.
3. **Typeface** — decided: Outfit.
4. **Name clearance** — trademark, App Store, and domain checks for "Dayli" before any public brand spend.
5. **SMS in MVP** — keep (strong differentiator) or move to V1.1 (A2P 10DLC registration takes weeks and costs money). See product-plan §7.
