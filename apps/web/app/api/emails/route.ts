import { errorDiagnostic } from '@dayli/core';
import { render, type OutboxRow } from '../../../lib/transactional-email';
import { SUPPORT_EMAIL } from '../../../lib/site';

/*
 * Sends what the database queued in `email_outbox` (supabase/migrations/20261023100000).
 * Vercel's cron calls it with CRON_SECRET; the app may also call it right after deleting an
 * account so the confirmation arrives in seconds. Calling it only sends what is already queued,
 * so an unauthenticated call can't do more than send those emails sooner.
 */

const BATCH = 50;

function env() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resend = process.env.RESEND_API_KEY;
  return url && service && resend ? { url, service, resend } : null;
}

export async function flush(): Promise<{ sent: number; failed: number }> {
  const e = env();
  if (!e) return { sent: 0, failed: 0 };
  const headers = { apikey: e.service, authorization: `Bearer ${e.service}`, 'content-type': 'application/json' };
  const res = await fetch(`${e.url}/rest/v1/email_outbox?select=*&order=id&limit=${BATCH}`, { headers });
  if (!res.ok) throw new Error(`outbox read ${res.status}`);
  const rows = (await res.json()) as OutboxRow[];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const mail = render(row);
    const out = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${e.resend}`, 'content-type': 'application/json', 'idempotency-key': `outbox-${row.id}` },
      body: JSON.stringify({ from: `Semli <${SUPPORT_EMAIL}>`, to: [row.email], reply_to: SUPPORT_EMAIL, subject: mail.subject, text: mail.text, html: mail.html }),
    });
    if (!out.ok) {
      failed++;
      console.error('[emails.send]', { code: 'resend_failed', status: out.status, kind: row.kind });
      continue;
    }
    await fetch(`${e.url}/rest/v1/email_outbox?id=eq.${row.id}`, { method: 'DELETE', headers });
    sent++;
  }
  return { sent, failed };
}

async function handle(): Promise<Response> {
  try {
    return Response.json({ ok: true, ...(await flush()) });
  } catch (error) {
    console.error('[emails.flush]', errorDiagnostic(error));
    return Response.json({ ok: false }, { status: 503 });
  }
}

/** Vercel cron. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  return handle();
}

/** The app, right after an account is deleted. */
export async function POST() {
  return handle();
}
