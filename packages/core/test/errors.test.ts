import { describe, expect, it } from 'vitest';
import { errorDiagnostic, redactDiagnosticText } from '../src/errors';

describe('safe error diagnostics', () => {
  it('keeps actionable SDK details without serializing requests, receipts or session objects', () => {
    const diagnostic = errorDiagnostic({ name: 'AuthApiError', code: 'invalid_credentials', status: 400,
      message: 'Invalid credentials for person@example.com', request: { password: 'private-password' }, receipt: 'private-receipt' });
    expect(diagnostic).toMatchObject({ name: 'AuthApiError', code: 'invalid_credentials', status: 400, message: 'Invalid credentials for [email]' });
    expect(JSON.stringify(diagnostic)).not.toMatch(/private-password|private-receipt|person@example.com/);
  });
  it('redacts private feed URLs, local paths, API keys, tokens, passwords and verification codes', () => {
    const input = 'https://school.test/feeds/private-token?code=123456 password="my secret" access_token=token-value Bearer bearer-secret sk-ant-private-key person@example.com /Users/Ama/project/file.ts code: 654321';
    const output = redactDiagnosticText(input);
    for (const secret of ['school.test', 'private-token', '123456', 'my secret', 'token-value', 'bearer-secret', 'sk-ant-private-key', 'person@example.com', 'Ama', '654321']) expect(output).not.toContain(secret);
    expect(output).toContain('/[user]/project/file.ts');
  });
  it('does not log serialized payloads or extra lines embedded in an error message as stack frames', () => {
    const error = new Error('{"uploaded_schedule":"private details"}');
    error.stack = 'Error: failure\nprivate uploaded contents\n    at load (/Users/Ama/app/import.ts:10:2)';
    expect(errorDiagnostic(error)).toMatchObject({ message: 'Structured error details omitted', stack: '    at load (/[user]/app/import.ts:10:2)' });
  });
  it('handles circular SDK errors and omits non-diagnostic code values', () => {
    const error: Record<string, unknown> = { code: '123456', statusCode: 503, message: 'Service unavailable' };
    error.cause = error;
    expect(errorDiagnostic(error)).toMatchObject({ code: undefined, status: 503, message: 'Service unavailable' });
  });
});
