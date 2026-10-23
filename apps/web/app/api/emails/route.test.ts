import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../../lib/transactional-email';
import { GET, POST } from './route';

const row = { id: 7, email: 'ama@school.edu', kind: 'account_deleted' as const, name: 'Ama Owusu', created_at: '2026-10-23T10:00:00Z' };
const ok = (body: unknown, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

describe('the account-deleted email', () => {
  it('says what was deleted, what stays, and that Plus is not cancelled', () => {
    const mail = render(row);
    expect(mail.subject).toBe('Your Semli account is deleted');
    expect(mail.text).toContain('Hi Ama,');
    expect(mail.text).toContain('does not cancel Semli Plus');
    expect(render({ ...row, name: '<b>x</b>' }).html).not.toContain('<b>x</b>');
  });
});

describe('the outbox sender', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://db.test/');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('sends each queued row once and deletes it', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      url.includes('email_outbox?select') ? ok([row]) : url.includes('resend.com') ? ok({ id: 'e1' }) : init?.method === 'DELETE' ? ok(null, 204) : ok(null, 404));
    const res = await POST();
    expect(await res.json()).toEqual({ ok: true, sent: 1, failed: 0 });
    const send = fetchMock.mock.calls.find(([u]) => String(u).includes('resend.com'))!;
    expect(JSON.parse(String((send[1] as RequestInit).body)).to).toEqual(['ama@school.edu']);
    expect(fetchMock.mock.calls.some(([u, i]) => String(u).includes('id=eq.7') && (i as RequestInit).method === 'DELETE')).toBe(true);
  });

  it('keeps a row whose send failed, to retry next run', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockImplementation(async (url: string) => url.includes('email_outbox?select') ? ok([row]) : ok({ message: 'nope' }, 500));
    expect(await (await POST()).json()).toEqual({ ok: true, sent: 0, failed: 1 });
    expect(fetchMock.mock.calls.some(([, i]) => (i as RequestInit | undefined)?.method === 'DELETE')).toBe(false);
  });

  it('lets only the cron secret through GET', async () => {
    fetchMock.mockImplementation(async () => ok([]));
    expect((await GET(new Request('https://semli.test/api/emails'))).status).toBe(401);
    expect((await GET(new Request('https://semli.test/api/emails', { headers: { authorization: 'Bearer cron' } }))).status).toBe(200);
  });
});
