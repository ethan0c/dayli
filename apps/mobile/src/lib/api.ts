import { ExtractResponse, IMPORT_MESSAGES, friendlyImportError, importErrorForStatus, type ExtractRequest } from '@dayli/schema';
import { reportError } from './errors';

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function requestExtraction(apiUrl: string, req: ExtractRequest): Promise<ExtractResponse> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (error) {
    reportError('import.request', error);
    return { ok: false, error: IMPORT_MESSAGES.connection };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch (error) {
    reportError('import.response_json', { name: 'ResponseError', code: 'invalid_json', status: res.status, message: 'Import response was not JSON', cause: error });
    return { ok: false, error: importErrorForStatus(res.status) };
  }
  const parsed = ExtractResponse.safeParse(body);
  if (!parsed.success || (!res.ok && parsed.data.ok)) {
    reportError('import.response_schema', { code: 'invalid_response', status: res.status });
    return { ok: false, error: importErrorForStatus(res.status) };
  }
  if (!parsed.data.ok) {
    reportError('import.response', { code: 'import_rejected', status: res.status, message: 'The import service could not process the input' });
    return { ok: false, error: friendlyImportError(parsed.data.error, res.status) };
  }
  return parsed.data;
}
