import { formatRange, formatTime, monthDay, weekdayLong } from '@dayli/core';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { NativeButton } from '@/components/Native';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { radius, textStyle, useTheme } from '@/theme';

export default function ItemScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => (id ? s.items[id] : undefined));
  const courses = useStore((s) => s.courses);
  const toggleDone = useStore((s) => s.toggleDone);
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const [title, setTitle] = useState(item?.title ?? '');

  if (!item) {
    return (
      <Sheet title="Not found">
        <T token="callout" color={c.inkSecondary} style={{ padding: 20 }}>
          This item is gone.
        </T>
      </Sheet>
    );
  }

  const course = item.courseId ? courses.find((k) => k.id === item.courseId) : null;
  const cat = c.category[item.category];
  const when = `${weekdayLong(item.date)}, ${monthDay(item.date)}${
    item.start ? ` · ${item.end ? formatRange(item.start, item.end) : formatTime(item.start)}` : ''
  }`;
  const source = item.sourceId === SAMPLE_SOURCE ? 'Sample data' : item.sourceId;

  return (
    <Sheet
      title={item.kind === 'task' ? 'To-do' : 'Event'}
      footer={
        <>
          {item.kind === 'task' ? (
            <Button
              label={item.done ? 'Mark not done' : 'Mark done'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleDone(item.id);
              }}
            />
          ) : null}
          <NativeButton
            label="Delete"
            role="destructive"
            systemImage="trash"
            icon="trash"
            onPress={() => {
              removeItem(item.id);
              router.back();
            }}
          />
        </>
      }>
      <View style={styles.body}>
        <View style={[styles.hero, { backgroundColor: item.kind === 'event' ? cat.fill : c.row }]}>
          <Icon name={item.icon} size={24} color={item.kind === 'event' ? cat.ink : c.inkPrimary} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            onBlur={() => title.trim() && title !== item.title && updateItem(item.id, { title: title.trim() })}
            style={[textStyle('title', item.kind === 'event' ? cat.ink : c.inkPrimary), { flex: 1, minWidth: 0, padding: 0 }]}
          />
        </View>
        <Row icon="calendar" label={when} />
        <Row icon={item.category === 'work' ? 'work' : item.category === 'school' ? 'school' : 'heart'} label={item.employer ?? course?.title ?? item.category} />
        {item.isDeadline ? <Row icon="exam" label="Deadline" /> : null}
        {source ? <Row icon="file" label={`From: ${source}`} /> : null}
        {item.done && item.completedAt ? <Row icon="tick" label={`Done ${new Date(item.completedAt).toLocaleDateString()}`} /> : null}
        <Pressable onPress={() => router.back()} style={styles.link}>
          <T token="subhead" color={c.inkSecondary}>
            Changes to the title save when you tap away.
          </T>
        </Pressable>
      </View>
    </Sheet>
  );
}

function Row({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={c.inkSecondary} />
      <T color={c.inkPrimary} style={{ flex: 1 }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  link: { paddingHorizontal: 4, paddingTop: 8 },
});
