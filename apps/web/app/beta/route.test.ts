import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('next/navigation', () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT ${to}`); }) }));

const target = async (url: string) => {
  try {
    await GET(new Request(url));
  } catch (e) {
    return (e as Error).message.replace('REDIRECT ', '');
  }
  throw new Error('did not redirect');
};

describe('/beta', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://db.test');
    vi.stubEnv('SUPABASE_KEY', 'sb_publishable_test');
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(null, { status: 204 })));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it('goes to the waitlist, keeping the referral, until TestFlight is set', async () => {
    vi.stubEnv('TESTFLIGHT_URL', '');
    expect(await target('https://semli.app/beta')).toBe('/#beta');
    expect(await target('https://semli.app/beta?r=jess')).toBe('/?r=jess#beta');
  });

  it('goes to TestFlight once the link exists and counts the click', async () => {
    vi.stubEnv('TESTFLIGHT_URL', 'https://testflight.apple.com/join/abc');
    expect(await target('https://semli.app/beta?r=jess')).toBe('https://testflight.apple.com/join/abc');
    expect(fetchMock).toHaveBeenCalledWith('https://db.test/rest/v1/rpc/log_beta_click', expect.objectContaining({ body: JSON.stringify({ p_ref: 'jess' }) }));
  });

  it('still redirects when the click cannot be counted', async () => {
    vi.stubEnv('TESTFLIGHT_URL', 'https://testflight.apple.com/join/abc');
    fetchMock.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await target('https://semli.app/beta')).toBe('https://testflight.apple.com/join/abc');
  });
});
