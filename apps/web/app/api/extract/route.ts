import Anthropic from '@anthropic-ai/sdk';
import { extract } from '@dayli/extract';
import { ExtractRequest, type ExtractResponse } from '@dayli/schema';

export const maxDuration = 60;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function reply(body: ExtractResponse, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return reply({ ok: false, error: 'The request was not valid JSON.' }, 400);
  }
  const parsed = ExtractRequest.safeParse(json);
  if (!parsed.success) {
    return reply({ ok: false, error: 'The request was missing something Dayli needs.' }, 400);
  }

  try {
    const result = await extract(parsed.data);
    if (!result.ok) return reply(result, 422);
    return reply({ ok: true, extraction: result.extraction });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return reply({ ok: false, error: 'The Dayli server is not signed in to Claude. Set ANTHROPIC_API_KEY.' }, 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return reply({ ok: false, error: 'Dayli is busy right now. Try again in a minute.' }, 429);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return reply({ ok: false, error: "Dayli couldn't reach Claude. Try again." }, 502);
    }
    // A plain Error from the SDK when no credentials are configured at all.
    if (err instanceof Error && /authentication method|API_KEY/i.test(err.message)) {
      return reply({ ok: false, error: 'The Dayli server is not signed in to Claude. Set ANTHROPIC_API_KEY.' }, 500);
    }
    console.error('[extract]', err);
    return reply({ ok: false, error: "Dayli couldn't read that right now. Try again." }, 502);
  }
}
