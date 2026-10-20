import { createHash } from 'node:crypto';
import { IMPORT_MESSAGES } from '@dayli/schema';

/*
 * Who may spend an import. The app sends its Supabase session (guests have an anonymous
 * one) and its RevenueCat id: Plus is unlimited, everyone else gets the free monthly
 * imports, counted in the database. The website demo has no session: a few previews a
 * day per hashed IP. Without Supabase configured (local development) nothing is limited.
 */

export const FREE_IMPORTS_PER_MONTH = 3;
export const DEMO_PREVIEWS_PER_DAY = 5;
const PRO_ENTITLEMENT = 'semli_pro';

export type Access =
  | { ok: true; refund: () => Promise<void> }
  | { ok: false; status: 401 | 402 | 429; error: string };

const free = async () => {};

function env() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

async function rpc(base: { url: string; key: string }, name: string, body: object, token?: string): Promise<unknown> {
  const res = await fetch(`${base.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: base.key, authorization: `Bearer ${token ?? base.key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`rpc ${name} ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/** RevenueCat is the source of truth for Plus; the secret key never leaves the server. */
async function hasPlus(appUserId: string | null): Promise<boolean> {
  const secret = process.env.REVENUECAT_SECRET_KEY;
  if (!secret || !appUserId) return false;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { subscriber?: { entitlements?: Record<string, { expires_date: string | null }> } };
  const ent = data.subscriber?.entitlements?.[PRO_ENTITLEMENT];
  return !!ent && (ent.expires_date === null || Date.parse(ent.expires_date) > Date.now());
}

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function checkImportAccess(request: Request): Promise<Access> {
  const base = env();
  if (!base) return { ok: true, refund: free };

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!token) {
    const ipHash = createHash('sha256').update(`semli-demo:${clientIp(request)}`).digest('hex');
    const allowed = await rpc(base, 'claim_demo', { p_ip_hash: ipHash, p_limit: DEMO_PREVIEWS_PER_DAY });
    return allowed === true ? { ok: true, refund: free } : { ok: false, status: 429, error: IMPORT_MESSAGES.demoLimit };
  }

  const user = await fetch(`${base.url}/auth/v1/user`, { headers: { apikey: base.key, authorization: `Bearer ${token}` } });
  if (!user.ok) return { ok: false, status: 401, error: IMPORT_MESSAGES.session };

  if (await hasPlus(request.headers.get('x-revenuecat-app-user-id'))) return { ok: true, refund: free };

  const allowed = await rpc(base, 'claim_import', { p_limit: FREE_IMPORTS_PER_MONTH }, token);
  if (allowed !== true) return { ok: false, status: 402, error: IMPORT_MESSAGES.quota };
  return { ok: true, refund: () => rpc(base, 'refund_import', {}, token).then(() => {}, () => {}) };
}
