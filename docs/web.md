# The web planner

Status: built Oct 22, 2026, not yet deployed. The plan and sketches: the "Semli Web Plan" artifact.

The planner on a laptop is the Expo app's web build (`apps/mobile`, `npx expo export -p web`), the
same screens as the iPhone with a desktop layout, served at `app.semli.app`. The Next.js site
(`apps/web`) stays the marketing site and the API. iOS launches first; the web follows as a beta for
account holders.

## What is different on the web

- **An account is required.** A laptop's plan comes from the account, so the welcome offers
  "Create an account" and "I have an account", and the planner screens open only when signed in
  (`ACCOUNT_REQUIRED`, `lib/web.ts`). In development, `?guest` restores the guest flow for the tab.
- **Sign in.** Email works as on the iPhone. Google (and Apple, when `EXPO_PUBLIC_APPLE_WEB_SIGNIN`
  is on) leave for the provider and come back to `/auth/callback`, which finishes the sign-in.
- **Layout** (`lib/layout.ts`). Under 768 wide it is the phone layout. From 768 a sidebar replaces the
  tab pill and every screen sits in a 720 column. From 1200 the sidebar shows labels and the sync
  line, Today shows the hours beside the list, and Plan opens an item in a pane beside the day.
  Today has no sky on a wide window.
- **Keyboard** (`lib/shortcuts.ts`, `?` lists them): N new to-do or event, 1–4 the tabs, ← → days and
  ⇧← ⇧→ weeks on Plan, T today, Esc closes the item. Shortcuts never fire while typing.
- **Pointer.** Rows highlight under the pointer and show Delete in place of the pill (a mouse can't
  swipe). A file dropped anywhere, or an image pasted with ⌘V, opens Add and imports it
  (`lib/web-drop.ts`).
- **Dates and times** use the browser's own pickers.
- **Reminders and ringing alarms** ring on the iPhone. The web edits their settings and says so.
- **Canvas** feeds can't be read from another site's page, so the web fetches them through
  `POST /api/canvas-feed` on the site: Canvas feed links on a named domain only, signed in, no
  redirects followed.
- **Exports** download instead of opening a share sheet.

## Sync

Every device keeps its own copy and syncs one record at a time (`lib/cloud.ts`, `lib/sync-records.ts`,
table `plan_records`). A record is an item, a course, a schedule, a planned work date, or the
profile. Each write takes the next server `seq`; a device pushes its changes a second after they
happen, pulls everything after the last `seq` it applied, and listens on Supabase Realtime while
open. A deletion is kept as a row with `deleted` set. Signing in still never merges two plans: if
both the device and the account have one, the person keeps one (`PlanChoice`). Sign-out stops sync
before the device is cleared, so clearing never reaches the account. The old `plans` row is read
once, for an account with no records yet, and goes away after a release.

## Payments

`react-native-purchases` runs in its browser mode on the web with a RevenueCat Web Billing key, sold
through Stripe, and logs in with the Supabase user id. A web purchase grants the same `semli_plus`
entitlement as the App Store, so Plus works everywhere and the server check (`apps/web/lib/import-access.ts`)
needs no change; it now only accepts the signed-in user's own RevenueCat id (or a guest's anonymous one).
Without the key the paywall says Plus on the web is on its way. Prices match the App Store.

## Setup before launch

1. **Database.** `supabase db push` for `20261022120000_plan_records.sql`. Then, in Database →
   Replication, confirm `plan_records` is in the `supabase_realtime` publication.
2. **Supabase redirect URLs** (Authentication → URL Configuration → Redirect URLs). Without these,
   Google sends people to the Site URL (semli.app) instead of back to the planner:
   `https://app.semli.app/auth/callback`, and for development `http://localhost:8081/auth/callback`
   and `http://localhost:8099/auth/callback`.
3. **Google OAuth.** The Supabase callback is already the authorized redirect; no change unless the
   Google client restricts JavaScript origins, in which case add `https://app.semli.app`.
4. **Apple on the web (optional).** A Services ID with `app.semli.app` as a domain and the Supabase
   callback as its return URL, added to Supabase's Apple provider. Then set
   `EXPO_PUBLIC_APPLE_WEB_SIGNIN=true` for the web build.
5. **RevenueCat Web Billing.** Connect Stripe in RevenueCat, add the six web products to match the
   App Store ones (student and regular; monthly, 6 months, yearly; 7-day trial), attach them to
   `semli_plus`, and put them in the `student` and `regular` offerings. Choose Stripe Tax or Stripe
   Managed Payments for sales tax. Copy the public key (`rcb_…`; sandbox `rcb_sb_…` for development)
   into `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY`.
6. **Hosting.** A Vercel project with root `apps/mobile` (it has a `vercel.json`: `npx expo export -p web`,
   output `dist`, every path rewritten to `index.html`), domain `app.semli.app`, and the mobile
   environment variables with `EXPO_PUBLIC_API_URL=https://www.semli.app`.
7. **Site.** Flip `WEB_APP_LIVE` in `apps/web/lib/site.ts` to show "Open Semli" in the site header.
8. **Legal.** Terms and privacy: web billing through Stripe, refunds, and Canvas feeds fetched by the server.

## Not built yet

- Browser notifications for reminders.
- Linking out from the iPhone paywall to web checkout (US only; see the plan for the court's pending rate).
- J/K row navigation; a highlighted row for the item open in Plan's pane.
