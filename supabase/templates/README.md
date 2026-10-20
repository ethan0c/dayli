# Auth emails

The app verifies emailed codes (`verifyOtp` with the `signup` and `recovery` types, 6 to 8 digits), so both templates carry `{{ .Token }}` and no confirmation link. Supabase's default templates send a link that lands on the Site URL, which the app has no screen for.

`supabase/config.toml` declares the two templates and Resend SMTP. `supabase config push` writes only what the file declares; `supabase config diff` previews (it does not show template bodies, only subjects).

## Pushing

Supabase's own mail provider sends 2 emails an hour and, on the free tier, refuses custom templates, so SMTP has to exist before the templates can land. One-time setup:

1. In Resend, add and verify `semli.app` (the DNS records it lists), then create an API key with sending access.
2. From the repo, with the CLI logged in (`npx supabase login`) and the project linked (`npx supabase link --project-ref vhzuefbxrzlhnvyrldad`):

       RESEND_API_KEY=re_... npx supabase config diff
       RESEND_API_KEY=re_... npx supabase config push

3. Send yourself a sign-up from the app and check the email shows a code, subject "Your Semli code".

Attempted Oct 20, 2026 without SMTP: the push was rejected with "Email template modification is not available for free tier projects using the default email provider".
