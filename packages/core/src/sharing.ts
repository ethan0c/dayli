import type { Category, Item } from '@dayli/schema';
import { dayNumber, isLocalDate, weekOf } from './dates';
import { intervalOf } from './intervals';

export type ShareOptions = { date: string; range: 'day' | 'week'; categories: Category[]; showTitles: boolean };
export type SharedEntry = Pick<Item, 'date' | 'start' | 'end' | 'kind' | 'category' | 'isDeadline' | 'title'>;

/** Project only the fields a reader needs. Never pass source records into a share view. */
export function schedulePreview(items: Item[], options: ShareOptions): { from: string; to: string; entries: SharedEntry[] } {
  if (!isLocalDate(options.date)) throw new Error('Choose a valid date.');
  const dates = options.range === 'day' ? [options.date] : weekOf(options.date);
  const from = dates[0]!;
  const to = dates.at(-1)!;
  const start = dayNumber(from) * 1440;
  const end = (dayNumber(to) + 1) * 1440;
  const entries = items.filter((item) => {
    if (item.done || !options.categories.includes(item.category)) return false;
    const iv = item.kind === 'event' ? intervalOf(item) : null;
    return iv ? iv.start < end && iv.end > start : item.date >= from && item.date <= to;
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '') || a.title.localeCompare(b.title))
    .map((item) => ({
      date: item.date, start: item.start, end: item.end, kind: item.kind, category: item.category,
      isDeadline: item.isDeadline, title: options.showTitles ? item.title : item.kind === 'event' ? 'Busy' : 'To-do',
    }));
  return { from, to, entries };
}
