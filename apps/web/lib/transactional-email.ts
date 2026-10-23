import { SITE_URL, SUPPORT_EMAIL } from './site';

/**
 * Emails that follow something the person did, as opposed to the broadcasts in /emails. Plain,
 * short, one job each. Every one names what happened, what it means, and what to do if it was
 * not them.
 */

export type OutboxRow = { id: number; email: string; kind: 'account_deleted'; name: string | null; created_at: string };
export type Email = { subject: string; text: string; html: string };

const escape = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

function html(paragraphs: string[]): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#222320;">${escape(p)}</p>`).join('');
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,Helvetica,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;">${body}</div></body></html>`;
}

export function render(row: OutboxRow): Email {
  const hi = row.name ? `Hi ${row.name.split(' ')[0]},` : 'Hi,';
  const paragraphs = [
    hi,
    'Your Semli account is deleted. Your sign-in, your email address and the plan backup are gone from our servers, and this is the last email we send to this address about it.',
    'The plan on your phone stays until you delete the app or clear it in You → Your data, and Semli keeps working there as a guest.',
    'Deleting your account does not cancel Semli Plus. Subscriptions belong to your Apple ID: open Settings, tap your name, then Subscriptions, and choose Semli.',
    `If you didn't delete your account, reply to this email or write to ${SUPPORT_EMAIL} today.`,
    `Semli · ${SITE_URL.replace('https://', '')}`,
  ];
  return { subject: 'Your Semli account is deleted', text: paragraphs.join('\n\n'), html: html(paragraphs) };
}
