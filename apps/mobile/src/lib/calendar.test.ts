import { describe, expect, it } from 'vitest';
import { calendarDays, calendarMonthLabel, moveCalendarMonth } from './calendar';

describe('Plan month calendar', () => {
  it('browses across year boundaries', () => {
    expect(moveCalendarMonth('2026-12-31', 1)).toBe('2027-01-01');
    expect(moveCalendarMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(calendarMonthLabel('2027-01-01')).toBe('January 2027');
  });

  it('does not skip February when browsing from a month-end selection', () => {
    expect(moveCalendarMonth('2026-01-31', 1)).toBe('2026-02-01');
    expect(moveCalendarMonth('2028-03-31', -1)).toBe('2028-02-01');
  });

  it('includes leap day and all the adjacent dates needed for full weeks', () => {
    const dates = calendarDays('2028-02-29');
    expect(dates[0]).toBe('2028-01-31');
    expect(dates.at(-1)).toBe('2028-03-12');
    expect(dates.filter((date) => date.startsWith('2028-02'))).toHaveLength(29);
    expect(new Set(dates).size).toBe(42);
  });

  it('covers all six weeks of a month that begins on Saturday', () => {
    const dates = calendarDays('2026-08-01');
    expect(dates[0]).toBe('2026-07-27');
    expect(dates.at(-1)).toBe('2026-09-06');
    expect(dates.filter((date) => date.startsWith('2026-08'))).toHaveLength(31);
  });
});
