import { isLocalDate, localParts } from '@dayli/core';
import type { Category } from '@dayli/schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { DateField, NativeToggle, TimeField } from '@/components/Native';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { buildManualItem, defaultManualTimes, type ManualDraft } from '@/lib/manual-item';
import { useCourseList, useStore } from '@/store';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

const categories: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personal' }, { value: 'school', label: 'School' }, { value: 'work', label: 'Work' },
];

export default function CreateScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ kind?: string; date?: string }>();
  const courses = useCourseList();
  const [draft, setDraft] = useState<ManualDraft>(() => ({
    kind: params.kind === 'event' ? 'event' : 'task', title: '', category: 'personal',
    date: params.date && isLocalDate(params.date) ? params.date : localParts(new Date()).date,
    ...defaultManualTimes(new Date()), allDay: false, hasDueTime: false, isDeadline: false,
    courseId: null, employer: '', notes: '',
  }));
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const patch = (values: Partial<ManualDraft>) => { setDraft((previous) => ({ ...previous, ...values })); setError(null); };
  const event = draft.kind === 'event';
  const save = () => {
    if (saving.current) return;
    const result = buildManualItem(draft);
    if (!result.ok) { setError(result.error); feedback('error'); return; }
    saving.current = true;
    const store = useStore.getState();
    const id = store.addItem(result.item);
    store.showToast(`Added ${result.item.title}.`, useStore.getState().items[id]?.batchId ?? undefined);
    feedback('success');
    router.back();
  };

  return <Sheet title={event ? 'New event' : 'New to-do'} footer={<>
    {error ? <T token="callout" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
    <Button label={event ? 'Add event' : 'Add to-do'} onPress={save} />
  </>}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={[styles.titleField, { backgroundColor: event ? c.category[draft.category].fill : c.row }]}>
        <Icon name={event ? 'calendar' : 'check'} color={event ? c.category[draft.category].ink : c.inkPrimary} size={23} />
        <TextInput accessibilityLabel={event ? 'Event title' : 'To-do title'} value={draft.title} onChangeText={(title) => patch({ title })}
          placeholder={event ? 'What’s happening?' : 'What needs doing?'} placeholderTextColor={event ? c.category[draft.category].ink : c.inkSecondary}
          multiline maxLength={500} style={[styles.titleInput, textStyle('headline', event ? c.category[draft.category].ink : c.inkPrimary)]} />
      </View>
      <View style={[styles.fields, { backgroundColor: c.row }]}>
        <FieldRow label={draft.isDeadline && !event ? 'Due date' : 'Date'}><DateField date={draft.date} time={draft.start} onChange={(date) => patch({ date })} /></FieldRow>
        {event ? <>
          <FieldRow label="All day"><NativeToggle label="All day" value={draft.allDay} onChange={(allDay) => patch({ allDay })} /></FieldRow>
          {!draft.allDay ? <>
            <FieldRow label="Starts"><TimeField date={draft.date} time={draft.start} onChange={(start) => patch({ start })} /></FieldRow>
            <FieldRow label="Ends"><TimeField date={draft.date} time={draft.end} onChange={(end) => patch({ end })} /></FieldRow>
            {draft.end < draft.start ? <T token="caption" color={c.inkSecondary}>Ends the next day.</T> : null}
          </> : null}
        </> : <>
          <FieldRow label="Deadline"><NativeToggle label="Deadline" value={draft.isDeadline} onChange={(isDeadline) => patch({ isDeadline })} /></FieldRow>
          <FieldRow label="Set a time"><NativeToggle label="Set a time" value={draft.hasDueTime} onChange={(hasDueTime) => patch({ hasDueTime })} /></FieldRow>
          {draft.hasDueTime ? <FieldRow label={draft.isDeadline ? 'Due at' : 'Time'}><TimeField date={draft.date} time={draft.start} onChange={(start) => patch({ start })} /></FieldRow> : null}
        </>}
      </View>
      <View style={styles.section}>
        <T token="subhead" color={c.inkSecondary}>Keep it with</T>
        <View accessibilityRole="radiogroup" accessibilityLabel="Category" style={[styles.segments, { backgroundColor: c.row }]}>
          {categories.map(({ value, label }) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: draft.category === value }}
            onPress={() => { feedback('select'); patch({ category: value, courseId: null }); }}
            style={[styles.segment, { backgroundColor: draft.category === value ? c.surface : 'transparent' }]}><T token="subhead">{label}</T></Pressable>)}
        </View>
        {draft.category === 'school' && courses.length > 0 ? <View style={styles.courses} accessibilityRole="radiogroup" accessibilityLabel="Course">
          {[{ id: null, label: 'No course' }, ...courses.map((course) => ({ id: course.id, label: course.code ?? course.title }))].map(({ id, label }) => <Pressable key={id ?? 'none'}
            accessibilityRole="radio" accessibilityState={{ selected: draft.courseId === id }} onPress={() => patch({ courseId: id })}
            style={[styles.course, { backgroundColor: draft.courseId === id ? c.accentSoft : c.row }]}><T token="subhead" color={draft.courseId === id ? c.accentInk : c.inkSecondary}>{label}</T></Pressable>)}
        </View> : null}
        {draft.category === 'work' ? <TextInput accessibilityLabel="Employer" value={draft.employer} onChangeText={(employer) => patch({ employer })}
          placeholder="Employer (optional)" placeholderTextColor={c.inkSecondary} style={[styles.input, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]} /> : null}
      </View>
      <TextInput accessibilityLabel="Notes" value={draft.notes} onChangeText={(notes) => patch({ notes })} placeholder="Notes (optional)" placeholderTextColor={c.inkSecondary}
        multiline style={[styles.input, styles.notes, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]} />
    </ScrollView>
  </Sheet>;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return <View style={styles.fieldRow}><T token="body" style={{ flex: 1 }}>{label}</T>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 24, gap: 20 },
  titleField: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18 },
  titleInput: { flex: 1, minHeight: 32, padding: 0, textAlignVertical: 'center' },
  fields: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 18 },
  fieldRow: { minHeight: 52, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { gap: 10 },
  segments: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 3 },
  segment: { flex: 1, minHeight: 44, padding: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  courses: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  course: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, justifyContent: 'center' },
  input: { minHeight: 52, padding: 16, borderRadius: 16 },
  notes: { minHeight: 100, textAlignVertical: 'top' },
});
