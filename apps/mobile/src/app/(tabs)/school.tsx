import { WEEKDAYS, addDays, diffDays, formatTime, monthDay, weekdayOf, weekdayShort } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryDot, GroupLabel, ListRow, SectionTitle, StatusPill, itemStatus } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { TermLine, type TermMark } from '@/components/TermLine';
import { useNow } from '@/lib/now';
import { useCourseList, useItemList, type StoredCourse } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, useTheme } from '@/theme';

/** Four weeks from today, the span of the deadline map. */
const MAP_DAYS = 28;
const EXAM = /exam|quiz|midterm|final|test\b/i;

/** "Fall 2026", "Spring 2027", "Summer 2027" for a local date. */
function termLabel(date: string): string {
  const [y, m] = date.split('-').map(Number);
  const season = m! >= 8 ? 'Fall' : m! <= 5 ? 'Spring' : 'Summer';
  return `${season} ${y}`;
}

/** "Mon, Wed 9 am" from a course's repeating events, or null when it has none. */
function meetingPattern(events: Item[]): string | null {
  const series = new Map<string, Item[]>();
  for (const it of events) if (it.seriesId) series.set(it.seriesId, [...(series.get(it.seriesId) ?? []), it]);
  const main = [...series.values()].sort((a, b) => b.length - a.length)[0];
  if (!main) return null;
  const days = WEEKDAYS.filter((d) => main.some((it) => weekdayOf(it.date) === d)).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  const start = main.find((it) => it.start)?.start;
  return [days.join(', '), start ? formatTime(start, true) : null].filter(Boolean).join(' ');
}

/** The four week labels over the map: the month shows only when it changes. */
function weekLabels(today: string): string[] {
  let month = '';
  return [0, 7, 14, 21].map((n) => {
    const [m, d] = monthDay(addDays(today, n)).split(' ');
    const label = m === month ? d! : `${m} ${d}`;
    month = m!;
    return label;
  });
}

export default function SchoolScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const courses = useCourseList();
  const items = useItemList();

  const byCourse = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) if (it.courseId) m.set(it.courseId, [...(m.get(it.courseId) ?? []), it]);
    return m;
  }, [items]);
  const courseIds = useMemo(() => new Set(courses.map((k) => k.id)), [courses]);
  // Undone deadlines from today on, soonest first (items are already sorted by date and time).
  const deadlines = useMemo(() => items.filter((i) => i.courseId && courseIds.has(i.courseId) && i.isDeadline && !i.done && i.date >= now.date), [items, courseIds, now.date]);
  const next = deadlines[0];
  const inMap = deadlines.filter((i) => diffDays(now.date, i.date) < MAP_DAYS);
  const mapEnd = addDays(now.date, MAP_DAYS - 1);
  const labels = weekLabels(now.date);

  const capture = (source: 'file' | 'image') => router.navigate({ pathname: '/add', params: { source, at: String(Date.now()) } });
  const tintOf = (course: StoredCourse) => c.tint[course.color ?? 'lavender'].ink;

  const days = next ? diffDays(now.date, next.date) : 0;
  const big = !next ? 'Clear' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
  const when = next ? [days < 7 ? weekdayShort(next.date) : monthDay(next.date), next.start ? formatTime(next.start, true) : null].filter(Boolean).join(' ') : '';
  const nextCourse = next ? courses.find((k) => k.id === next.courseId) : undefined;
  const eyebrow = `${termLabel(now.date)} · ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}${next ? ' · next due in' : ''}`;

  const keepUpToDate = (
    <View style={styles.section}>
      <GroupLabel>Keep it up to date</GroupLabel>
      <ListRow leading={<Icon name="file" size={20} color={c.inkPrimary} />} title="A syllabus" sub="Adds the course, its exams and due dates" onPress={() => capture('file')} />
      <ListRow leading={<Icon name="image" size={20} color={c.inkPrimary} />} title="A screenshot from class" sub="An announcement becomes your next to-do" onPress={() => capture('image')} last />
    </View>
  );

  if (courses.length === 0) {
    return (
      <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never">
        <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
          <T token="callout" color={c.inkSecondary}>Your semester</T>
          <T token="display">Nothing from school yet.</T>
          <T token="callout" color={c.inkSecondary} style={{ paddingTop: 6 }}>Add a syllabus and the whole term lands here.</T>
        </View>
        {keepUpToDate}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never">
      <Pressable accessibilityRole={next ? 'button' : undefined} disabled={!next} onPress={() => next && router.push(`/item/${next.id}`)}
        accessibilityLabel={next ? `Next due ${big.toLowerCase()}, ${next.title}, ${when}` : undefined}
        style={({ pressed }) => [styles.top, { paddingTop: insets.top + 24, opacity: pressed ? 0.7 : 1 }]}>
        <T token="callout" color={c.inkSecondary}>{eyebrow}</T>
        <T token="displayXl" tabular>{big}</T>
        {next ? (
          <View style={{ gap: 2, paddingTop: 6 }}>
            <T token="body" style={{ fontSize: 18, lineHeight: 26 }}>{`${next.title} · ${when}`}</T>
            {nextCourse ? <T token="callout" color={c.inkSecondary}>{nextCourse.code ?? nextCourse.title}</T> : null}
          </View>
        ) : (
          <T token="callout" color={c.inkSecondary} style={{ paddingTop: 6 }}>Nothing due in the next four weeks.</T>
        )}
      </Pressable>

      <View style={styles.section}>
        <SectionTitle title="Next four weeks" detail={`${inMap.length} due`} />
        <View style={styles.map} accessible accessibilityRole="image" accessibilityLabel={`Deadline map, one strip per course over the next four weeks. ${courses.map((k) => {
          const due = inMap.filter((i) => i.courseId === k.id);
          return `${k.code ?? k.title}: ${due.length ? due.map((i) => `${i.title} ${monthDay(i.date)}`).join(', ') : 'nothing due'}.`;
        }).join(' ')}`}>
          <View style={styles.mapRow}>
            <View style={{ width: 56 }} />
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {labels.map((l, i) => <T key={i} token="caption" color={c.inkSecondary} tabular style={styles.weekLabel}>{l}</T>)}
            </View>
          </View>
          {courses.map((course) => {
            const marks: TermMark[] = inMap.filter((i) => i.courseId === course.id).map((i) => ({
              id: i.id, date: i.date, kind: EXAM.test(i.title) ? 'ring' : 'dot', tone: i.date === now.date ? 'red' : 'ink',
            }));
            return (
              <View key={course.id} style={[styles.mapRow, { height: 28 }]}>
                <View style={styles.mapLabel}>
                  <CategoryDot color={tintOf(course)} />
                  <T token="subhead" numberOfLines={1} style={{ fontSize: 12, lineHeight: 16, flexShrink: 1 }}>{course.code ?? course.title}</T>
                </View>
                <View style={styles.track}>
                  <TermLine from={now.date} to={mapEnd} marks={marks} today={now.date} scale="none" labels={false} />
                </View>
              </View>
            );
          })}
          <T token="caption" color={c.inkSecondary} style={{ paddingLeft: 66 }}>Dots are due dates, rings are exams, red is due today.</T>
        </View>
      </View>

      <View style={[styles.section, { paddingTop: 24 }]}>
        <SectionTitle title="Your courses" />
        {courses.map((course, i) => {
          const all = byCourse.get(course.id) ?? [];
          const nextDue = all.find((it) => it.isDeadline && !it.done && it.date >= now.date);
          const pattern = meetingPattern(all.filter((it) => it.kind === 'event' && it.seriesId));
          const status = nextDue ? itemStatus(nextDue, now.date, false, true) : { label: 'Nothing due', tone: 'grey' as const };
          const sub = [course.title, pattern ?? course.instructor].filter(Boolean).join(' · ');
          return (
            <ListRow key={course.id} title={course.code ?? course.title} sub={sub} last={i === courses.length - 1}
              leading={<View style={styles.dotWell}><CategoryDot color={tintOf(course)} /></View>}
              trailing={<StatusPill label={status.label} tone={status.tone} />}
              chevron
              accessibilityLabel={`${course.code ?? course.title}, ${course.title}, ${nextDue ? `${nextDue.title} ${status.label}` : 'nothing due'}`}
              onPress={nextDue ? () => router.push(`/item/${nextDue.id}`) : undefined} />
          );
        })}
      </View>

      {keepUpToDate}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: SCREEN_GUTTER, gap: 2 },
  section: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 26 },
  map: { paddingTop: 10, gap: 10 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapLabel: { width: 56, flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekLabel: { flex: 1, fontSize: 11, lineHeight: 14 },
  track: { flex: 1, justifyContent: 'center' },
  dotWell: { width: 22, alignItems: 'center' },
});
