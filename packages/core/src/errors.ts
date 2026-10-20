/** Diagnostic text only: never pass request bodies, sessions, files or SDK objects to a logger. */
export function redactDiagnosticText(text: string): string {
  return text
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\b(?:https?|file|content|ph):\/\/[^\s<>"']+/gi, '[url]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\b(?:sk|sb_secret|sb_publishable)[_-][A-Za-z0-9_-]+\b/g, '[key]')
    .replace(/(["']?\b(?:password|passwd|access_token|refresh_token|token|authorization|api[_-]?key|secret|receipt|email|otp)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[redacted]')
    .replace(/\/(?:Users|home)\/[^/\s]+/g, '/[user]')
    .slice(0, 2000);
}

export function errorDiagnostic(error: unknown) {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const name = typeof record.name === 'string' && /^[\w.]{1,80}$/.test(record.name) ? record.name : 'Error';
  const code = typeof record.code === 'string' && /^(?:[A-Za-z][\w.-]{0,79}|\d{1,3})$/.test(record.code) ? record.code
    : typeof record.code === 'number' && Math.abs(record.code) < 1000 ? String(record.code) : undefined;
  const status = typeof record.status === 'number' ? record.status : typeof record.statusCode === 'number' ? record.statusCode : undefined;
  const rawMessage = typeof record.message === 'string' ? record.message : typeof error === 'string' ? error : 'No error message provided';
  // Serialized responses can contain uploads, credentials or receipts. Keep their code/status instead.
  const message = /^[\s]*[\[{]/.test(rawMessage) ? 'Structured error details omitted' : redactDiagnosticText(rawMessage);
  const stack = typeof record.stack === 'string' ? redactDiagnosticText(record.stack.split('\n').slice(1, 13).join('\n')) : undefined;
  return { name, code, status, message, stack };
}
