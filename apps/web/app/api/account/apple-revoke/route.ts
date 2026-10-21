import { appleEnv, revokeAppleAuthorization } from '../../../../lib/apple-revoke';
import { supabaseEnv } from '../../../../lib/supabase';

/**
 * Called by the app just before it deletes an account that signed in with Apple. Needs the
 * person's own (non-guest) session, so a stray request cannot revoke anyone's authorization.
 */
export async function POST(request: Request) {
  const apple = appleEnv();
  const base = supabaseEnv();
  if (!apple || !base) return Response.json({ ok: false, error: 'Apple revocation is not configured.' }, { status: 503 });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ ok: false, error: 'Sign in again to delete your account.' }, { status: 401 });
  const user = await fetch(`${base.url}/auth/v1/user`, { headers: { apikey: base.key, authorization: `Bearer ${token}` } });
  if (!user.ok) return Response.json({ ok: false, error: 'Sign in again to delete your account.' }, { status: 401 });
  const { is_anonymous } = (await user.json()) as { is_anonymous?: boolean };
  if (is_anonymous) return Response.json({ ok: false, error: 'Guests have no Apple sign-in to remove.' }, { status: 400 });

  let code: unknown;
  try {
    ({ code } = (await request.json()) as { code?: unknown });
  } catch {
    code = undefined;
  }
  if (typeof code !== 'string' || !code || code.length > 2048) return Response.json({ ok: false, error: 'Missing Apple authorization.' }, { status: 400 });

  const revoked = await revokeAppleAuthorization(code, apple).catch(() => false);
  return revoked ? Response.json({ ok: true }) : Response.json({ ok: false, error: 'Apple didn’t accept the revocation. Try again.' }, { status: 502 });
}
