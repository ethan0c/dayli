import { describe, expect, it } from 'vitest';
import { realRecords, starterCards } from './planner-preview';

describe('personalized starter previews', () => {
  it('uses a student’s field and shows work uploads only when their week includes work', () => {
    const settings = { isStudent: true, major: 'cs', weekKinds: ['classes'] };
    const cards = starterCards(settings);
    expect(cards.map((c) => c.id)).toEqual(['school', 'message']);
    expect(cards[0]!.examples.some((row) => row.title.includes('PA2') || row.title.includes('Data structures'))).toBe(true);
    expect(starterCards({ ...settings, weekKinds: ['classes', 'work'] }).map((c) => c.id)).toEqual(['work', 'school', 'message']);
  });

  it('gives working people relevant prompts without inventing courses', () => {
    const cards = starterCards({ isStudent: false, major: null, weekKinds: [] });
    expect(cards.map((c) => c.id)).toEqual(['work', 'message']);
    expect(cards[0]!.source).toBe('image');
    expect(cards[1]!.source).toBeUndefined();
  });

  it('keeps examples out of live records without removing manual or imported data', () => {
    const sample = { id: 'demo', sourceId: 'sample' };
    const manual = { id: 'manual', sourceId: null };
    const imported = { id: 'real', sourceId: 'schedule.jpg' };
    const records = Object.freeze([sample, manual, imported]);
    expect(realRecords([...records])).toEqual([manual, imported]);
    expect(records).toHaveLength(3);
  });

  it('keeps School focused on a syllabus and supports an unset field of study', () => {
    const cards = starterCards({ isStudent: true, major: null, weekKinds: ['work'] }, true);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.source).toBe('file');
    expect(cards[0]!.examples.length).toBeGreaterThan(0);
  });
});
