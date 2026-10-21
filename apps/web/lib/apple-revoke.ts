import { createPrivateKey, sign } from 'node:crypto';

/*
 * Sign in with Apple revocation, which App Review requires when an account that signed in with
 * Apple is deleted. The app re-authorizes with Apple to get a fresh authorization code, sends it
 * here, and this exchanges it for a refresh token and revokes it. The key never leaves the server.
 * Apple: https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens
 */

export interface AppleEnv {
  teamId: string;
  keyId: string;
  /** The .p8 key's PEM; newlines may be stored as \n in the environment. */
  privateKey: string;
  /** The app's bundle id for native sign-in (app.semli.mobile). */
  clientId: string;
}

export function appleEnv(): AppleEnv | null {
  const { APPLE_TEAM_ID: teamId, APPLE_KEY_ID: keyId, APPLE_PRIVATE_KEY: key, APPLE_CLIENT_ID: clientId } = process.env;
  return teamId && keyId && key && clientId ? { teamId, keyId, privateKey: key.replace(/\\n/g, '\n'), clientId } : null;
}

const base64url = (data: Buffer | string) => Buffer.from(data).toString('base64url');

/** The ES256 client secret Apple asks for: a JWT signed with the Sign in with Apple key, valid five minutes. */
export function clientSecret(env: AppleEnv, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: env.keyId }));
  const payload = base64url(JSON.stringify({ iss: env.teamId, iat, exp: iat + 300, aud: 'https://appleid.apple.com', sub: env.clientId }));
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), { key: createPrivateKey(env.privateKey), dsaEncoding: 'ieee-p1363' });
  return `${header}.${payload}.${base64url(signature)}`;
}

/** Exchanges the authorization code for a token and revokes it. True when Apple accepted the revocation. */
export async function revokeAppleAuthorization(code: string, env: AppleEnv, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const secret = clientSecret(env);
  const form = (fields: Record<string, string>) => ({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  const exchanged = await fetchImpl('https://appleid.apple.com/auth/token', form({ client_id: env.clientId, client_secret: secret, code, grant_type: 'authorization_code' }));
  if (!exchanged.ok) return false;
  const tokens = (await exchanged.json()) as { refresh_token?: string; access_token?: string };
  const token = tokens.refresh_token ?? tokens.access_token;
  if (!token) return false;
  const revoked = await fetchImpl('https://appleid.apple.com/auth/revoke', form({
    client_id: env.clientId, client_secret: secret, token, token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
  }));
  return revoked.ok;
}
