import { formatTime, toMinutes, weekdayShort } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryDot, StatusPill, itemStatus } from '@/components/Controls';
import { Check } from '@/components/ItemRow';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { chart } from '@dayli/tokens';
import { feedback } from '@/lib/feedback';
import { courseTint, useCourseList, useStore } from '@/store';
import { corner, radius, useTheme, space } from '@/theme';

const START = 6 * 60;
const SPAN = 18 * 60;

/**
 * Plan as a week board on a wide web window: the days as columns, split by hairlines like a
 * calendar, today's on the row grey with its date in the ink circle the week chart uses. Each
 * column is a strip of the day's booked time over plain rows, which lead with the same check or
 * course dot as every list (the check completes a to-do in place); red only on what's due. A row
 * opens in Plan's pane. Timed things first, in order, then the rest; done things last and dimmed.
 */
export function WeekBoard({ week, items, today, conflicts, openId, onOpen }: {
  week: string[]; items: Item[]; today: string; conflicts: Set<string>; openId: string | null; onOpen: (id: string) => void;
}) {
  const { c } = useTheme();
  const courses = useCourseList();
  const allCourses = useStore((s) => s.courses);
  const toggleDone = useStore((s) => s.toggleDone);
  const where = (it: Item) => courses.find((k) => k.id === it.courseId)?.code ?? it.employer ?? (it.category === 'school' ? 'Coursework' : it.category === 'work' ? 'Work' : 'Personal');
  const tintOf = (it: Item) => (it.courseId ? c.tint[courseTint(allCourses, it.courseId) ?? 'sky'].ink : c.category[it.category].ink);
  return (
    <View style={styles.board}>
      {week.map((date, d) => {
        const day = items.filter((i) => i.date === date)
          .sort((a, b) => Number(a.done) - Number(b.done) || (a.start ?? '99').localeCompare(b.start ?? '99'));
        const booked = day.filter((i) => i.kind === 'event' && i.start);
        const isToday = date === today;
        return (
          <View key={date} style={[styles.col, d > 0 ? { borderLeftColor: c.line, borderLeftWidth: StyleSheet.hairlineWidth } : null, isToday ? { backgroundColor: c.row } : null]}>
            <View style={styles.head}>
              <T token="caption" color={isToday ? c.accentInk : c.inkSecondary}>{weekdayShort(date)}</T>
              <View style={styles.dateRow}>
                <View style={[styles.num, isToday ? { backgroundColor: c.controlFill } : null]}>
                  <T token="headline" color={isToday ? c.controlInk : c.inkPrimary} tabular style={{ fontSize: 17 }}>{String(Number(date.slice(-2)))}</T>
                </View>
                <T token="caption" color={c.inkSecondary} tabular>{day.length ? `${day.length}` : ''}</T>
              </View>
            </View>
            <View style={[styles.track, { backgroundColor: isToday ? c.canvas : c.row }]}>
              {booked.map((i) => {
                const s = Math.max(START, toMinutes(i.start!));
                const e = Math.min(START + SPAN, i.end && i.end > i.start! ? toMinutes(i.end) : s + 60);
                return <View key={i.id} style={[styles.block, { left: `${((s - START) / SPAN) * 100}%`, width: `${Math.max(2, ((e - s) / SPAN) * 100)}%`, backgroundColor: i.done ? c.added : conflicts.has(i.id) ? c.conflict : c.chartBooked }]} />;
              })}
            </View>
            <View>
              {day.map((i, n) => {
                const status = itemStatus(i, today, conflicts.has(i.id));
                // Colour only where it means something: due, overdue or needing a time.
                const flagged = !i.done && (status.tone === 'red' || status.tone === 'amber');
                return (
                  <Press key={i.id} accessibilityRole="button" accessibilityLabel={`${i.title}, ${status.label}`} scale={1} onPress={() => onOpen(i.id)}
                    style={[styles.row, n < day.length - 1 ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null,
                      openId === i.id ? { backgroundColor: isToday ? c.canvas : c.row } : null]}>
                    {i.kind === 'task' ? (
                      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: i.done }} accessibilityLabel={`${i.done ? 'Mark incomplete' : 'Complete'}: ${i.title}`}
                        hitSlop={6} onPress={() => { feedback(i.done ? 'uncomplete' : 'complete'); toggleDone(i.id); }} style={styles.lead}>
                        <Check done={i.done} color={i.courseId ? tintOf(i) : undefined} />
                      </Pressable>
                    ) : (
                      <View style={[styles.lead, styles.dotLead]}><CategoryDot color={tintOf(i)} /></View>
                    )}
                    <View style={[styles.text, i.done ? { opacity: 0.5 } : null]}>
                      <T token="subhead" numberOfLines={2} style={i.done ? { textDecorationLine: 'line-through' } : undefined}>{i.title}</T>
                      <T token="caption" color={c.inkSecondary} numberOfLines={1}>{[i.start ? formatTime(i.start) : flagged ? null : status.label, where(i)].filter(Boolean).join(' · ')}</T>
                      {flagged ? <View style={styles.pill}><StatusPill label={status.label} tone={status.tone} /></View> : null}
                    </View>
                  </Press>
                );
              })}
            </View>
            {day.length ? null : <T token="caption" color={c.inkTertiary} style={{ paddingTop: space.hair }}>Nothing yet</T>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: 'row', paddingTop: space.md },
  col: { flex: 1, minWidth: 0, gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.sm, paddingBottom: space.md, borderRadius: 0 },
  head: { gap: space.hair, paddingHorizontal: space.hair },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  num: { minWidth: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: -space.xxs },
  track: { height: chart.track, borderRadius: chart.track / 2, position: 'relative', overflow: 'hidden' },
  block: { position: 'absolute', top: 0, bottom: 0, borderRadius: chart.track / 2 },
  row: { flexDirection: 'row', gap: space.xs, paddingVertical: 9, paddingHorizontal: space.snug, marginHorizontal: -space.snug, ...corner(radius.small) },
  lead: { width: 22, alignItems: 'center', paddingTop: 1 },
  // The dot centres on the title's first line (subhead, 20 tall).
  dotLead: { height: 20, paddingTop: 0, justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: space.hair },
  pill: { alignSelf: 'flex-start', paddingTop: space.xxs },
});
