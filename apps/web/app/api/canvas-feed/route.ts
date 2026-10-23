import { errorDiagnostic } from '@dayli/core';
import { isCanvasFeed } from '../../../lib/canvas-feed';
import { cors } from '../../../lib/cors';
import { supabaseEnv } from '../../../lib/supabase';

/*
 * The web planner's way to a Canvas calendar feed: Canvas doesn't allow browsers on other sites
 * to read it, so the server fetches it and hands the calendar back unchanged. The iPhone fetches
 * the feed itself. Only Canvas feed addresses on a named host, for someone signed in, with no
 * redirects followed, so this can't be pointed anywhere else.
 */

export const maxDuration = 30;

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 5 * 1024 * 1024;

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request) {
  const headers = cors(request);
  const fail = (status: number) => new Response(null, { status, headers });

  const base = supabaseEnv();
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (base) {
    if (!token) return fail(401);
    const user = await fetch(`${base.url}/auth/v1/user`, { headers: { apikey: base.key, authorization: `Bearer ${token}` } }).catch(() => null);
    if (!user?.ok) return fail(401);
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!isCanvasFeed(url)) return fail(400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(url, { signal: controller.signal, redirect: 'manual', headers: { accept: 'text/calendar' } });
    // The app reads 401/403/404 as "Canvas didn't accept that link"; anything else as unreachable.
    if (!upstream.ok) return fail([401, 403, 404].includes(upstream.status) ? upstream.status : 502);
    const text = await upstream.text();
    if (text.length > MAX_BYTES) return fail(502);
    return new Response(text, { status: 200, headers: { ...headers, 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('[canvas_feed.fetch]', errorDiagnostic(error));
    return fail(controller.signal.aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
