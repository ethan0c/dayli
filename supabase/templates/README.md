# Auth emails

The app verifies emailed codes (`verifyOtp` with the `signup` and `recovery` types, 6 to 8 digits), so both templates carry `{{ .Token }}` and no confirmation link. Supabase's default templates send a link that lands on the Site URL, which the app has no screen for.

`supabase/config.toml` declares the two templates and Resend SMTP. `supabase config push` writes only what the file declares; `supabase config diff` previews (it does not show template bodies, only subjects).

## Pushing

Supabase's own mail provider sends 2 emails an hour and, on the free tier, refuses custom templates, so custom SMTP has to be on first. It is: Resend (`smtp.resend.com`, port 465, user `resend`, password = the Resend API key, sender `hello@semli.app`), set in the dashboard under Authentication → Emails → SMTP Settings on Oct 20, 2026. That raised the limit to 30 emails an hour (adjustable under Rate Limits).

With the CLI logged in (`npx supabase login`) and the project linked (`npx supabase link --project-ref vhzuefbxrzlhnvyrldad`):

    npx supabase config diff
    npx supabase config push

Then sign up from the app and check the email shows a code with the subject "Your Semli code".
