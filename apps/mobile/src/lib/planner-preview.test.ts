import { describe, expect, it } from 'vitest';
import { realRecords } from './planner-preview';

describe('live records', () => {
  it('keeps examples out of live records without removing manual or imported data', () => {
    const sample = { id: 'demo', sourceId: 'sample' };
    const manual = { id: 'manual', sourceId: null };
    const imported = { id: 'real', sourceId: 'schedule.jpg' };
    const records = Object.freeze([sample, manual, imported]);
    expect(realRecords([...records])).toEqual([manual, imported]);
    expect(records).toHaveLength(3);
  });
});
