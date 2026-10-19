import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMPORT_MESSAGES, type ExtractRequest } from '@dayli/schema';
import { requestExtraction } from './api';

const request: ExtractRequest = {
  input: { kind: 'text', text: 'Exam tomorrow at 9' },
  context: { today: '2026-10-19', timezone: 'America/New_York', courses: [], employers: [] },
};

afterEach(() => vi.unstubAllGlobals());

describe('friendly import failures', () => {
  it('offers a next step when the connection fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await requestExtraction('https://dayli.test', request)).toEqual({ ok: false, error: IMPORT_MESSAGES.connection });
  });

  it.each([
    [400, IMPORT_MESSAGES.request],
    [413, IMPORT_MESSAGES.tooLarge],
    [415, IMPORT_MESSAGES.unsupported],
    [429, IMPORT_MESSAGES.busy],
    [502, IMPORT_MESSAGES.unavailable],
    [504, IMPORT_MESSAGES.timeout],
  ])('explains an unreadable HTTP %i response without showing server details', async (status, error) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Proxy error</html>', { status })));
    expect(await requestExtraction('https://dayli.test', request)).toEqual({ ok: false, error });
  });

  it('handles an unexpected response shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Internal error' })));
    expect(await requestExtraction('https://dayli.test', request)).toEqual({ ok: false, error: IMPORT_MESSAGES.unavailable });
  });

  it('keeps a helpful error returned by Dayli', async () => {
    const body = { ok: false, error: IMPORT_MESSAGES.request };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status: 400 })));
    expect(await requestExtraction('https://dayli.test', request)).toEqual(body);
  });
});
