import { diffDays, monthDay, relativeDay } from '@dayli/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { ImportRow, SectionHeading } from '@/components/PlannerChrome';
import { StarterPreview } from '@/components/StarterPreview';
import { ScreenHeader } from '@/components/ScreenHeader';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { enter, exit, layout, springs } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { useCourseList, courseTint, useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, radius, useCardSurface, useTheme } from '@/theme';

export default function SchoolScreen() {
  const { c } = useTheme();
  const surface = useCardSurface();
  const now = useNow();
  const courses = useCourseList();
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
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never">
      <ScreenHeader title="School." eyebrow="Your semester" subtitle={courses.length ? `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} · ${deadlines.length} due in the next 7 days` : 'Your courses and deadlines, together.'} safeTop />
      <View style={styles.list}>
        {courses.length > 0 ? <SectionHeading title="Your courses" action={{ label: 'Add syllabus', onPress: () => router.push({ pathname: '/capture', params: { source: 'file' } }) }} /> : null}
        {courses.map((course) => {
          const all = byCourse.get(course.id) ?? [];
          const upcoming = all.filter((i) => !i.done && i.date >= now.date);
          const next = upcoming.find((i) => i.isDeadline);
          const isOpen = open === course.id;
          const tint = c.tint[courseTint(courses, course.id) ?? 'lavender'];
          return (
            <Animated.View key={course.id} layout={layout} style={[styles.card, surface]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={`${course.title}, ${upcoming.length} upcoming items`} onPress={() => { feedback('tap'); setOpen(isOpen ? null : course.id); }} style={styles.cardHead}>
                <View style={[styles.courseMarker, { backgroundColor: tint.ink }]} />
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
                <Chevron open={isOpen} color={c.inkTertiary} />
              </Pressable>
              <View style={[styles.nextDeadline, { borderColor: c.line }]}>
                <Icon name={next ? 'calendar' : 'check'} size={16} color={next && diffDays(now.date, next.date) <= 1 ? c.conflict : c.inkSecondary} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T token="caption" color={c.inkSecondary}>{next ? `Next due · ${monthDay(next.date)} · ${relativeDay(now.date, next.date)}` : 'No upcoming deadlines'}</T>
                  {next ? <T token="subhead" numberOfLines={2}>{next.title}</T> : null}
                </View>
              </View>
              {isOpen ? (
                <Animated.View entering={enter.drop} exiting={exit.fade} style={styles.cardBody}>
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
                        <ItemRow item={it} today={now.date} onPress={() => router.push(`/item/${it.id}`)} onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); toggleDone(it.id); }} />
                      </View>
                    ))
                  )}
                </Animated.View>
              ) : null}
            </Animated.View>
          );
        })}
        {courses.length === 0 ? (
          <StarterPreview school />
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

/** Turns to point down when the course is open. */
function Chevron({ open, color }: { open: boolean; color: string }) {
  const r = useSharedValue(open ? 90 : 0);
  useEffect(() => {
    r.value = withSpring(open ? 90 : 0, springs.snappy);
  }, [open, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View style={style}><Icon name="chevronRight" size={16} color={color} /></Animated.View>;
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 8, gap: 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 16, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  summaryDot: { width: 3, height: 3, borderRadius: 2 },
  list: { padding: 24, paddingHorizontal: SCREEN_GUTTER, gap: 14 },
  card: { borderRadius: radius.card },
  courseMarker: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  courseAccent: { height: 5 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18 },
  courseIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextDeadline: { marginHorizontal: 18, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
});
