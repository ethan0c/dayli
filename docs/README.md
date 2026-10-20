# Semli docs

Start with the [repository README](../README.md) for the current implementation and local setup. Planning and research documents record decisions at the time they were written; older proposals can differ from the app that exists now.

## Build and release

| Document | What it covers |
| --- | --- |
| [Launch checklist](launch-checklist.md) | Beta and public-launch tasks, verification, and rollout |
| [Environment variables](env.md) | Local environment files, EAS/Vercel production values, and tooling secrets |
| [App Store Connect](app-store-connect.md) | Listing fields, privacy declarations, production environment, and submission |
| [App Store listing](app-store-listing.md) | Store copy and screenshot planning |
| [Developer checklist](todo.md) | Implementation follow-ups and device checks; confirm dated status notes against current code |
| [RevenueCat offerings](revenuecat-offerings-brief.md) | Student / regular products, monthly / six-month / yearly terms, and trial setup |
| [Database migrations](../supabase/migrations) | Accounts, plan backup, import quotas, and beta waitlist |
| [Auth emails](../supabase/templates/README.md) | Supabase verification/reset templates and SMTP setup |
| [Mobile setup](../apps/mobile/README.md) | Native development client, EAS profiles, and mobile configuration |
| [Website setup](../apps/web/README.md) | Public site, import API, server configuration, and checks |
| [Extraction evaluations](../evals/README.md) | Evaluation fixtures and tooling |

## Product and design

| Document | What it covers |
| --- | --- |
| [Design system](design-system.md) | Typography, colors, layout, components, and accessibility |
| [Motion](motion.md) | Motion tokens, interaction rules, and navigation |
| [Brand and logo](brand-and-logo.md) | Brand voice, wordmark, icon, and assets |
| [Website](website.md) | Website research and subsequent copy, photography, and app-parity passes |
| [Website screenshots](../apps/web/public/screens/README.md) | App capture sources and usage |
| [Photo sources](../apps/web/public/photos/SOURCES.md) | Photography attribution, dimensions, and selection notes |
| [Pricing and positioning](pricing-and-positioning.md) | Survey findings, audience, positioning, and pricing decisions |
| [Onboarding research](onboarding-research.md) | Onboarding and paywall research |

## Planning and outreach

| Document | What it covers |
| --- | --- |
| [Product plan](product-plan.md) | Original scope, screens, flows, and milestones |
| [Technical plan](technical-plan.md) | Architecture proposal; its deferred-backend assumptions predate Supabase |
| [MVP](mvp.md) | Earlier paid-beta scope and exit criteria |
| [Phase 2](phase-2.md) | Follow-on product and growth ideas |
| [Original concept](overview.md) | Historical Dayli concept and audience research |
| [Strategy](strategy.md) | Competitor research, positioning, and purchase-test planning |
| [Milestones](milestones.md) | Business targets and timeline assumptions |
| [Launch guide](launch-guide.md) | Apple setup and marketing guidance |
| [Marketing budget](marketing-500.md) | Acquisition experiments and budget |
| [Survey follow-up emails](emails/survey-follow-up.txt) | Gift-card winner and participant email drafts |

## Current implementation decisions

- **Product:** Semli, an iPhone planner for college students. The Next.js website provides marketing, pricing, beta signup, and an import preview/API. A full browser planner, web checkout, and Android release are outside the current launch scope.
- **Storage and accounts:** The phone holds the working plan. Optional Supabase accounts support Apple, Google, and email sign-in, account deletion, and backup/restore. Backup is not live multi-device sync. Supabase also handles import usage and the waitlist.
- **Subscriptions:** RevenueCat supplies the `semli_pro` entitlement for Semli Plus. Core planning, manual edits, reminders, overlap warnings, and three monthly AI imports are free. Plus covers unlimited imports, schedule comparisons, ongoing Canvas sync, suggested rescheduling, and supported urgent ringing alarms.
- **Design:** Shared tokens live in `packages/tokens`: Geist, Regular large headers, an Onest wordmark, ink/paper light appearance, more purple in dark appearance, and green enabled switches. The marketing site has intentional photographic and purple sections.
- **Sharing:** Public schedule links remain disabled. SMS is outside the current scope.
- **Release status:** The site still routes acquisition to the beta waitlist (`APP_STORE_LIVE = false`). Implemented code does not replace the production configuration and real-device checks in the launch checklist.
