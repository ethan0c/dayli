import { cleanRef, joinWaitlist, WAITLIST_MESSAGES } from '../../../lib/waitlist';

export async function POST(request: Request) {
  let body: { email?: unknown; ref?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: WAITLIST_MESSAGES.email }, { status: 400 });
  }
  if (typeof body?.email !== 'string') return Response.json({ ok: false, error: WAITLIST_MESSAGES.email }, { status: 400 });
  const result = await joinWaitlist(body.email, cleanRef(body.ref));
  return result.ok ? Response.json({ ok: true }) : Response.json({ ok: false, error: result.error }, { status: result.status });
}
