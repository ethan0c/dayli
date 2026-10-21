/**
 * Notes are a plain text file with a few Markdown habits: "# " for a heading, "- " for a list,
 * "- [ ]" for something to tick off, "**bold**", and links that open. Nothing else; the text
 * stays readable as text anywhere it ends up (export, backup, a share).
 */

export type NoteInline = { kind: 'text' | 'bold' | 'link'; text: string };
export type NoteBlock =
  | { kind: 'heading'; level: 1 | 2; inline: NoteInline[]; line: number }
  | { kind: 'paragraph'; inline: NoteInline[]; line: number }
  | { kind: 'bullet'; inline: NoteInline[]; line: number; ordinal: number | null }
  | { kind: 'check'; inline: NoteInline[]; line: number; done: boolean }
  | { kind: 'blank'; line: number };

const URL = /https?:\/\/[^\s)]+|\bwww\.[^\s)]+/g;
const BOLD = /\*\*([^*]+)\*\*/g;

export function noteInline(text: string): NoteInline[] {
  const out: NoteInline[] = [];
  let at = 0;
  const marks: { start: number; end: number; kind: 'bold' | 'link'; text: string }[] = [
    ...[...text.matchAll(BOLD)].map((m) => ({ start: m.index, end: m.index + m[0].length, kind: 'bold' as const, text: m[1]! })),
    ...[...text.matchAll(URL)].map((m) => ({ start: m.index, end: m.index + m[0].length, kind: 'link' as const, text: m[0] })),
  ].sort((a, b) => a.start - b.start);
  for (const mark of marks) {
    if (mark.start < at) continue;
    if (mark.start > at) out.push({ kind: 'text', text: text.slice(at, mark.start) });
    out.push({ kind: mark.kind, text: mark.text });
    at = mark.end;
  }
  if (at < text.length) out.push({ kind: 'text', text: text.slice(at) });
  return out;
}

export function parseNotes(text: string): NoteBlock[] {
  return text.split('\n').map((raw, line): NoteBlock => {
    const s = raw.trimEnd();
    if (!s.trim()) return { kind: 'blank', line };
    const heading = /^(#{1,2})\s+(.*)$/.exec(s);
    if (heading) return { kind: 'heading', level: heading[1]!.length === 1 ? 1 : 2, inline: noteInline(heading[2]!), line };
    const check = /^\s*[-*]\s+\[( |x|X)\]\s*(.*)$/.exec(s);
    if (check) return { kind: 'check', inline: noteInline(check[2]!), line, done: check[1] !== ' ' };
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(s);
    if (bullet) return { kind: 'bullet', inline: noteInline(bullet[1]!), line, ordinal: null };
    const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(s);
    if (numbered) return { kind: 'bullet', inline: noteInline(numbered[2]!), line, ordinal: Number(numbered[1]) };
    return { kind: 'paragraph', inline: noteInline(s), line };
  });
}

/** The same text with the checkbox on `line` flipped; anything else is returned unchanged. */
export function toggleNoteCheck(text: string, line: number): string {
  const lines = text.split('\n');
  const current = lines[line];
  if (current === undefined) return text;
  const next = /^(\s*[-*]\s+\[)( )(\])/.test(current)
    ? current.replace(/^(\s*[-*]\s+\[) (\])/, '$1x$2')
    : current.replace(/^(\s*[-*]\s+\[)[xX](\])/, '$1 $2');
  if (next === current) return text;
  lines[line] = next;
  return lines.join('\n');
}

/** "2 of 5 done" for the ticks in a note, or null when it has none. */
export function noteProgress(text: string): { done: number; total: number } | null {
  const checks = parseNotes(text).filter((b): b is Extract<NoteBlock, { kind: 'check' }> => b.kind === 'check');
  return checks.length ? { done: checks.filter((c) => c.done).length, total: checks.length } : null;
}
