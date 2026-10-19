import { beforeEach, describe, expect, it, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { IMPORT_MESSAGES } from '@dayli/schema';
import { extract } from '@dayli/extract';
import { POST } from './route';

vi.mock('@dayli/extract', () => ({ extract: vi.fn() }));

const request = () => new Request('https://dayli.test/api/extract', {
  method: 'POST',
  body: JSON.stringify({
    input: { kind: 'text', text: 'Exam tomorrow at 9' },
    context: { today: '2026-10-19', timezone: 'America/New_York', courses: [], employers: [] },
  }),
});

beforeEach(() => vi.clearAllMocks());

describe('import API errors', () => {
  it.each(['not json', '{}'])('gives a readable response to incomplete input: %s', async (body) => {
    const res = await POST(new Request('https://dayli.test/api/extract', { method: 'POST', body }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: IMPORT_MESSAGES.request });
    expect(extract).not.toHaveBeenCalled();
  });

  it.each([
    [Anthropic.AuthenticationError, 500, IMPORT_MESSAGES.unavailable],
    [Anthropic.RateLimitError, 429, IMPORT_MESSAGES.busy],
    [Anthropic.APIConnectionError, 502, IMPORT_MESSAGES.unavailable],
  ])('keeps provider details out of the response for %s', async (ErrorType, status, error) => {
    vi.mocked(extract).mockRejectedValue(Object.setPrototypeOf(new Error('Provider details'), ErrorType.prototype));
    const res = await POST(request());
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ ok: false, error });
  });

  it('keeps missing API credentials out of the response', async () => {
    vi.mocked(extract).mockRejectedValue(new Error('Set ANTHROPIC_API_KEY authentication method'));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: IMPORT_MESSAGES.unavailable });
  });
});
