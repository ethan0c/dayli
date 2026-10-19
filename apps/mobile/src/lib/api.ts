import { ExtractResponse, IMPORT_MESSAGES, importErrorForStatus, type ExtractRequest } from '@dayli/schema';

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function requestExtraction(apiUrl: string, req: ExtractRequest): Promise<ExtractResponse> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    return { ok: false, error: IMPORT_MESSAGES.connection };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: importErrorForStatus(res.status) };
  }
  const parsed = ExtractResponse.safeParse(body);
  if (!parsed.success || (!res.ok && parsed.data.ok)) return { ok: false, error: importErrorForStatus(res.status) };
  return parsed.data;
}
