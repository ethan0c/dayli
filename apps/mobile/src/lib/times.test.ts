import { describe, expect, it } from 'vitest';
import { defaultTimes, plusMinutes } from './times';

describe('default times for an item without one', () => {
  it('starts at nine and ends an hour later, four for a shift', () => {
    expect(defaultTimes({ kind: 'event', category: 'school', start: null, end: null })).toEqual({ start: '09:00', end: '10:00' });
    expect(defaultTimes({ kind: 'event', category: 'work', start: null, end: null })).toEqual({ start: '09:00', end: '13:00' });
    expect(defaultTimes({ kind: 'task', category: 'school', start: null, end: null })).toEqual({ start: '09:00', end: null });
  });
  it('copies the last shift for the same job and keeps what is already set', () => {
    expect(defaultTimes({ kind: 'event', category: 'work', start: null, end: null }, { start: '16:00', end: '22:00' })).toEqual({ start: '16:00', end: '22:00' });
    expect(defaultTimes({ kind: 'event', category: 'work', start: '07:00', end: null }, { start: '16:00', end: '22:00' })).toEqual({ start: '07:00', end: '11:00' });
    expect(plusMinutes('23:30', 60)).toBe('00:30');
  });
});
