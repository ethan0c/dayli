# Semli docs

| Doc | What it covers |
|---|---|
| [overview.md](overview.md) | Product concept, audience, feature summary (source of truth for *why*) |
| [product-plan.md](product-plan.md) | MVP scope, information architecture, screens, key flows, milestones, metrics, risks |
| [design-system.md](design-system.md) | Visual language derived from the reference UI: tokens, type, components, motion, accessibility |
| [brand-and-logo.md](brand-and-logo.md) | Brand platform, voice, logo concepts, the recommended mark, app icon, deliverables |
| [technical-plan.md](technical-plan.md) | Stack, architecture, data model, AI capture pipeline, schedule diffing, integrations, privacy |
| [mvp.md](mvp.md) | **The working checklist**: what must ship for the paid beta, in order, with exit criteria |
| [phase-2.md](phase-2.md) | What comes after the beta pays: retention, monetization, acquisition, audience |
| [social.md](social.md) | Research on social features (Saturn, Flora, Focusmate, BeReal, the accountability studies) and the decision: no feed; a shared study session is a gated phase-2 candidate |
| [strategy.md](strategy.md) | Reconciles the goal ($20K MRR) and the Structured study with our plan; App Store review mining of Structured, MyStudyLife, Tiimo; the purchase test |
| [pricing-and-positioning.md](pricing-and-positioning.md) | Survey results (n=66), competitor prices, positioning as the daily planner for college students, price points, iOS + web only |
| [onboarding-research.md](onboarding-research.md) | Benchmarks and teardowns on onboarding, and the recommended v2 flow: real import inside onboarding, priming sheet, paywall after the value moment with a trial timeline |
| [launch-guide.md](launch-guide.md) | Apple setup end to end, the two .p8 keys for RevenueCat and EAS, App Store screenshots, SEO/Google plan, marketing plan and budget |
| [revenuecat-offerings-brief.md](revenuecat-offerings-brief.md) | Hand-off brief for setting up App Store products and RevenueCat offerings (student + regular, monthly / semester / yearly, 7-day trial) |
| [revenuecat.md](revenuecat.md) | Subscription implementation, Semli Pro paywall, product/offering setup, Test Store, native builds, restore and subscription management |

## Decisions log
- Platform: iOS + web (Expo app for both; Next.js site for landing, try-it, API, checkout). No Android. No backend until phase 2.
- Typeface Urbanist (decided Oct 19, 2026 after matching the reference design; Onest and a Gilroy preview came before). Icon: the two-dots mark. Wordmark for splash, site, social.
- Pricing: Free (3 AI imports/mo, basics always free) · Plus $4.99/mo · $14.99/semester · $29.99/yr, student prices on the honor system; regular $7.99 / $24.99 / $49.99.
- Name: Semli (decided).
- SMS: cut from the MVP.

## Still open
1. Trademark search and domain registration for Semli.
2. Backend choice, deferred to phase 2.
