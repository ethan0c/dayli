# Semli website and API

The Next.js App Router site at [semli.app](https://semli.app): product pages, app-styled pricing, a schedule-import preview, and the iPhone beta waitlist. It also hosts the extraction API used by the mobile app. The website is not a full browser planner or a web subscription checkout.

## Run locally

From the repository root, using Node.js 22.x (22.13+) or 24.x (24.3+):

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev:web
```

Open [localhost:3000](http://localhost:3000). The marketing pages render without connected services; imports require `ANTHROPIC_API_KEY`.

## Server environment

All variables in [.env.example](.env.example) belong on the server. See the [environment guide](../../docs/env.md) for local and production files.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Reads text, images, and PDFs through `/api/extract` |
| `SUPABASE_URL`, `SUPABASE_KEY` | Import quotas, demo limits, beta waitlist, and referral tracking; use the publishable key |
| `REVENUECAT_SECRET_KEY` | Verifies `semli_pro` entitlement for unlimited Plus imports |
| `TESTFLIGHT_URL` | Optional destination for `/beta`; leave unset until the invite is available |

Use the same Supabase project as the mobile app and apply [the migrations](../../supabase/migrations) in filename order. Without Supabase, local imports bypass server quotas; the waitlist needs Supabase. Configure Supabase, anonymous sign-ins, and RevenueCat verification before serving production app imports.

## Main entry points

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Homepage and import demo |
| `app/pricing/` | Free / Plus comparison and plan selection |
| `app/api/extract/` | Validated extraction requests and import access checks |
| `app/api/waitlist/` | Beta email signup |
| `app/beta/` | Referral tracking and beta redirect |
| `lib/site.ts` | Shared copy, prices, links, and `APP_STORE_LIVE` |
| `app/tokens.ts` | CSS variables generated from `@dayli/tokens` |
| `components/Shot.tsx` | Real app screenshot presentation |
| `public/screens/` | App captures used on the site |
| `public/photos/` | Photography and [source notes](public/photos/SOURCES.md) |

Keep `APP_STORE_LIVE` false until the App Store listing is available. Before launch, acquisition buttons lead to beta signup. The mobile paywall gets purchasable prices from RevenueCat; website prices in `lib/site.ts` must stay aligned with the store offerings and [pricing document](../../docs/pricing-and-positioning.md).

## Checks

From the repository root:

```bash
npm run lint --workspace web
npm run build --workspace web
npm run typecheck --workspace web
npm test
```

Run build and standalone typecheck sequentially: Next.js regenerates `.next` route types during builds. The [launch checklist](../../docs/launch-checklist.md) tracks production readiness.
