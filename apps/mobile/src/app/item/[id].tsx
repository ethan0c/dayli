import { WEEKDAYS, diffDays, isLocalDate, isLocalTime, monthDay, relativeDay, toMinutes, weekOf, weekdayLong, weekdayOf, weekdayShort } from '@dayli/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GroupLabel, SectionTitle, StatusPill, TextButton, itemStatus } from '@/components/Controls';
import { DayBar } from '@/components/DayBar';
import { ItemRow } from '@/components/ItemRow';
import { DateField, TimeField } from '@/components/Native';
import { Press } from '@/components/Press';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { enter, exit, layout } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function gap(now: { date: string; time: string }, date: string, time: string | null): string | null {
  if (!time) return null;
  const mins = toMinutes(time) - toMinutes(now.time) + diffDays(now.date, date) * 1440;
  if (mins < 0) return null;
  if (mins < 60) return `in ${mins}m`;
  if (mins < 1440) return `in ${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
  return null;
}

/** "October 19" for a local date. */
function longMonthDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS_LONG[m! - 1]} ${d}`;
}

/** "9:00" without its period. */
function clock(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h! % 12 === 0 ? 12 : h! % 12}:${String(m).padStart(2, '0')}`;
}
const period = (t: string) => (Number(t.split(':')[0]) >= 12 ? 'pm' : 'am');

/** "a screenshot", "a photo", "syllabus.pdf": where an import came from, in a sentence. */
function sourceName(sourceId: string): string {
  if (sourceId === 'Screenshot') return 'a screenshot';
  if (sourceId === 'Photo') return 'a photo';
  return sourceId;
}

/** A plain text row: body text, 28 high, no icon, no hairline. Highlights when it can be pressed. */
function Row({ children, trailing, onPress, accessibilityLabel }: { children: ReactNode; trailing?: ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.6 } : null]}>
      {children}
      {trailing}
    </Pressable>
  );
}

export default function ItemScreen() {
  const { c } = useTheme();
  const now = useNow();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => (id ? s.items[id] : undefined));
  const courses = useStore((s) => s.courses);
  const batches = useStore((s) => s.batches);
  const items = useItemList();
  const reminders = useStore((s) => s.settings.reminders);
  const toggleDone = useStore((s) => s.toggleDone);
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const removeItems = useStore((s) => s.removeItems);
  const [title, setTitle] = useState(item?.title ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [editing, setEditing] = useState<'time' | 'date' | 'until' | 'notes' | null>(null);
  const [scope, setScope] = useState(false);

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
  const noun = isEvent ? 'event' : 'to-do';
  const course = item.courseId ? courses.find((k) => k.id === item.courseId) : null;
  const where = [item.employer ?? course?.code ?? course?.title, item.category === 'school' ? 'Coursework' : item.category === 'work' ? 'Work' : 'Personal'].filter(Boolean).join(' · ');
  const batch = item.batchId ? batches.find((b) => b.id === item.batchId) : undefined;
  const sourceDate = longMonthDay((batch?.createdAt ?? item.createdAt).slice(0, 10));
  const source = item.sourceId === SAMPLE_SOURCE ? 'Sample data'
    : item.sourceId ? `From ${sourceName(item.sourceId)}, ${sourceDate}`
      : batch ? `${batch.label}, ${sourceDate}` : null;
  const status = itemStatus(item, now.date);
  const until = gap(now, item.date, item.start);
  const eyebrow = [relativeDay(now.date, item.date), until].filter(Boolean).join(' · ');
  const sameWeek = items.filter((it) => it.id !== item.id && !it.done && it.date >= now.date && diffDays(now.date, it.date) <= 7
    && ((item.employer && it.employer === item.employer) || (item.courseId && it.courseId === item.courseId))).slice(0, 4);
  const endsNextDay = item.start && item.end && item.end < item.start;
  const timeLabel = item.start ? `${clock(item.start)}${item.end ? ` to ${clock(item.end)}` : ''} ${period(item.end ?? item.start)}` : null;

  // The series this occurrence belongs to, when it repeats.
  const series = item.seriesId ? items.filter((it) => it.seriesId === item.seriesId) : [];
  const repeats = !!item.seriesId;
  const seriesDays = WEEKDAYS.filter((d) => series.some((it) => weekdayOf(it.date) === d)).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  const seriesEnd = series.reduce((max, it) => (it.date > max ? it.date : max), item.date);
  const seriesLeft = series.filter((it) => it.date >= now.date).length;
  const fromNow = series.filter((it) => it.date >= item.date);
  const week = new Set(weekOf(item.date));
  const thisWeek = fromNow.filter((it) => week.has(it.date));
  const seriesNoun = /lecture/i.test(item.title) ? 'lecture' : noun;
  const count = (n: number) => `${n} ${n === 1 ? seriesNoun : `${seriesNoun}s`}`;

  const dayItems = items.filter((it) => it.date === item.date);
  const showDay = dayItems.some((it) => it.kind === 'event' && it.start);

  const reminderLine = reminders.enabled
    ? isEvent && item.start ? `Reminder ${reminders.eventLead} min before` : item.isDeadline ? 'Reminder the evening before and the morning of' : 'In the morning briefing'
    : 'Reminders are off · turn them on in You';

  const shorten = (date: string) => {
    if (!isLocalDate(date) || date >= seriesEnd) return;
    const ids = series.filter((it) => it.date > date).map((it) => it.id);
    if (ids.length) removeItems(ids, `Shortened ${item.title}`);
    setEditing(null);
  };
  const deleteAndLeave = (fn: () => void) => { fn(); router.back(); };

  return (
    <Sheet
      title={isEvent ? 'Event' : 'To-do'}
      nav="push"
      footer={
        scope ? (
          <Animated.View entering={enter.drop} exiting={exit.fade} style={styles.scope}>
            <GroupLabel>{`Delete which ${seriesNoun}s?`}</GroupLabel>
            {[
              { label: 'Just this one', value: `${weekdayShort(item.date)}, ${monthDay(item.date)}`, run: () => removeItem(item.id) },
              { label: 'This week', value: count(thisWeek.length), run: () => removeItems(thisWeek.map((it) => it.id), `Deleted ${count(thisWeek.length)}`) },
              { label: 'From now on', value: count(fromNow.length), run: () => removeItems(fromNow.map((it) => it.id), `Deleted ${count(fromNow.length)}`) },
            ].map((o) => (
              <Pressable key={o.label} accessibilityRole="button" accessibilityLabel={`${o.label}, ${o.value}`} onPress={() => { feedback('remove'); deleteAndLeave(o.run); }}
                style={({ pressed }) => [styles.scopeRow, { borderBottomColor: c.line }, pressed ? { opacity: 0.6 } : null]}>
                <T token="body" color={c.conflict} style={{ flex: 1 }}>{o.label}</T>
                <T token="callout" color={c.inkSecondary} tabular>{o.value}</T>
              </Pressable>
            ))}
            <TextButton label="Keep it" tone="muted" onPress={() => setScope(false)} style={{ alignSelf: 'center' }} />
            <T token="caption" color={c.inkSecondary} style={{ textAlign: 'center' }}>Every choice can be undone from the toast or Your data.</T>
          </Animated.View>
        ) : (
          <>
            {!isEvent ? <Button label={item.done ? 'Mark as not done' : 'Mark as done'} onPress={() => { feedback(item.done ? 'uncomplete' : 'complete'); toggleDone(item.id); }} /> : null}
            {repeats
              ? <TextButton label={`Delete this ${noun}`} tone="danger" haptic="tap" onPress={() => setScope(true)} />
              : <TextButton label={`Delete this ${noun}`} tone="danger" haptic="remove" onPress={() => deleteAndLeave(() => removeItem(item.id))} />}
          </>
        )
      }>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
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
            <Pressable accessibilityRole="button" accessibilityLabel={`Time, ${timeLabel}, tap to change`} accessibilityState={{ expanded: editing === 'time' }}
              onPress={() => { feedback('select'); setEditing(editing === 'time' ? null : 'time'); }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <T token="displayXl" tabular style={styles.time}>
                {clock(item.start)}{item.end ? <T token="displayXl" color={c.inkSecondary} style={styles.time}> – </T> : null}{item.end ? clock(item.end) : ''}
                <T token="title" color={c.inkSecondary} style={{ fontSize: 20 }}> {period(item.end ?? item.start)}{endsNextDay ? ', next day' : ''}</T>
              </T>
            </Pressable>
          ) : (
            <Press accessibilityRole="button" accessibilityLabel="Add a time" haptic="select" onPress={() => setEditing(editing === 'time' ? null : 'time')} style={[styles.addTime, { backgroundColor: c.row }]}>
              <T token="subhead">Add a time</T>
            </Press>
          )}
          {editing === 'time' ? (
            <Animated.View entering={enter.drop} exiting={exit.fade} style={styles.pickers}>
              <TimeField date={item.date} time={item.start} onChange={(start) => isLocalTime(start) && updateItem(item.id, { start })} />
              {isEvent ? <TimeField date={item.date} time={item.end} onChange={(end) => isLocalTime(end) && updateItem(item.id, { end })} /> : null}
              <TextButton label="Done" tone="muted" onPress={() => setEditing(null)} />
            </Animated.View>
          ) : null}
        </View>

        <Animated.View layout={layout} style={styles.rows}>
          {editing === 'date' ? (
            <Animated.View entering={enter.drop} style={styles.pickers}>
              <DateField date={item.date} time={item.start} onChange={(date) => isLocalDate(date) && updateItem(item.id, { date })} />
              <TextButton label="Done" tone="muted" onPress={() => setEditing(null)} />
            </Animated.View>
          ) : (
            <Row onPress={() => setEditing('date')} accessibilityLabel={`Date, ${weekdayLong(item.date)}, ${longMonthDay(item.date)}, tap to change`}>
              <T token="body">{`${weekdayLong(item.date)}, ${longMonthDay(item.date)}`}{item.isDeadline ? <T token="body" color={c.inkSecondary}> · Deadline</T> : null}</T>
            </Row>
          )}
          <Row><T token="body">{where}</T></Row>
          {source ? <Row><T token="body">{source}</T></Row> : null}
          {repeats ? (
            <Row trailing={editing === 'until' ? null : <TextButton label="Change" onPress={() => setEditing('until')} accessibilityLabel="Change when it stops repeating" />}>
              <T token="body" style={{ flex: 1 }}>{`Repeats ${seriesDays.join(', ')} until ${monthDay(seriesEnd)} · ${seriesLeft} left`}</T>
            </Row>
          ) : null}
          {editing === 'until' ? (
            <Animated.View entering={enter.drop} exiting={exit.fade} style={styles.pickers}>
              <T token="callout" color={c.inkSecondary}>Last one</T>
              <DateField date={seriesEnd} time={null} onChange={shorten} />
              <TextButton label="Done" tone="muted" onPress={() => setEditing(null)} />
            </Animated.View>
          ) : null}
          <Row onPress={reminders.enabled ? undefined : () => router.push('/settings/reminders')}>
            <T token="body" color={reminders.enabled ? c.inkPrimary : c.inkSecondary}>{reminderLine}</T>
          </Row>
        </Animated.View>

        {showDay ? (
          <View style={styles.around}>
            <GroupLabel>{`${weekdayLong(item.date)} around it`}</GroupLabel>
            <DayBar items={dayItems} now={{ date: item.date, time: now.time }} conflicts={new Set()} highlight={item.id} />
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <GroupLabel>Notes</GroupLabel>
          {item.notes && editing !== 'notes' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Notes, tap to edit" onPress={() => setEditing('notes')}>
              <T token="body" color={c.inkSecondary}>{item.notes}</T>
            </Pressable>
          ) : editing === 'notes' ? (
            <Animated.View entering={enter.drop}>
              <TextInput
                accessibilityLabel="Notes"
                autoFocus
                multiline
                value={notes}
                onChangeText={setNotes}
                onBlur={() => { const next = notes.trim() || null; if (next !== item.notes) updateItem(item.id, { notes: next }); setEditing(null); }}
                placeholder="Anything to remember"
                placeholderTextColor={c.inkTertiary}
                style={[textStyle('body', c.inkPrimary), styles.notes, { backgroundColor: c.row }]}
              />
            </Animated.View>
          ) : (
            <TextButton label="Add a note" tone="muted" onPress={() => setEditing('notes')} style={{ alignSelf: 'flex-start', minHeight: 32 }} />
          )}
        </View>

        {item.done && item.completedAt ? <T token="caption" color={c.inkSecondary}>Done {new Date(item.completedAt).toLocaleDateString()}</T> : null}

        {sameWeek.length ? (
          <View>
            <SectionTitle title="Same week" />
            {sameWeek.map((it, i) => (
              <Animated.View key={it.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
                <ItemRow item={it} today={now.date} last={i === sameWeek.length - 1} onPress={() => router.push(`/item/${it.id}`)}
                  onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); toggleDone(it.id); }} onDelete={() => removeItem(it.id)} />
              </Animated.View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 24, gap: 14 },
  head: { gap: 2, paddingBottom: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  time: { fontSize: 44, lineHeight: 48, letterSpacing: -1.4, paddingTop: 4 },
  addTime: { alignSelf: 'flex-start', height: 36, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  pickers: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, flexWrap: 'wrap' },
  rows: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 28, paddingHorizontal: 4 },
  around: { gap: 8, paddingTop: 10 },
  notes: { borderRadius: 16, padding: 14, minHeight: 88, textAlignVertical: 'top' },
  scope: { alignSelf: 'stretch' },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth },
});
