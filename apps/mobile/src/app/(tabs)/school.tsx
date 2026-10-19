import { diffDays, monthDay, relativeDay } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { AccountButton, CaptureCard, ImportRow, SectionHeading } from '@/components/PlannerChrome';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { courseTint, useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, radius, useTheme } from '@/theme';

export default function SchoolScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const courses = useStore((s) => s.courses);
  const items = useItemList();
  const toggleDone = useStore((s) => s.toggleDone);
  const [open, setOpen] = useState<string | null>(null);

  const byCourse = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) if (it.courseId) m.set(it.courseId, [...(m.get(it.courseId) ?? []), it]);
    return m;
  }, [items]);
  const deadlines = items.filter((i) => i.courseId && i.isDeadline && !i.done && i.date >= now.date && diffDays(now.date, i.date) < 7);

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }}>
      <View style={[styles.head, { backgroundColor: c.header, paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <T token="subhead" color={c.inkSecondary}>Your semester</T>
          <AccountButton />
        </View>
        <T token="display">School</T>
        <T token="callout" color={c.inkSecondary}>
          Classes, coursework, and what comes next.
        </T>
        {courses.length > 0 ? (
          <View style={[styles.summary, { borderColor: c.line }]}>
            <Icon name="school" size={18} color={c.accentInk} />
            <T token="subhead">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</T>
            <View style={[styles.summaryDot, { backgroundColor: c.inkTertiary }]} />
            <T token="subhead" color={c.inkSecondary}>{deadlines.length} due in the next 7 days</T>
          </View>
        ) : null}
      </View>
      <View style={styles.list}>
        <SectionHeading title="Your courses" detail={courses.length === 0 ? 'Less setup. More of your semester in view.' : 'Tap a course to see what’s ahead.'} action={courses.length > 0 ? { label: 'Add syllabus', onPress: () => router.push('/capture') } : undefined} />
        {courses.map((course) => {
          const all = byCourse.get(course.id) ?? [];
          const upcoming = all.filter((i) => !i.done && i.date >= now.date);
          const next = upcoming.find((i) => i.isDeadline);
          const isOpen = open === course.id;
          const tint = c.tint[courseTint(courses, course.id) ?? 'lavender'];
          return (
            <View key={course.id} style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
              <View style={[styles.courseAccent, { backgroundColor: tint.fill }]} />
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={`${course.title}, ${upcoming.length} upcoming items`} onPress={() => { feedback('tap'); setOpen(isOpen ? null : course.id); }} style={styles.cardHead}>
                <View style={[styles.courseIcon, { backgroundColor: tint.fill }]}><Icon name="book" size={22} color={tint.ink} /></View>
                <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                  {course.code ? (
                    <T token="caption" color={c.inkSecondary}>
                      {course.code}
                    </T>
                  ) : null}
                  <T token="headline">
                    {course.title}
                  </T>
                  {course.instructor ? <T token="caption" color={c.inkSecondary}>{course.instructor}</T> : null}
                </View>
                <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}><Icon name="chevronRight" size={16} color={c.inkTertiary} /></View>
              </Pressable>
              <View style={[styles.nextDeadline, { borderColor: c.line }]}>
                <Icon name={next ? 'calendar' : 'check'} size={16} color={next && diffDays(now.date, next.date) <= 1 ? c.conflict : c.inkSecondary} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T token="caption" color={c.inkSecondary}>{next ? `Next due · ${monthDay(next.date)} · ${relativeDay(now.date, next.date)}` : 'No upcoming deadlines'}</T>
                  {next ? <T token="subhead" numberOfLines={2}>{next.title}</T> : null}
                </View>
              </View>
              {isOpen ? (
                <View style={styles.cardBody}>
                  {upcoming.length === 0 ? (
                    <T token="callout" color={c.inkSecondary}>
                      No upcoming events or to-dos for this course.
                    </T>
                  ) : (
                    upcoming.slice(0, 12).map((it) => (
                      <View key={it.id} style={{ gap: 2 }}>
                        <T token="caption" color={c.inkSecondary} style={{ paddingLeft: 4 }}>
                          {monthDay(it.date)}
                        </T>
                        <ItemRow item={it} onPress={() => router.push(`/item/${it.id}`)} onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); toggleDone(it.id); }} />
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
        {courses.length === 0 ? (
          <CaptureCard school />
        ) : null}
        <View style={{ marginTop: 8 }}>
          <SectionHeading title={courses.length === 0 ? 'Start with what you have' : 'Keep your semester up to date'} />
          <ImportRow icon="file" title="A syllabus or course PDF" detail="Find classes, assignments, and exam dates." />
          <ImportRow icon="image" title="A screenshot from class" detail="Turn an announcement into your next to-do." />
          <ImportRow icon="pen" title="Something your professor said" detail="A quick message is all you need." />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 24, gap: 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 16, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  summaryDot: { width: 3, height: 3, borderRadius: 2 },
  list: { padding: 24, paddingHorizontal: SCREEN_GUTTER, gap: 14 },
  card: { borderRadius: radius.card, overflow: 'hidden', borderWidth: 1 },
  courseAccent: { height: 5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  courseIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextDeadline: { marginHorizontal: 18, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
});
