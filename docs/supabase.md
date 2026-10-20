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

Sign-in is Google and email only (founder's call, Oct 19, 2026). App Store rule 4.8 can require Sign in with Apple when Google is offered; if review flags it, add Apple back.

## Device checks
- [ ] Email sign-up → code → signed in; wrong or expired code; resend after 60 s; login; wrong password; forgot password → code → new password.
- [ ] Google, including cancel and a `redirect_uri_mismatch` check.
- [ ] Guest with a plan signs up → plan backed up; fresh install → log in → plan restored and onboarding skipped.
- [ ] Sign up on a fresh install, enter the code, quit before onboarding; fresh install → log in → onboarding runs (name filled in), not an empty planner. The row carries `onboarded`; rows saved before Oct 20, 2026 count as finished only when they hold a plan.
- [ ] Sign up, never enter the code, then log in → a fresh code is sent and the code screen opens. Sign up with an email that already has an account → "Log in instead", no code screen.
- [ ] Log out keeps the plan; delete account removes the row and the auth user, keeps the plan on the phone.
- [ ] Plus bought as a guest carries over on sign-in (RevenueCat alias); Plus restores on a new phone after login.

## Not done yet
- Server-side import quota: `/api/extract` is still open. With accounts in place, the next step is to require a Supabase session (anonymous sign-in for guests) and count imports per user per month, checking Plus through RevenueCat's REST API.
- Live multi-device sync (deletes don't propagate between phones; the backup only adds).
