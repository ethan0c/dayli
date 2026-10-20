# Supabase: accounts and backup

October 19, 2026. Accounts are optional. A guest's plan lives only on the phone; signing in backs it up to one row per person (`public.plans`, RLS on) and a new phone restores it on sign-in. It is a backup, not live sync: the phone wins any record both sides have, and undo history stays local. Plus follows the account because RevenueCat logs in with the Supabase user id.

The app turns accounts on by itself when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are set (`ACCOUNTS_ENABLED` in `apps/mobile/src/lib/auth.ts`). Schedule sharing stays off (`SHARING_ENABLED`).

## One-time setup
1. Create the project (region near your users). Copy the project URL and the **publishable** key into `apps/mobile/.env` (and EAS env for builds).
2. Run `supabase/migrations/20261019000000_accounts.sql` (SQL editor, or `supabase db push` after `supabase link`). It creates `plans` with RLS and `delete_account()`.
3. Authentication → URL Configuration: Site URL `https://semli.app`; Redirect URLs `semli://**` (add `exp://**` only if you test in Expo Go).
4. Email: keep "Confirm email" on. Set the sender to hello@semli.app with custom SMTP before the beta; the built-in sender is rate-limited to a few emails an hour.
5. Google: create an OAuth client (Web application) in Google Cloud, add `https://<project>.supabase.co/auth/v1/callback` as its redirect URI, paste the client ID and secret into Authentication → Providers → Google.
6. Email codes, not links: in Authentication → Emails → Templates, put `{{ .Token }}` (the code) in **Confirm signup** and **Reset password**, and take `{{ .ConfirmationURL }}` out. The app's code screen is `auth/verify`; it accepts 6 to 8 digits, so Email OTP length (Providers → Email) can be 6 or 8 (the project uses 8 as of Oct 20, 2026). Codes last an hour by default (Email OTP expiration). Minimum password length there is 6; the app asks for 8.
7. Rebuild the dev client (`npx expo run:ios` or EAS) after native package changes.

Sign-in is Apple (native iOS), Google and email. Apple is offered on welcome, login and signup using the system button. Cancelling its sheet leaves the person on the same screen; successful sign-in uses the same backup and Plus account flow as Google.

## Sign in with Apple (Oct 20, 2026)

Verification on Oct 20: all 220 tests, mobile lint and TypeScript checks pass. A fresh unsigned iOS Debug simulator build succeeded for arm64 and x86_64 with Apple Authentication included; generated entitlements contain `com.apple.developer.applesignin = [Default]`.

Live recheck on Oct 20 after setup: the project’s public `/auth/v1/settings` reports both Apple and Google enabled. The developer reports the Apple setup complete; the public endpoint does not expose the configured client IDs. Paywall visual verification is pending because Simulator UI automation rejected clicks (`noWindowsAvailable`).

Before testing a release build:
1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers → `app.semli.mobile`: enable **Sign in with Apple** for this App ID and regenerate the provisioning profile if needed. EAS capability syncing can manage this when building with the account.
2. Supabase → Authentication → Sign In / Providers → Apple: enable the provider and include `app.semli.mobile` in **Client IDs**. This app uses native ID tokens, not browser Apple OAuth. Native-only sign-in does not need a Services ID or a rotating OAuth client secret. Keep nonce verification enabled. See [Supabase's Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple).
3. Make a **new native build** (`npx expo run:ios` or `npx eas-cli@latest build --platform ios --profile development` from `apps/mobile`). A Metro reload or OTA update cannot add Apple Authentication or the entitlement. `app.json` contains `ios.usesAppleSignIn` and the module's config plugin.
4. Test on an iPhone with an Apple ID, including **Hide My Email**, cancellation, subsequent login (Apple only supplies the name once), logout and backup restore. Native compilation and mocked auth tests do not verify the live provider configuration.

Supabase Apple provider activation is verified. A signed build and real-device sign-in still need to be verified before submission. Also verify [Apple's token-revocation requirement](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple) when deleting an Apple-linked account: the existing `delete_account()` removes Supabase data, but does not call Apple's revocation API. That requires server-side Apple credentials and a separate revocation integration; never put those credentials in the app.

## Device checks
- [ ] Email sign-up → code → signed in; wrong or expired code; resend after 60 s; login; wrong password; forgot password → code → new password.
- [ ] Apple: first sign-in with Hide My Email, cancel, subsequent login without a name, cloud restore and Plus identity.
- [ ] Google, including cancel and a `redirect_uri_mismatch` check.
- [ ] Guest with a plan signs up → plan backed up; fresh install → log in → plan restored and onboarding skipped.
- [ ] Sign up on a fresh install, enter the code, quit before onboarding; fresh install → log in → onboarding runs (name filled in), not an empty planner. The row carries `onboarded`; rows saved before Oct 20, 2026 count as finished only when they hold a plan.
- [ ] Sign up, never enter the code, then log in → a fresh code is sent and the code screen opens. Sign up with an email that already has an account → "Log in instead", no code screen.
- [ ] Log out keeps the plan; delete account removes the row and the auth user, keeps the plan on the phone.
- [ ] Apply `20261020100000_waitlist.sql`: the site's beta waitlist and `/beta` click log, written through `join_waitlist` and `log_beta_click` with the publishable key; nothing reads them from the site.
- [ ] Plus bought as a guest carries over on sign-in (RevenueCat alias); Plus restores on a new phone after login.

## Not done yet
- Server-side import quota: `/api/extract` is still open. With accounts in place, the next step is to require a Supabase session (anonymous sign-in for guests) and count imports per user per month, checking Plus through RevenueCat's REST API.
- Live multi-device sync (deletes don't propagate between phones; the backup only adds).

## Import limits (server side, Oct 20, 2026)
`/api/extract` now enforces the free plan itself (`apps/web/lib/import-access.ts`). App imports carry the Supabase session (guests get a silent anonymous one that never shows as an account) and the RevenueCat app user id; Plus (`semli_pro` via RevenueCat's REST API) is unlimited, everyone else gets 3 a month counted in `import_usage`, and a failed read refunds. The website demo has no session: 5 previews a day per hashed IP (`demo_usage`). With no Supabase env on the server, nothing is limited (local development).

Setup:
1. Run `supabase/migrations/20261020000000_import_quota.sql`.
2. Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins**.
3. On the web host (Vercel), set `SUPABASE_URL`, `SUPABASE_KEY` (the publishable key) and `REVENUECAT_SECRET_KEY` (RevenueCat → Project settings → API keys → secret key, server only). Redeploy.

Checks: a free guest's 4th import shows the paywall even after a reinstall; a Plus user is never counted; a failed read doesn't use an import; the site demo stops after 5 a day.
