import { monthDay, relativeDay } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { T } from '@/components/Text';
import { Button } from '@/components/Sheet';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { courseTint, useItemList, useStore } from '@/store';
import { NAV_INSET, radius, useTheme } from '@/theme';

export default function SchoolScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const courses = useStore((s) => s.courses);
  const items = useItemList();
  const [open, setOpen] = useState<string | null>(null);

  const byCourse = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) if (it.courseId) m.set(it.courseId, [...(m.get(it.courseId) ?? []), it]);
    return m;
  }, [items]);

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }}>
      <View style={[styles.head, { backgroundColor: c.header, paddingTop: insets.top + 8 }]}>
        <T token="display">School</T>
        <T token="callout" color={c.inkSecondary}>
          {courses.length === 0 ? 'No courses yet' : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`}
        </T>
      </View>
      <View style={styles.list}>
        {courses.map((course) => {
          const all = byCourse.get(course.id) ?? [];
          const upcoming = all.filter((i) => !i.done && i.date >= now.date);
          const next = upcoming.find((i) => i.isDeadline);
          const isOpen = open === course.id;
          const tint = c.tint[courseTint(courses, course.id) ?? 'lavender'];
          return (
            <View key={course.id} style={[styles.card, { backgroundColor: tint.fill }]}>
              <Pressable onPress={() => { feedback('tap'); setOpen(isOpen ? null : course.id); }} style={styles.cardHead}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {course.code ? (
                    <T token="overline" color={tint.ink}>
                      {course.code}
                    </T>
                  ) : null}
                  <T token="headline" color={tint.ink}>
                    {course.title}
                  </T>
                  <T token="subhead" color={tint.ink}>
                    {next ? `Next: ${next.title} · ${monthDay(next.date)} (${relativeDay(now.date, next.date)})` : `${upcoming.length} upcoming`}
                  </T>
                </View>
                <Icon name={isOpen ? 'chevronLeft' : 'chevronRight'} size={16} color={tint.ink} />
              </Pressable>
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
                        <ItemRow item={it} onPress={() => router.push(`/item/${it.id}`)} />
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
        {courses.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
            <Icon name="file" size={22} color={c.accentInk} />
            <T token="headline" style={{ textAlign: 'center' }}>
              Drop in a syllabus
            </T>
            <T token="callout" color={c.inkSecondary} style={{ textAlign: 'center' }}>
              Nowli finds your course, exams, and due dates. Review the details before adding them to your plan.
            </T>
            <Button label="Add a syllabus" onPress={() => router.push('/capture')} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, paddingBottom: 16, gap: 4 },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: radius.card, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardBody: { paddingHorizontal: 10, paddingBottom: 12, gap: 8 },
  empty: { borderRadius: radius.card, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
});
