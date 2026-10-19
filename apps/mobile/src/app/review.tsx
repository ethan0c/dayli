import { isLocalDate, localParts, monthDay, planCommit, toDrafts, weekdayLong, type Draft } from '@dayli/core';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { DateField, NativeToggle, TimeField } from '@/components/Native';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { newId, useItemList, useStore } from '@/store';
import { radius, textStyle, useTheme } from '@/theme';

export default function ReviewScreen() {
  const { c } = useTheme();
  const pending = useStore((s) => s.pending);
  const setPending = useStore((s) => s.setPending);
  const applyPlan = useStore((s) => s.applyPlan);
  const showToast = useStore((s) => s.showToast);
  const courses = useStore((s) => s.courses);
  const existing = useItemList();
  const today = localParts(new Date()).date;

  const [drafts, setDrafts] = useState<Draft[]>(() => (pending ? toDrafts(pending.extraction, today) : []));

  useEffect(() => {
    if (!pending) router.back();
  }, [pending]);

  const ex = pending?.extraction;
  const courseFor = useCallback(
    (code: string | null) => (code ? (courses.find((k) => k.code?.toLowerCase() === code.toLowerCase())?.id ?? null) : null),
    [courses],
  );
  // A course the syllabus describes that we don't have yet. Its id is minted on confirm.
  const newCourse = useMemo(() => {
    const course = ex?.course;
    if (!course) return null;
    if (course.code && courseFor(course.code)) return null;
    if (courses.some((k) => k.title.toLowerCase() === course.title.toLowerCase())) return null;
    return { code: course.code, title: course.title, instructor: course.instructor };
  }, [ex, courses, courseFor]);

  const buildPlan = useCallback(
    (newCourseId: string) =>
      ex
        ? planCommit(ex, drafts, existing, (code) =>
            courseFor(code) ?? (newCourse && code && newCourse.code?.toLowerCase() === code.toLowerCase() ? newCourseId : null),
          )
        : null,
    [ex, drafts, existing, courseFor, newCourse],
  );
  const plan = useMemo(() => buildPlan('new-course'), [buildPlan]);

  if (!pending || !ex || !plan) return null;

  const included = drafts.filter((d) => d.include);
  const invalid = included.filter((d) => !isLocalDate(d.date));
  const total = plan.create.length + plan.update.length + plan.remove.length;
  const typeLabel =
    ex.detected_type === 'work_schedule'
      ? `Work schedule${ex.employer ? ` · ${ex.employer}` : ''}`
      : ex.detected_type === 'syllabus'
        ? `Syllabus${ex.course ? ` · ${ex.course.code ?? ex.course.title}` : ''}`
        : ex.detected_type === 'course_schedule'
          ? 'Class schedule'
          : 'From your message';

  const edit = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch, needsInput: false } : d)));

  const confirm = () => {
    const label = plan.schedule
      ? `Updated ${plan.schedule.employer} schedule`
      : `Added ${plan.create.length} ${plan.create.length === 1 ? 'item' : 'items'}`;
    const courseId = newId();
    const id = applyPlan(buildPlan(courseId) ?? plan, label, {
      source: pending.source,
      course: newCourse ? { id: courseId, ...newCourse, sourceId: null } : undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parts = [
      plan.create.length ? `${plan.create.length} added` : null,
      plan.update.length ? `${plan.update.length} updated` : null,
      plan.remove.length ? `${plan.remove.length} removed` : null,
      plan.skipped ? `${plan.skipped} already there` : null,
    ].filter(Boolean);
    showToast(parts.join(' · ') + '.', id);
    setPending(null);
    router.dismissAll();
    router.replace('/plan');
  };

  const cta = plan.schedule
    ? `Update ${total} ${total === 1 ? 'shift' : 'shifts'}`
    : `Add ${plan.create.length + plan.update.length} ${plan.create.length + plan.update.length === 1 ? 'item' : 'items'}`;

  const groups = groupByDate(drafts);
  return (
    <Sheet
      title={typeLabel}
      subtitle={`From ${pending.source.toLowerCase() === 'message' ? 'your message' : pending.source}`}
      onClose={() => {
        setPending(null);
        router.back();
      }}
      footer={
        <>
          {invalid.length > 0 ? (
            <T token="subhead" color={c.conflict} style={{ textAlign: 'center' }}>
              {invalid.length} {invalid.length === 1 ? 'item needs' : 'items need'} a date, or switch {invalid.length === 1 ? 'it' : 'them'} off.
            </T>
          ) : (
            <T token="subhead" color={c.inkSecondary} style={{ textAlign: 'center' }}>
              Nothing changes until you confirm.
            </T>
          )}
          <Button label={cta} disabled={invalid.length > 0 || total === 0} onPress={confirm} />
        </>
      }>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {plan.schedule ? (
          <View style={styles.diff}>
            <Pill label={`${plan.schedule.diff.added.length} new`} bg={c.addedBg} ink={c.added} />
            <Pill label={`${plan.schedule.diff.changed.length} changed`} bg={c.changedBg} ink={c.changed} />
            <Pill label={`${plan.schedule.diff.removed.length} removed`} bg={c.conflictBg} ink={c.conflict} />
            <Pill label={`${plan.schedule.diff.unchanged.length} same`} bg={c.row} ink={c.inkSecondary} />
          </View>
        ) : null}
        {newCourse ? (
          <View style={[styles.course, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
            <Icon name="school" size={18} color={c.accentInk} />
            <T token="subhead" color={c.accentInk} style={{ flex: 1 }}>
              New course: {[newCourse.code, newCourse.title].filter(Boolean).join(' · ')}
            </T>
          </View>
        ) : null}
        {groups.map(([date, list]) => (
          <View key={date || 'none'} style={{ gap: 6 }}>
            <T token="overline" color={c.inkSecondary} style={{ paddingLeft: 4, paddingTop: 8 }}>
              {date ? `${weekdayLong(date)} · ${monthDay(date)}` : 'No date yet'}
            </T>
            {list.map((d) => (
              <DraftCard key={d.key} draft={d} onEdit={(patch) => edit(d.key, patch)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

/** Drafts grouped by valid date, undated ones last. */
function groupByDate(drafts: Draft[]): [string, Draft[]][] {
  const m = new Map<string, Draft[]>();
  for (const d of drafts) {
    const k = d.date && isLocalDate(d.date) ? d.date : '';
    m.set(k, [...(m.get(k) ?? []), d]);
  }
  return [...m.entries()].sort((a, b) => (a[0] || '9999').localeCompare(b[0] || '9999'));
}

function Pill({ label, bg, ink }: { label: string; bg: string; ink: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <T token="subhead" color={ink}>
        {label}
      </T>
    </View>
  );
}

function DraftCard({ draft: d, onEdit }: { draft: Draft; onEdit: (patch: Partial<Draft>) => void }) {
  const { c } = useTheme();
  const cat = c.category[d.category];
  const on = d.include;
  const attention = on && (d.needsInput || !isLocalDate(d.date));
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: d.kind === 'event' ? cat.fill : c.row, opacity: on ? 1 : 0.5 },
        attention ? { borderWidth: 1.5, borderColor: c.accent } : null,
      ]}>
      <View style={styles.cardRow}>
        <Icon name={d.icon} color={d.kind === 'event' ? cat.ink : c.inkPrimary} />
        <TextInput
          value={d.title}
          onChangeText={(title) => onEdit({ title })}
          editable={on}
          style={[textStyle('body', d.kind === 'event' ? cat.ink : c.inkPrimary), { flex: 1, minWidth: 0, padding: 0 }]}
        />
        <NativeToggle value={on} onChange={(include) => onEdit({ include })} />
      </View>
      <View style={[styles.cardRow, { flexWrap: 'wrap' }]}>
        <DateField date={d.date} time={d.start} onChange={(date) => onEdit({ date: date || null })} disabled={!on} />
        {d.kind === 'event' || d.start ? (
          <>
            <TimeField date={d.date} time={d.start} onChange={(start) => onEdit({ start: start || null })} disabled={!on} />
            {d.kind === 'event' ? <TimeField date={d.date} time={d.end} onChange={(end) => onEdit({ end: end || null })} disabled={!on} /> : null}
          </>
        ) : null}
        <T token="caption" color={c.inkSecondary} style={{ flexGrow: 1 }} numberOfLines={1}>
          {d.kind === 'task' ? 'to-do' : d.category}
          {d.isDeadline ? ' · deadline' : ''}
          {d.courseCode ? ` · ${d.courseCode}` : ''}
        </T>
      </View>
      {attention && d.question ? (
        <T token="subhead" color={c.accentInk}>
          {d.question}
        </T>
      ) : null}
      {d.evidence ? (
        <T token="caption" color={c.inkSecondary} numberOfLines={2}>
          “{d.evidence}”
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  diff: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  course: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.row, borderWidth: 1 },
  card: { borderRadius: radius.card, padding: 12, gap: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
