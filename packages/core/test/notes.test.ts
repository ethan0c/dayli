import { describe, expect, it } from 'vitest';
import { noteInline, noteProgress, parseNotes, toggleNoteCheck } from '../src';

const note = '# Pharm exam\nBring **two** pencils\n\n- [ ] chapters 4–6\n- [x] flashcards\n- study guide: https://canvas.edu/x\n1. sleep';

describe('notes as a small markdown file', () => {
  it('reads headings, lists, ticks, and paragraphs by line', () => {
    expect(parseNotes(note).map((b) => b.kind)).toEqual(['heading', 'paragraph', 'blank', 'check', 'check', 'bullet', 'bullet']);
    const blocks = parseNotes(note);
    expect(blocks[3]).toMatchObject({ kind: 'check', done: false, line: 3 });
    expect(blocks[4]).toMatchObject({ kind: 'check', done: true });
    expect(blocks[6]).toMatchObject({ kind: 'bullet', ordinal: 1 });
  });
  it('finds bold and links inside a line', () => {
    expect(noteInline('Bring **two** pencils')).toEqual([{ kind: 'text', text: 'Bring ' }, { kind: 'bold', text: 'two' }, { kind: 'text', text: ' pencils' }]);
    expect(noteInline('see https://canvas.edu/x today')).toEqual([{ kind: 'text', text: 'see ' }, { kind: 'link', text: 'https://canvas.edu/x' }, { kind: 'text', text: ' today' }]);
  });
  it('flips a tick without touching the rest', () => {
    const ticked = toggleNoteCheck(note, 3);
    expect(ticked.split('\n')[3]).toBe('- [x] chapters 4–6');
    expect(toggleNoteCheck(ticked, 4).split('\n')[4]).toBe('- [ ] flashcards');
    expect(toggleNoteCheck(note, 1)).toBe(note);
    expect(noteProgress(note)).toEqual({ done: 1, total: 2 });
    expect(noteProgress('plain')).toBeNull();
  });
});
