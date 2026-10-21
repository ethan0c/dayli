import { addDays, formatRange, formatTime, isLocalDate, localParts, monthDay, schedulePreview, weekdayLong, type SharedEntry } from '@dayli/core';
import type { Category } from '@dayli/schema';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip, GroupLabel, IconButton, StatusPill, TextButton } from '@/components/Controls';
import { NativeToggle } from '@/components/Native';
import { Segmented } from '@/components/Segmented';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { SHARING_ENABLED } from '@/lib/auth';
import { useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const CATEGORIES: { key: Category; label: string }[] = [{ key: 'school', label: 'School' }, { key: 'work', label: 'Work' }, { key: 'personal', label: 'Personal' }];

function entryTime(entry: SharedEntry): string {
  if (!entry.start) return entry.kind === 'event' ? 'All day' : 'Any time';
  if (!entry.end) return formatTime(entry.start, true);
  return `${formatRange(entry.start, entry.end)}${entry.end <= entry.start ? ' · next day' : ''}`;
}

/** Local-only preview: the reader receives a restricted projection, never source records. */
export default function ShareScheduleScreen() {
  if (!SHARING_ENABLED) return <Redirect href="/plan" />;
  return <ShareSchedulePreview />;
}

function ShareSchedulePreview() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const items = useItemList();
  const name = useStore((s) => s.settings.name.trim());
  const [date, setDate] = useState(() => isLocalDate(params.date) ? params.date : localParts(new Date()).date);
  const [range, setRange] = useState<'day' | 'week'>('week');
  const [categories, setCategories] = useState<Category[]>(['school', 'work', 'personal']);
  const [showTitles, setShowTitles] = useState(true);
  const [viewer, setViewer] = useState(false);
  const preview = schedulePreview(items, { date, range, categories, showTitles });
  const rangeLabel = preview.from === preview.to ? monthDay(preview.from) : `${monthDay(preview.from)}–${monthDay(preview.to)}`;
  const title = name ? `${name}’s schedule` : 'My schedule';
  const displayDate = (entry: SharedEntry) => entry.date < preview.from ? preview.from : entry.date;
  const dates = [...new Set(preview.entries.map(displayDate))];
  const move = (offset: number) => setDate((current) => addDays(current, offset * (range === 'week' ? 7 : 1)));

  return (
    <Sheet title={viewer ? 'Read-only preview' : 'Share your schedule'} footer={viewer ? <TextButton label="Back to sharing options" onPress={() => setViewer(false)} /> : <>
      <Button label="Create share link" disabled onPress={() => {}} />
      <T token="caption" color={c.inkSecondary} style={styles.center}>Live links are coming soon. Nothing has been uploaded or shared.</T>
    </>}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.previewNote}>
          <StatusPill label="Preview" tabular={false} />
          <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>Only you can see this. Your schedule stays on this phone.</T>
        </View>
        {!viewer ? <>
          <View style={styles.hero}>
            <T token="display" accessibilityRole="header">Your week, shared.</T>
            <T token="body" color={c.inkSecondary}>A friend or parent will be able to open a read-only link in their browser. No app download needed.</T>
          </View>
          <View style={{ gap: 16 }}>
            <GroupLabel>Choose what they see</GroupLabel>
            <Segmented label="Schedule range" options={[{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }]} value={range} onChange={setRange} />
            <View style={styles.dateRow}>
              <IconButton icon="chevronLeft" label={`Previous ${range}`} tone="glass" onPress={() => move(-1)} />
              <T token="headline" tabular style={styles.center}>{rangeLabel}, {preview.to.slice(0, 4)}</T>
              <IconButton icon="chevronRight" label={`Next ${range}`} tone="glass" onPress={() => move(1)} />
            </View>
            <View style={styles.chips}>
              {CATEGORIES.map(({ key, label }) => <Chip key={key} label={label} on={categories.includes(key)} onPress={() => setCategories((current) => current.includes(key) ? current.filter((category) => category !== key) : [...current, key])} />)}
            </View>
            <View style={[styles.toggle, { borderBottomColor: c.line }]}>
              <View style={{ flex: 1, gap: 4 }}><T token="body">Show event names</T><T token="caption" color={c.inkSecondary}>Switch off to show “Busy” and “To-do” instead.</T></View>
              <NativeToggle label="Show event names" value={showTitles} onChange={setShowTitles} />
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <GroupLabel>Message preview</GroupLabel>
            <View style={[styles.linkPreview, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Wordmark width={64} ink={c.inkPrimary} dot={c.accent} />
              <T token="headline">{title}</T>
              <T token="callout" color={c.inkSecondary}>{rangeLabel} · Read-only schedule</T>
              <Button label="Open preview" variant="secondary" onPress={() => setViewer(true)} />
            </View>
          </View>
        </> : <View style={styles.hero}>
          <Wordmark width={80} ink={c.inkPrimary} dot={c.accent} />
          <T token="display" accessibilityRole="header">{title}</T>
          <T token="body" color={c.inkSecondary}>{rangeLabel}, {preview.to.slice(0, 4)} · Read-only</T>
        </View>}
        <View style={{ gap: 12 }}>
          {!viewer ? <GroupLabel>Schedule preview</GroupLabel> : null}
          {dates.length ? dates.map((day) => <View key={day}>
            <T token="headline" style={{ paddingVertical: 12 }}>{weekdayLong(day)}, {monthDay(day)}</T>
            {preview.entries.filter((entry) => displayDate(entry) === day).map((entry, index) => <View key={index} style={[styles.entry, { borderBottomColor: c.line }]}>
              <View style={[styles.dot, { backgroundColor: c.chartBooked }]} />
              <View style={{ flex: 1, gap: 4 }}><T token="body">{entry.title}</T><T token="caption" color={c.inkSecondary}>{entry.date < preview.from && entry.end ? `Until ${formatTime(entry.end, true)} · from ${monthDay(entry.date)}` : entryTime(entry)}</T></View>
              {entry.isDeadline ? <StatusPill label="Due" tabular={false} /> : null}
            </View>)}
          </View>) : <T token="callout" color={c.inkSecondary}>{categories.length ? 'No plans in this date range. Choose another day or week.' : 'Choose at least one category to include in your preview.'}</T>}
          <T token="caption" color={c.inkSecondary} style={{ paddingTop: 12 }}>Notes, source files, employer details and account information aren’t included in this preview.</T>
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, paddingBottom: 32, gap: 28 },
  previewNote: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hero: { gap: 12 },
  center: { textAlign: 'center', flexShrink: 1 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  linkPreview: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 20, gap: 12 },
  entry: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
