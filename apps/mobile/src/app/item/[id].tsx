import { diffDays, formatTime, localParts, monthDay, relativeDay, toMinutes, weekdayLong } from '@dayli/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GroupLabel, ListRow, StatusPill, TextButton, itemStatus } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

function gap(now: { date: string; time: string }, date: string, time: string | null): string | null {
  if (!time) return null;
  const mins = toMinutes(time) - toMinutes(now.time) + diffDays(now.date, date) * 1440;
  if (mins < 0) return null;
  if (mins < 60) return `in ${mins}m`;
  if (mins < 1440) return `in ${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
  return null;
}

export default function ItemScreen() {
  const { c } = useTheme();
  const now = useNow();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => (id ? s.items[id] : undefined));
  const courses = useStore((s) => s.courses);
  const items = useItemList();
  const reminders = useStore((s) => s.settings.reminders);
  const toggleDone = useStore((s) => s.toggleDone);
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const [title, setTitle] = useState(item?.title ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) {
    return (
      <Sheet title="Item unavailable" nav="push">
        <T token="callout" color={c.inkSecondary} style={{ padding: 20, paddingHorizontal: SCREEN_GUTTER }}>
          We couldn’t find this item. It may have been deleted. Go back to return to your plan.
        </T>
      </Sheet>
    );
  }

  const isEvent = item.kind === 'event';
  const course = item.courseId ? courses.find((k) => k.id === item.courseId) : null;
  const where = [item.employer ?? course?.title, item.category === 'school' ? 'Coursework' : item.category === 'work' ? 'Work' : 'Personal'].filter(Boolean).join(' · ');
  const source = item.sourceId === SAMPLE_SOURCE ? 'Sample data' : item.sourceId;
  const status = itemStatus(item, now.date);
  const until = gap(now, item.date, item.start);
  const eyebrow = [relativeDay(now.date, item.date), until].filter(Boolean).join(' · ');
  const sameWeek = items.filter((it) => it.id !== item.id && !it.done && it.date >= now.date && diffDays(now.date, it.date) <= 7
    && ((item.employer && it.employer === item.employer) || (item.courseId && it.courseId === item.courseId))).slice(0, 4);
  const endsNextDay = item.start && item.end && item.end < item.start;
  const [sh, sm] = (item.start ?? '00:00').split(':');
  const period = (t: string) => (Number(t.split(':')[0]) >= 12 ? 'pm' : 'am');
  const clock = (t: string) => { const [h, m] = t.split(':').map(Number); return `${h! % 12 === 0 ? 12 : h! % 12}:${String(m).padStart(2, '0')}`; };

  return (
    <Sheet
      title={isEvent ? 'Event' : 'To-do'}
      nav="push"
      footer={
        <>
          {!isEvent ? <Button label={item.done ? 'Mark as not done' : 'Mark as done'} onPress={() => { feedback(item.done ? 'uncomplete' : 'complete'); toggleDone(item.id); }} /> : null}
          {confirmDelete ? (
            <View style={styles.confirm}>
              <TextButton label={`Delete this ${isEvent ? 'event' : 'to-do'} for good`} tone="danger" haptic="remove" onPress={() => { removeItem(item.id); router.back(); }} />
              <TextButton label="Keep it" tone="muted" onPress={() => setConfirmDelete(false)} />
            </View>
          ) : (
            <TextButton label={`Delete this ${isEvent ? 'event' : 'to-do'}`} tone="danger" haptic="tap" onPress={() => setConfirmDelete(true)} />
          )}
        </>
      }>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 2 }}>
          <View style={styles.eyebrowRow}>
            <T token="callout" color={c.inkSecondary}>{eyebrow}</T>
            <StatusPill label={status.label} tone={status.tone} />
          </View>
          <TextInput
            accessibilityLabel="Title"
            value={title}
            onChangeText={setTitle}
            onBlur={() => title.trim() && title !== item.title && updateItem(item.id, { title: title.trim() })}
            multiline
            style={[textStyle('display', c.inkPrimary), { fontSize: 30, lineHeight: 36, padding: 0, minWidth: 0 }]}
          />
          {item.start ? (
            <T token="displayXl" tabular style={{ fontSize: 44, lineHeight: 48, paddingTop: 4 }}>
              {clock(item.start)}{item.end ? <T token="displayXl" color={c.inkSecondary} style={{ fontSize: 44, lineHeight: 48 }}> – </T> : null}{item.end ? clock(item.end) : ''}
              <T token="title" color={c.inkSecondary} style={{ fontSize: 20 }}> {period(item.end ?? item.start)}{endsNextDay ? ', next day' : ''}</T>
            </T>
          ) : null}
          {!item.start && sh && sm ? null : null}
        </View>

        <View>
          <ListRow leading={<Icon name="calendar" size={18} color={c.inkSecondary} />} title={`${weekdayLong(item.date)}, ${monthDay(item.date)}`} sub={item.isDeadline ? 'Deadline' : null} chevron={false} />
          <ListRow leading={<Icon name={item.category === 'work' ? 'work' : item.category === 'school' ? 'school' : 'heart'} size={18} color={c.inkSecondary} />} title={where} chevron={false} />
          {source ? <ListRow leading={<Icon name={item.sourceId === SAMPLE_SOURCE ? 'sparkle' : 'file'} size={18} color={c.inkSecondary} />} title={`From ${source}`} chevron={false} /> : null}
          <ListRow leading={<Icon name="bell" size={18} color={c.inkSecondary} />} title={reminders.enabled ? (isEvent && item.start ? `Reminder ${reminders.eventLead} min before` : item.isDeadline ? 'Reminder the evening before and the morning of' : 'In the morning briefing') : 'Reminders are off'} sub={reminders.enabled ? null : 'Turn them on in You'} chevron={!reminders.enabled} onPress={reminders.enabled ? undefined : () => router.push('/settings/reminders')} last />
        </View>

        {item.notes ? (
          <View style={{ gap: 6 }}>
            <GroupLabel>Notes</GroupLabel>
            <T token="body" color={c.inkSecondary}>{item.notes}</T>
          </View>
        ) : null}

        {item.done && item.completedAt ? <T token="caption" color={c.inkSecondary}>Done {new Date(item.completedAt).toLocaleDateString()}</T> : null}

        {sameWeek.length ? (
          <View>
            <GroupLabel>Same week</GroupLabel>
            {sameWeek.map((it, i) => <ItemRow key={it.id} item={it} today={now.date} last={i === sameWeek.length - 1} onPress={() => router.push(`/item/${it.id}`)} />)}
          </View>
        ) : null}

        <T token="caption" color={c.inkSecondary}>Edits to the title save when you tap outside it. {localParts(new Date()).date === item.date && item.start ? formatTime(item.start) === item.start ? '' : '' : ''}</T>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 4, paddingBottom: 24, gap: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  confirm: { alignItems: 'center', gap: 0 },
});
