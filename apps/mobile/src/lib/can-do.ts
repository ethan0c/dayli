import { movableOverlap } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo } from 'react';

import { accountOf, useSession } from '@/lib/supabase';
import { useNow } from '@/lib/now';
import { useItemList, useScheduleList, useStore } from '@/store';

export type CanDo = {
  id: string;
  title: string;
  /** What it does, in a line; shown until it is tried. */
  sub: string;
  done: boolean;
  plus?: boolean;
  go: () => void;
};

/**
 * The things people miss after setup, each tappable and ticked once their own plan shows it
 * happened. Ordered from the everyday to the edge cases. Nothing here is a tutorial: every row
 * opens the real screen.
 */
export function useCanDo(): CanDo[] {
  const items = useItemList();
  const schedules = useScheduleList();
  const batches = useStore((s) => s.batches);
  const settings = useStore((s) => s.settings);
  const now = useNow();
  const signedIn = useSession((s) => !!accountOf(s.session));
  return useMemo(() => {
    const sources = new Set(batches.map((b) => b.source?.toLowerCase() ?? ''));
    const overlap = movableOverlap(items, now);
    const nextDeadline = items.filter((i) => i.isDeadline && !i.done && i.date >= now.date).sort((a, b) => a.date.localeCompare(b.date))[0];
    const add = (source?: 'image' | 'file') => router.navigate(source ? { pathname: '/add', params: { source, at: String(Date.now()) } } : '/add');
    const list: CanDo[] = [
      { id: 'text', title: 'Just tell it', sub: 'Type what’s coming up the way you’d text a friend. Semli puts it on the calendar.', done: sources.has('message'), go: () => add() },
      { id: 'screenshot', title: 'Add a work schedule from a screenshot', sub: 'Shifts, hours and overlaps, read from the picture.', done: schedules.length > 0 || sources.has('screenshot') || sources.has('photo'), go: () => add('image') },
      { id: 'syllabus', title: 'Drop in a syllabus', sub: 'Every exam and due date, filed under the course.', done: [...sources].some((s) => s.endsWith('.pdf')), go: () => add('file') },
      { id: 'reimport', title: 'Update a schedule with next week’s', sub: 'Semli compares it with the week you have: changes marked, the rest kept.', done: settings.firsts.reimport, plus: true, go: () => add('image') },
      { id: 'canvas', title: 'Connect Canvas', sub: 'Due dates come in on their own and move when a professor changes them.', done: !!settings.canvas.feedUrl, go: () => router.push('/settings/canvas') },
      { id: 'overlap', title: 'Let Semli fix an overlap', sub: 'When two plans clash, it keeps the one that can’t move and finds a time for the other.', done: settings.firsts.overlap, plus: true, go: () => router.push(overlap ? `/item/${overlap.flexible.id}` : '/plan') },
      { id: 'urgent', title: 'Ring for what can’t be missed', sub: 'An urgent item sounds like an alarm, even on silent.', done: items.some((i) => i.urgent), plus: true, go: () => router.push(nextDeadline ? `/item/${nextDeadline.id}` : '/plan') },
      { id: 'hours', title: 'See the day by the hour', sub: 'Today as a timeline: gaps, overlaps, and how long until the next thing.', done: settings.todayView === 'hours' || settings.firsts.hours, go: () => { useStore.getState().setSettings({ todayView: 'hours' }); router.navigate('/'); } },
      { id: 'briefing', title: 'Get a morning briefing', sub: 'A short note each morning with what matters today.', done: settings.reminders.enabled && settings.reminders.briefing, go: () => router.push('/settings/reminders') },
      { id: 'undo', title: 'Undo any import', sub: 'Every import is one change you can take back, in Your data.', done: batches.some((b) => b.undone), go: () => router.push('/settings/data') },
      { id: 'calendar', title: 'Send it all to your calendar', sub: 'Every event into Apple or Google Calendar, once.', done: false, go: () => router.push('/settings/data') },
    ];
    if (!signedIn) list.push({ id: 'account', title: 'Keep this on every device', sub: 'A free account backs up your plan and brings it to a new phone.', done: false, go: () => router.push('/auth') });
    return list;
  }, [items, schedules, batches, settings, now, signedIn]);
}
