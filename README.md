# Semli

The daily planner for college students. Turn syllabi, work schedules, screenshots, and messages into one plan for classes, shifts, and deadlines.

[Website](https://semli.app) · [Pricing](https://semli.app/pricing) · [Documentation](docs/README.md)

## Current product

Semli is an iPhone app in development for its beta. This repository contains the app, the public website and import API, and their shared packages.

- Import text, photos, screenshots, or syllabus PDFs. Review extracted dates before saving, and undo an import afterward.
- See your day, week, and semester, with courses, assignments, shifts, to-dos, and overlap warnings in one planner.
- Set local reminders and import a Canvas calendar feed.
- Use the planner as a guest, or sign in with Apple, Google, or email for cloud backup and restore.
- Unlock Semli Plus through RevenueCat: unlimited imports, schedule-change comparisons, ongoing Canvas sync, suggested times for conflicts, and urgent ringing alarms on supported iPhones.

Free includes the core planner, reminders, manual edits, overlap warnings, and three AI imports per month. Full ringing alarms require iOS 26+, permission, and a native build. Schedule-sharing links are not enabled yet. The website offers an import preview and beta signup; a full browser planner and Android release are outside the current launch scope.

## Repository

| Path | Purpose |
| --- | --- |
| [apps/mobile](apps/mobile/README.md) | Expo SDK 58 / React Native iPhone app with Expo Router |
| [apps/web](apps/web/README.md) | Next.js marketing site, pricing, beta waitlist, and import API |
| [packages/core](packages/core) | Dates, conflicts, schedule comparisons, and draft/commit planning |
| [packages/schema](packages/schema) | Shared Zod schemas and API contracts |
| [packages/extract](packages/extract) | Anthropic-powered extraction from text, images, and PDFs |
| [packages/tokens](packages/tokens) | Shared colors, typography, spacing, and motion |
| [supabase](supabase) | Account, backup, import-quota, and waitlist migrations; auth email templates |
| [design](design) | Brand assets, screenshots, and rendering scripts |
| [evals](evals/README.md) | Extraction evaluation fixtures and tooling |

Internal shared packages still use the `@dayli/*` namespace.

## Local development

Use npm workspaces from the repository root. Choose Node.js 22.x (22.13 or newer) or 24.x (24.3 or newer). Local iOS builds require macOS and Xcode; the [Expo SDK 58 requirements](https://docs.expo.dev/versions/v58.0.0/) list Xcode 26.4+ and iOS 16.4+.

```bash
npm install
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Set `ANTHROPIC_API_KEY` in the web environment for imports. Set `EXPO_PUBLIC_API_URL` in the mobile environment to the API's address: `http://localhost:3000` for the iOS simulator, or your computer's LAN address for a physical iPhone.

Start the website and API:

```bash
npm run dev:web
```

In another terminal, build and launch the iPhone development client:

```bash
npm run ios --workspace mobile
```

For later sessions with an existing development build, start Metro with `npm run dev:mobile`. Native dependency or configuration changes require a new native build. Expo Go does not contain all the native modules this app uses.

For cloud development builds, see the [mobile README](apps/mobile/README.md#eas-development-builds).

## Connected services

The planner stores its working data on the phone. Signed-in accounts back up the plan to Supabase and merge it back on sign-in; this is backup and restore, rather than live multi-device sync. Import content is sent through the web API to Anthropic for extraction; the API does not persist the original uploads.

| Service | Configuration |
| --- | --- |
| Anthropic | `ANTHROPIC_API_KEY` on the web server |
| Supabase | `SUPABASE_URL` / `SUPABASE_KEY` on the server; `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY` in the app |
| RevenueCat | Public iOS SDK key in the app; `REVENUECAT_SECRET_KEY` on the server to verify Plus imports |
| PostHog / Sentry | Optional mobile analytics and crash reporting; variables are listed in the mobile environment example |

For a connected environment, apply the SQL files in [supabase/migrations](supabase/migrations) in filename order. Enable anonymous sign-ins for guest import quotas, configure the email/Apple/Google providers and redirects, and use the [auth email templates](supabase/templates/README.md). Without Supabase, local development can exercise imports without server quotas, but accounts and the waitlist need it. Production needs Supabase and RevenueCat configured to enforce access correctly.

Every `EXPO_PUBLIC_*` value is included in the app bundle. Keep Anthropic, RevenueCat secret keys, and build-upload tokens out of public variables and source control. Follow the [environment guide](docs/env.md) for local files and production provisioning, and the [release setup](docs/app-store-connect.md#8-before-you-press-submit) for submission.

## Checks

```bash
npm test
npm run typecheck
npm run lint --workspace mobile
npm run lint --workspace web
npm run build --workspace web
```

Run the web build and standalone typecheck sequentially because Next.js regenerates route types during builds. AI extraction evaluations are separate from unit tests; see [evals](evals/README.md).

Release configuration and device checks remain tracked in the [launch checklist](docs/launch-checklist.md) and [App Store Connect guide](docs/app-store-connect.md).
