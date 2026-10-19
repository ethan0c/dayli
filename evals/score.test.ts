import { describe, expect, it } from 'vitest';
import type { ExtractedItem, Extraction } from '@dayli/schema';
import type { EvalCase, ExpectedItem } from './schema';
import { aggregate, score } from './score';

const actualItem = (patch: Partial<ExtractedItem> = {}): ExtractedItem => ({
  title: 'Work shift', kind: 'event', category: 'work', date: '2026-10-23', start: '16:00', end: '22:00',
  is_deadline: false, repeat_weekdays: [], repeat_until: null, course_code: null,
  evidence: 'Friday 4-10', confidence: .99, question: null, ...patch,
});
const extraction = (items: ExtractedItem[]): Extraction => ({ detected_type: 'general', employer: null, course: null, covers_from: null, covers_to: null, items });
const fixture = (items: ExpectedItem[], complete = true): EvalCase => ({
  id: 'test', provenance: 'synthetic', source: 'test', format: 'test', notes: 'test', input: { kind: 'text', text: 'test' },
  context: { today: '2026-10-19', timezone: 'America/New_York', courses: [], employers: [] },
  expected: { complete, metadata: {}, items },
});
const wanted: ExpectedItem = { match: 'shift', date: '2026-10-23', start: '16:00', end: '22:00' };

describe('extraction eval scoring', () => {
  it('counts missing items against both recall and date/time accuracy', () => {
    const result = score(fixture([wanted]), extraction([]));
    expect(result).toMatchObject({ matched: 0, timeCorrect: 0, timeTotal: 3 });
    expect(aggregate([result])).toMatchObject({ recall: 0, dateTimeAccuracy: 0, pass: false });
  });
  it('does not let a duplicate reuse one expected item', () => {
    const result = score(fixture([wanted]), extraction([actualItem(), actualItem()]));
    expect(result).toMatchObject({ matched: 1, extra: 1 });
    expect(aggregate([result])).toMatchObject({ extraRate: .5, pass: false });
  });
  it('matches repeated titles independently of output order', () => {
    const other = { ...wanted, date: '2026-10-24', start: '11:00', end: '17:00' };
    const result = score(fixture([wanted, other]), extraction([actualItem({ date: other.date, start: other.start, end: other.end }), actualItem()]));
    expect(result).toMatchObject({ matched: 2, timeCorrect: 6, extra: 0 });
  });
  it('does not hide a wrong date by matching an unrelated title', () => {
    const result = score(fixture([wanted]), extraction([actualItem({ date: '2026-10-24' }), actualItem({ title: 'Dentist' })]));
    expect(result).toMatchObject({ timeCorrect: 2, extra: 1 });
  });
  it('never passes partially labeled output', () => {
    const result = score(fixture([wanted], false), extraction([actualItem()]));
    expect(aggregate([result])).toMatchObject({ dateTimeAccuracy: 1, extraRate: null, pass: false });
  });
  it('never counts an absent result as successful', () => {
    expect(aggregate([score(fixture([]), null)])).toMatchObject({ pass: false });
  });
  it('requires explicit dates instead of accepting invented dates for undated tasks', () => {
    const result = score(fixture([{ ...wanted, date: null, start: null, end: null, needsQuestion: true }]), extraction([actualItem({ date: '2026-10-23', start: null, end: null })]));
    expect(result.timeCorrect).toBe(2);
    expect(result.otherCorrect).toBe(0);
  });
  it('shows no-data metrics as unknown rather than 100% accurate', () => {
    expect(aggregate([])).toMatchObject({ dateTimeAccuracy: null, recall: null, extraRate: null, pass: false });
  });
});
