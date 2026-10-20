import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WAITLIST_MESSAGES } from '../../../lib/waitlist';
import { POST } from './route';

const post = (body: unknown) => POST(new Request('https://semli.test/api/waitlist', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }));

describe('waitlist API', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each(['not json', '{}', { email: 'nope' }, { email: 'a@b' }])('rejects bad input: %s', async (body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: WAITLIST_MESSAGES.email });
  });

  it('says it is unavailable without Supabase configured', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_KEY', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post({ email: 'jess@school.edu' });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: WAITLIST_MESSAGES.unavailable });
  });

  describe('with Supabase', () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
      vi.stubEnv('SUPABASE_URL', 'https://db.test/');
      vi.stubEnv('SUPABASE_KEY', 'sb_publishable_test');
      vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(null, { status: 204 })));
    });

    it('lowercases the email, keeps a clean referral tag and drops a dirty one', async () => {
      expect((await post({ email: ' Jess@School.edu ', ref: 'nursing-tiktok' })).status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith('https://db.test/rest/v1/rpc/join_waitlist', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ p_email: 'jess@school.edu', p_ref: 'nursing-tiktok' }),
      }));
      await post({ email: 'jess@school.edu', ref: '<script>' });
      expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ p_email: 'jess@school.edu', p_ref: null });
    });

    it('keeps database errors out of the response', async () => {
      fetchMock.mockResolvedValue(new Response('relation "waitlist" does not exist', { status: 500 }));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await post({ email: 'jess@school.edu' });
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ ok: false, error: WAITLIST_MESSAGES.unavailable });
    });
  });
});
