import { describe, expect, it } from 'vitest';
import { skySlot } from './sky';

describe("Today's sky", () => {
  it('follows the hour at each edge', () => {
    expect(skySlot('04:59', false)).toBe('night');
    expect(skySlot('05:00', false)).toBe('dawn');
    expect(skySlot('08:00', false)).toBe('morning');
    expect(skySlot('11:59', false)).toBe('morning');
    expect(skySlot('12:00', false)).toBe('afternoon');
    expect(skySlot('17:00', false)).toBe('golden');
    expect(skySlot('20:00', false)).toBe('night');
    expect(skySlot('23:30', false)).toBe('night');
  });
  it('is always night in dark mode', () => {
    expect(skySlot('09:00', true)).toBe('night');
  });
});
