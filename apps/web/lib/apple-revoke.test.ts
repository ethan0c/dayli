import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { clientSecret, revokeAppleAuthorization, type AppleEnv } from './apple-revoke';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const env: AppleEnv = { teamId: 'TEAM123', keyId: 'KEY123', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), clientId: 'app.semli.mobile' };

describe('Sign in with Apple revocation', () => {
  it('signs a five-minute ES256 client secret Apple can verify', () => {
    const jwt = clientSecret(env, 1_700_000_000_000);
    const [h, p, s] = jwt.split('.');
    expect(JSON.parse(Buffer.from(h!, 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'KEY123' });
    expect(JSON.parse(Buffer.from(p!, 'base64url').toString())).toEqual({ iss: 'TEAM123', iat: 1_700_000_000, exp: 1_700_000_300, aud: 'https://appleid.apple.com', sub: 'app.semli.mobile' });
    expect(verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s!, 'base64url'))).toBe(true);
  });

  it('exchanges the code, then revokes the refresh token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(Response.json({ refresh_token: 'r1', access_token: 'a1' }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    expect(await revokeAppleAuthorization('code1', env, fetchImpl)).toBe(true);
    expect(fetchImpl.mock.calls[0]![0]).toBe('https://appleid.apple.com/auth/token');
    expect(fetchImpl.mock.calls[1]![0]).toBe('https://appleid.apple.com/auth/revoke');
    const body = new URLSearchParams(fetchImpl.mock.calls[1]![1].body as string);
    expect(body.get('token')).toBe('r1');
    expect(body.get('token_type_hint')).toBe('refresh_token');
  });

  it('reports failure when Apple rejects the code', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 400 }));
    expect(await revokeAppleAuthorization('bad', env, fetchImpl)).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
