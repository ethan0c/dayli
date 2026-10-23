import { formatTime, isLocalDate, localParts, monthDay, weekdayShort } from '@dayli/core';
import type { Category } from '@dayli/schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CategoryDot, Chip, GroupLabel } from '@/components/Controls';
import { DateField, NativeToggle, TimeField } from '@/components/Native';
import { RingingAlarmInfo } from '@/components/RingingAlarmInfo';
import { Press } from '@/components/Press';
import { Segmented } from '@/components/Segmented';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { feedback } from '@/lib/feedback';
import { usePlusAccess } from '@/lib/plus-access';
import { buildManualItem, defaultManualTimes, type ManualDraft } from '@/lib/manual-item';
import { courseTint, useCourseList, useStore } from '@/store';
import { SCREEN_GUTTER, corner, radius, textStyle, useTheme, size } from '@/theme';

const categories: { key: Category; label: string }[] = [
  { key: 'personal', label: 'Personal' }, { key: 'school', label: 'School' }, { key: 'work', label: 'Work' },
];

type Field = 'title' | 'employer' | 'notes';
type Picker = 'date' | 'start' | 'end' | 'time';

/** New to-do or event by hand: a pill title, hairline rows with pills and toggles, one primary button. */
export default function CreateScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ kind?: string; date?: string }>();
  const courses = useCourseList();
  const [draft, setDraft] = useState<ManualDraft>(() => ({
    kind: params.kind === 'event' ? 'event' : 'task', title: '', category: 'personal',
    date: params.date && isLocalDate(params.date) ? params.date : localParts(new Date()).date,
    ...defaultManualTimes(new Date()), allDay: false, hasDueTime: false, isDeadline: false, urgent: false,
    courseId: null, employer: '', notes: '',
  }));
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<Field | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const saving = useRef(false);
  const patch = (values: Partial<ManualDraft>) => { setDraft((previous) => ({ ...previous, ...values })); setError(null); };
  const { requirePlus } = usePlusAccess();
  // Urgent items ring like an alarm, which is part of Plus. Turning it off is always allowed.
  const setUrgent = async (urgent: boolean) => {
    if (urgent && !(await requirePlus('urgent'))) return;
    feedback('select');
    patch({ urgent });
  };
  const event = draft.kind === 'event';

  const save = () => {
    if (saving.current) return;
    const result = buildManualItem(draft);
    if (!result.ok) { setError(result.error); feedback('error'); return; }
    saving.current = true;
    const store = useStore.getState();
    const id = store.addItem(result.item);
    track('manual_item_created', {
      item_kind: result.item.kind,
      category: result.item.category,
      has_time: !!result.item.start,
      urgent: !!result.item.urgent,
    });
    store.showToast(`Added ${result.item.title}.`, useStore.getState().items[id]?.batchId ?? undefined);
    feedback('success');
    router.back();
  };

  /** A one-line field is a pill: grey at rest, white with an ink ring while focused. */
  const pillField = (name: Field) => [
    styles.pillField,
    textStyle('body', c.inkPrimary),
    focus === name ? { backgroundColor: c.surface, borderColor: c.inkPrimary } : { backgroundColor: c.row, borderColor: 'transparent' },
  ];

  const timeControl = (which: 'start' | 'end' | 'time') => {
    const key = which === 'end' ? 'end' : 'start';
    if (picker === which) return <TimeField date={draft.date} time={draft[key]} onChange={(value) => patch({ [key]: value })} />;
    return <FieldPill label={formatTime(draft[key])} accessibilityLabel={`${which === 'end' ? 'Ends' : which === 'start' ? 'Starts' : 'Time'}, ${formatTime(draft[key])}`} onPress={() => setPicker(which)} />;
  };

  return (
    <Sheet dialog title={event ? 'New event' : 'New to-do'} footer={<>
      {error ? <T token="callout" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
      <Button label={event ? 'Add event' : 'Add to-do'} onPress={save} />
    </>}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <TextInput accessibilityLabel={event ? 'Event title' : 'To-do title'} value={draft.title} onChangeText={(title) => patch({ title })}
          placeholder={event ? 'What’s happening?' : 'What needs doing?'} placeholderTextColor={c.inkSecondary}
          onFocus={() => setFocus('title')} onBlur={() => setFocus((f) => (f === 'title' ? null : f))}
          maxLength={500} returnKeyType="done" style={pillField('title')} />

        <View style={styles.rows}>
          <FieldRow label="Date">
            {picker === 'date'
              ? <DateField date={draft.date} time={draft.start} onChange={(date) => patch({ date })} />
              : <FieldPill label={`${weekdayShort(draft.date)}, ${monthDay(draft.date)}`} accessibilityLabel={`Date, ${weekdayShort(draft.date)} ${monthDay(draft.date)}`} onPress={() => setPicker('date')} />}
          </FieldRow>
          {event ? (
            <>
              <FieldRow label="All day"><NativeToggle label="All day" value={draft.allDay} onChange={(allDay) => patch({ allDay })} /></FieldRow>
              {!draft.allDay ? (
                <>
                  <FieldRow label="Starts">{timeControl('start')}</FieldRow>
                  <FieldRow label="Ends" last={draft.end >= draft.start}>{timeControl('end')}</FieldRow>
                  {draft.end < draft.start ? <T token="caption" color={c.inkSecondary} style={styles.rowNote}>Ends the next day.</T> : null}
                </>
              ) : null}
            </>
          ) : (
            <>
              <FieldRow label="Deadline"><NativeToggle label="Deadline" value={draft.isDeadline} onChange={(isDeadline) => patch({ isDeadline })} /></FieldRow>
              <FieldRow label="Set a time" last={!draft.hasDueTime}><NativeToggle label="Set a time" value={draft.hasDueTime} onChange={(hasDueTime) => patch({ hasDueTime })} /></FieldRow>
              {draft.hasDueTime ? <FieldRow label="Time" last>{timeControl('time')}</FieldRow> : null}
            </>
          )}
        </View>

        <View>
          <FieldRow label="Urgent" last><NativeToggle label="Urgent" value={!!draft.urgent} onChange={(urgent) => void setUrgent(urgent)} /></FieldRow>
          {draft.urgent ? <RingingAlarmInfo timed={event ? !draft.allDay : draft.hasDueTime} draft /> : <T token="caption" color={c.inkSecondary}>Make this stand out in your plan.</T>}
        </View>

        <View style={styles.section}>
          <GroupLabel>Keep it with</GroupLabel>
          <Segmented options={categories} value={draft.category} onChange={(category) => patch({ category, courseId: null })} label="Category" />
          {draft.category === 'school' && courses.length > 0 ? (
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Course">
              <Chip label="No course" on={draft.courseId === null} onPress={() => patch({ courseId: null })} />
              {courses.map((course) => {
                const on = draft.courseId === course.id;
                const tint = c.tint[courseTint(courses, course.id) ?? 'lavender'];
                return (
                  <Press key={course.id} accessibilityRole="radio" accessibilityState={{ selected: on }} haptic="select" onPress={() => patch({ courseId: course.id })}
                    style={[styles.courseChip, { backgroundColor: on ? c.inkPrimary : c.row }]}>
                    <CategoryDot color={on ? tint.fill : tint.ink} />
                    <T token="subhead" color={on ? c.onPrimary : c.inkPrimary}>{course.code ?? course.title}</T>
                  </Press>
                );
              })}
            </View>
          ) : null}
          {draft.category === 'work' ? (
            <TextInput accessibilityLabel="Employer" value={draft.employer} onChangeText={(employer) => patch({ employer })}
              placeholder="Employer (optional)" placeholderTextColor={c.inkSecondary}
              onFocus={() => setFocus('employer')} onBlur={() => setFocus((f) => (f === 'employer' ? null : f))}
              returnKeyType="done" style={pillField('employer')} />
          ) : null}
        </View>

        <TextInput accessibilityLabel="Notes" value={draft.notes} onChangeText={(notes) => patch({ notes })} placeholder="Notes (optional)" placeholderTextColor={c.inkSecondary}
          onFocus={() => setFocus('notes')} onBlur={() => setFocus((f) => (f === 'notes' ? null : f))}
          multiline style={[styles.notes, textStyle('body', c.inkPrimary), focus === 'notes' ? { backgroundColor: c.surface, borderColor: c.inkPrimary } : { backgroundColor: c.row, borderColor: 'transparent' }]} />
      </ScrollView>
    </Sheet>
  );
}

/** A hairline row: the label on the left, one control on the right. */
function FieldRow({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
      <T token="body" style={{ flex: 1 }}>{label}</T>
      {children}
    </View>
  );
}

/** The 36-high grey pill that opens a native date or time picker. */
function FieldPill({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} haptic="select" onPress={onPress} style={[styles.pill, { backgroundColor: c.row }]}>
      <T token="subhead" tabular numberOfLines={1}>{label}</T>
    </Press>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, paddingBottom: 24, gap: 22 },
  pillField: { height: 52, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 0, borderWidth: 1.5 },
  rows: { marginTop: -2 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowNote: { paddingTop: 8 },
  section: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 40, borderRadius: 999 },
  pill: { height: size.pill, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  notes: { minHeight: 96, paddingVertical: 14, paddingHorizontal: 16, ...corner(radius.field), borderWidth: 1.5, textAlignVertical: 'top' },
});
