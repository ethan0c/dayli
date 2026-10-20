import { rpc, supabaseEnv } from './supabase';

/** What the form shows; nothing from the database reaches the page. */
export const WAITLIST_MESSAGES = {
  email: 'That doesn’t look like an email address.',
  unavailable: 'The waitlist is down for a moment. Try again in a minute, or email hello@semli.app.',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const validEmail = (email: string) => EMAIL.test(email) && email.length <= 254;

/** A referral tag from `?r=`: short, printable, nothing else. */
export function cleanRef(ref: unknown): string | null {
  if (typeof ref !== 'string') return null;
  const r = ref.trim().slice(0, 64);
  return /^[\w.-]+$/.test(r) ? r : null;
}

export type JoinResult = { ok: true } | { ok: false; status: 400 | 503; error: string };

export async function joinWaitlist(email: string, ref: string | null): Promise<JoinResult> {
  const e = email.trim().toLowerCase();
  if (!validEmail(e)) return { ok: false, status: 400, error: WAITLIST_MESSAGES.email };
  const base = supabaseEnv();
  if (!base) {
    console.error('[waitlist.join]', { code: 'not_configured' });
    return { ok: false, status: 503, error: WAITLIST_MESSAGES.unavailable };
  }
  try {
    await rpc(base, 'join_waitlist', { p_email: e, p_ref: ref });
    return { ok: true };
  } catch (error) {
    console.error('[waitlist.join]', { code: 'rpc_failed', message: error instanceof Error ? error.message : String(error) });
    return { ok: false, status: 503, error: WAITLIST_MESSAGES.unavailable };
  }
}

/** A click on semli.app/beta. Never blocks the redirect; a lost row is fine. */
export async function logBetaClick(ref: string | null): Promise<void> {
  const base = supabaseEnv();
  if (!base) return;
  try {
    await rpc(base, 'log_beta_click', { p_ref: ref });
  } catch (error) {
    console.error('[waitlist.click]', { code: 'rpc_failed', message: error instanceof Error ? error.message : String(error) });
  }
}
