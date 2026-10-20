# Semli for iPhone

The Expo SDK 58 / React Native app for Semli. Today, Plan, School, Add, and You share the same planner data and design tokens. See the [root README](../../README.md) for product scope and connected services.

## Run locally

Install dependencies from the repository root using npm. Use Node.js 22.x (22.13+) or 24.x (24.3+), macOS, and the [SDK 58 toolchain](https://docs.expo.dev/versions/v58.0.0/) for local iOS builds.

From the repository root:

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
npm run ios --workspace mobile
```

Start the website/API in a separate terminal with `npm run dev:web`, after configuring its environment. Set `EXPO_PUBLIC_API_URL` in the mobile environment to that server. The simulator can use `http://localhost:3000`; a physical iPhone needs your computer's LAN address. Debug builds also expose **You → Semli server** to change it.

For subsequent sessions, `npm run dev:mobile` starts Metro for the installed development client. Rebuild after changes to native dependencies, plugins, splash configuration, or Swift modules. Expo Go cannot run the complete app.

## EAS development builds

Run these commands from `apps/mobile`. EAS requires an Expo account and access to this app's EAS project. Physical-device builds also need Apple signing and device provisioning.

```bash
# Physical iPhone
npx eas-cli@latest build --platform ios --profile development

# iOS simulator
npx eas-cli@latest build --platform ios --profile development-simulator
```

Install the resulting build, then start Metro from this directory:

```bash
npx expo start --dev-client
```

Cloud builds need their own EAS environment variables; follow the [environment guide](../../docs/env.md). The [App Store Connect guide](../../docs/app-store-connect.md#8-before-you-press-submit) covers signing and submission.

## Configuration and source

The [.env.example](.env.example) lists the API URL, Supabase publishable keys, RevenueCat public SDK key, and optional PostHog/Sentry configuration. Accounts activate when Supabase is configured. Store offerings and the `semli_pro` entitlement must match RevenueCat; see the [offerings brief](../../docs/revenuecat-offerings-brief.md).

| Path | Purpose |
| --- | --- |
| `src/app/` | Expo Router screens and layouts |
| `src/components/` | Shared interface components |
| `src/store/` | Planner state and local persistence |
| `src/lib/` | Imports, accounts, cloud backup, subscriptions, reminders, and other services |
| `src/native/` | Swift inline modules for AlarmKit ringing alarms |
| `app.json` / `eas.json` | Native configuration and cloud build profiles |

Full ringing alarms are a Plus feature requiring iOS 26+ and AlarmKit permission. Verify alarms, Apple sign-in, notifications, and purchases on a physical device before release. Android and a full browser app are not current release targets.

## Checks

From the repository root:

```bash
npm run lint --workspace mobile
npm run typecheck --workspace mobile
npm test
```

Open release work is tracked in the [launch checklist](../../docs/launch-checklist.md) and [developer checklist](../../docs/todo.md).
