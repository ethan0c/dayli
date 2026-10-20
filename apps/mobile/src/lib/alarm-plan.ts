import { isLocalDate, isLocalTime } from '@dayli/core';
import type { Item } from '@dayli/schema';

export type RingingAlarm = { id: string; title: string; fireAt: number };

/** Include elapsed items so an already ringing alarm survives a foreground refresh. */
export function planRingingAlarms(items: Item[]): RingingAlarm[] {
  return items.filter((item) => item.urgent && !item.done && item.sourceId !== 'sample'
    && isLocalDate(item.date) && isLocalTime(item.start)).map((item) => {
      const [year, month, day] = item.date.split('-').map(Number);
      const [hour, minute] = item.start!.split(':').map(Number);
      return { id: item.id, title: item.title, fireAt: new Date(year!, month! - 1, day!, hour!, minute!).getTime() / 1000 };
    });
}
