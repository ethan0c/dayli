import { addDays, weekOf } from '@dayli/core';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function calendarMonthLabel(date: string): string {
  const [year, month] = date.split('-').map(Number);
  return `${MONTHS[month! - 1]} ${year}`;
}

/** Browse whole months without carrying a 29th–31st into the following month. */
export function moveCalendarMonth(date: string, offset: number): string {
  const [year, month] = date.split('-').map(Number);
  const index = year! * 12 + month! - 1 + offset;
  return `${Math.floor(index / 12)}-${String(((index % 12) + 12) % 12 + 1).padStart(2, '0')}-01`;
}

/** Six Monday-first weeks, including adjacent-month days, without timezone conversion. */
export function calendarDays(month: string): string[] {
  const first = weekOf(`${month.slice(0, 7)}-01`)[0]!;
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}
