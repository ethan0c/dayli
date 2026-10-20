import {
  WEEKDAYS, conflictIds, formatTime, isLocalDate, localParts, monthDay, planCommit, toDrafts, toMinutes, weekOf, weekdayLong, weekdayOf, weekdayShort,
  type CommitPlan, type DatedDraft, type Draft,
} from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { SectionTitle, StatusPill, TextButton } from '@/components/Controls';
import { DateField, TimeField } from '@/components/Native';
import { Press } from '@/components/Press';
import { ReviewDisclosure, ReviewGlyph, ReviewPickerSlot, ReviewPill, ReviewPillRow, ReviewRow } from '@/components/ReviewRow';
import { Button, Sheet } from '@/components/Sheet';
import { TermLine, type TermMark } from '@/components/TermLine';
import { T } from '@/components/Text';
import { WeekChart, compactRange, type WeekBlock, type WeekDay } from '@/components/WeekChart';
import { track } from '@/lib/analytics';
import { feedback } from '@/lib/feedback';
import { layout } from '@/lib/motion';
import { requestNotifications, syncReminders } from '@/lib/notifications';
import { usePlusAccess } from '@/lib/plus-access';
import { purchaseErrorMessage } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { newId, useCourseList, useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/*
 * Review: show the week (or the term), not the list. Only changes and things that need
 * input get rows, nothing blocks the confirm, and everything is undoable from the toast.
 */

const EXAM = /exam|quiz|midterm|final|test\b/i;

type SeriesEnd = { mode: 'suggested' | 'pick'; date: string };

export default function ReviewScreen() {
  const { c } = useTheme();
  const pending = useStore((s) => s.pending);
  const setPending = useStore((s) => s.setPending);
  const applyPlan = useStore((s) => s.applyPlan);
  const showToast = useStore((s) => s.showToast);
  const courses = useCourseList();
  const existing = useItemList();
  const today = localParts(new Date()).date;
  const leaving = useRef(false);
  const confirming = useRef(false);
  const { requirePlus } = usePlusAccess();
  const { isPro } = usePurchases();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Undated drafts start excluded: they are counted as skipped, never block the confirm.
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    pending ? toDrafts(pending.extraction, today).map((d) => ({ ...d, include: isLocalDate(d.date) })) : [],
  );
  const [seriesEnd, setSeriesEnd] = useState<Record<string, SeriesEnd>>(() => suggestSeriesEnds(drafts));
  /** Existing shifts the user chose to keep although the new schedule drops them. */
  const [kept, setKept] = useState<Set<string>>(() => new Set());
  /** Draft keys with their editor pills shown. */
  const [editing, setEditing] = useState<Set<string>>(() => new Set());
  const [listOpen, setListOpen] = useState(false);
  /** `${key}:${field}` of the one open picker. */
  const [picker, setPicker] = useState<string | null>(null);

  useEffect(() => {
    // Missing transient review data can follow a cold link or a development reload.
    // Explicit close/confirm handlers own their navigation; do not navigate twice.
    if (!pending && !leaving.current) router.replace(useStore.getState().settings.onboarded ? '/plan' : '/onboarding');
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

  // A chosen term end trims the repeating class to the occurrences on or before it.
  const effective = useMemo(
    () => drafts.map((d) => {
      const end = d.seriesId ? seriesEnd[d.seriesId] : undefined;
      return end && d.date && d.date > end.date ? { ...d, include: false } : d;
    }),
    [drafts, seriesEnd],
  );

  const buildPlan = useCallback(
    (newCourseId: string): CommitPlan | null => {
      if (!ex) return null;
      const p = planCommit(ex, effective, existing, (code) =>
        courseFor(code) ?? (newCourse && code && newCourse.code?.toLowerCase() === code.toLowerCase() ? newCourseId : null),
      );
      return { ...p, remove: p.remove.filter((id) => !kept.has(id)) };
    },
    [ex, effective, existing, courseFor, newCourse, kept],
  );
  const plan = useMemo(() => buildPlan('new-course'), [buildPlan]);

  if (!pending || !ex || !plan) return null;

  // ---- What kind of review this is ------------------------------------------------
  const sched = plan.schedule;
  const diff = sched?.diff;
  const isSchedule = !!sched && !!diff;
  const isUpdate = !!diff && diff.changed.length + diff.removed.length + diff.unchanged.length > 0;
  const isSyllabus = ex.detected_type === 'syllabus';
  const source = sourceNoun(pending.source);
  const docNoun = isSyllabus ? 'syllabus' : source.replace(/^(a|your) /, '');

  const included = effective.filter((d): d is DatedDraft => d.include && isLocalDate(d.date));
  const undated = effective.filter((d) => !isLocalDate(d.date));
  const shifts = isSchedule ? included.filter((d) => d.category === 'work') : [];
  const untimed = shifts.filter((d) => !d.start || !d.end);
  const addedKeys = new Set(diff?.added.map((a) => a.key) ?? []);
  const changedByKey = new Map(diff?.changed.map((ch) => [ch.after.key, ch.before]) ?? []);
  const removed = (diff?.removed ?? []).map((item) => ({ item, kept: kept.has(item.id) }));
  const changes = addedKeys.size + changedByKey.size + removed.filter((r) => !r.kept).length;
  const total = plan.create.length + plan.update.length + plan.remove.length;

  const nonSeries = included.filter((d) => !d.seriesId);
  const exams = nonSeries.filter((d) => d.isDeadline && EXAM.test(d.title));
  const series = groupSeries(effective);
  const firstDate = included.map((d) => d.date).sort()[0];
  const lastDate = included.map((d) => d.date).sort().at(-1);

  const thisWeekEnd = weekOf(today)[6]!;
  const nextWeek = shifts.length > 0 && shifts.every((d) => d.date > thisWeekEnd);

  // ---- Editing ----------------------------------------------------------------------
  const edit = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch, needsInput: false, include: patch.date !== undefined ? isLocalDate(patch.date) : d.include } : d)));
  const toggleEditing = (keys: string[]) => {
    if (keys.length === 0) return;
    feedback('select');
    setEditing((prev) => {
      const next = new Set(prev);
      const allOn = keys.every((k) => next.has(k));
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };
  const toggleKept = (id: string) => {
    feedback('select');
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** The nearest other shift with both times, to copy from. */
  const donorFor = (d: DatedDraft): DatedDraft | null => {
    const timed = shifts.filter((s) => s.key !== d.key && s.start && s.end);
    if (timed.length === 0) return null;
    const before = timed.filter((s) => s.date <= d.date).at(-1);
    return before ?? timed[0]!;
  };

  const timeEditor = (d: DatedDraft) => {
    const donor = !d.start || !d.end ? donorFor(d) : null;
    const field = (f: 'start' | 'end') => {
      const id = `${d.key}:${f}`;
      if (picker === id) {
        return (
          <ReviewPickerSlot key={f}>
            <TimeField date={d.date} time={d[f]} onChange={(v) => edit(d.key, { [f]: v || null })} />
          </ReviewPickerSlot>
        );
      }
      const v = d[f];
      return <ReviewPill key={f} label={v ? formatTime(v) : f === 'start' ? 'Start' : 'End'} muted={!v} accessibilityLabel={`${f === 'start' ? 'Start' : 'End'} time, ${v ? formatTime(v) : 'not set'}`} onPress={() => setPicker(id)} />;
    };
    return (
      <ReviewPillRow>
        {field('start')}
        {field('end')}
        {donor ? <TextButton label={`Same as ${weekdayLong(donor.date)}`} onPress={() => edit(d.key, { start: donor.start, end: donor.end })} /> : null}
      </ReviewPillRow>
    );
  };

  const datePicker = (d: Draft) => (
    <ReviewPickerSlot>
      <DateField date={d.date} time={d.start} onChange={(date) => edit(d.key, { date: date || null })} />
    </ReviewPickerSlot>
  );

  /** The trailing control of a dated-draft row: its date pill, or the amber ask. */
  const dateTrailing = (d: Draft, exam: boolean) => {
    if (!isLocalDate(d.date)) return picker === `${d.key}:date` ? datePicker(d) : <AskPill label="Add a date" tone="amber" onPress={() => setPicker(`${d.key}:date`)} />;
    if (d.kind === 'event' && !d.start && !exam) {
      return picker === `${d.key}:start` ? (
        <ReviewPickerSlot><TimeField date={d.date} time={d.start} onChange={(v) => edit(d.key, { start: v || null })} /></ReviewPickerSlot>
      ) : <AskPill label="Add a time" tone="amber" onPress={() => setPicker(`${d.key}:start`)} />;
    }
    return picker === `${d.key}:date` ? datePicker(d) : <ReviewPill label={`${weekdayShort(d.date)}, ${monthDay(d.date)}`} onPress={() => setPicker(`${d.key}:date`)} />;
  };

  // ---- Confirm and close ----------------------------------------------------------
  const close = () => {
    leaving.current = true;
    setPending(null);
    if (router.canGoBack()) router.back();
    else router.replace(useStore.getState().settings.onboarded ? '/plan' : '/onboarding');
  };

  const confirm = async () => {
    if (confirming.current || leaving.current) return;
    confirming.current = true;
    setAccessError(null);
    if (isUpdate) {
      setCheckingAccess(true);
      const beforeItems = useStore.getState().items;
      try {
        if (!(await requirePlus('schedule_update')) || leaving.current) return;
        if (beforeItems !== useStore.getState().items) {
          setAccessError('Your calendar changed. Review the updated shifts before saving.');
          return;
        }
      } catch (error) {
        setAccessError(purchaseErrorMessage(error));
        return;
      } finally {
        confirming.current = false;
        setCheckingAccess(false);
      }
    }
    leaving.current = true;
    const label = plan.schedule
      ? `Updated ${plan.schedule.employer} schedule`
      : `Added ${plan.create.length} ${plan.create.length === 1 ? 'item' : 'items'}`;
    const courseId = newId();
    const id = applyPlan(buildPlan(courseId) ?? plan, label, {
      source: pending.source,
      course: newCourse ? { id: courseId, ...newCourse, sourceId: null } : undefined,
    });
    feedback('success');
    const parts = [
      plan.create.length ? `${plan.create.length} added` : null,
      plan.update.length ? `${plan.update.length} updated` : null,
      plan.remove.length ? `${plan.remove.length} removed` : null,
      plan.skipped ? `${plan.skipped} already there` : null,
    ].filter(Boolean);
    showToast(parts.join(' · ') + '.', id);
    track('review_committed', { created: plan.create.length, updated: plan.update.length, removed: plan.remove.length, type: ex.detected_type });
    const { settings, setSettings } = useStore.getState();
    setPending(null);
    if (!settings.onboarded) {
      setSettings({ onboardingImportDone: true });
      if (router.canGoBack()) router.back();
      else router.replace('/onboarding');
      return;
    }
    if (!settings.remindersAsked) {
      setSettings({ remindersAsked: true });
      void requestNotifications().then((ok) => ok ? syncReminders() : undefined).catch(() => {});
    }
    router.dismissAll();
    router.replace('/plan');
  };

  // ---- Header copy ------------------------------------------------------------------
  const title = isSchedule
    ? `${sched.employer}${nextWeek ? ' · Next week' : ''}`
    : isSyllabus
      ? `${ex.course?.code ?? ex.course?.title ?? 'Course'} · Syllabus`
      : ex.detected_type === 'course_schedule' ? 'Class schedule' : 'Review';

  const intro = isUpdate && sched ? `${monthDay(sched.coversFrom)} to ${monthDay(sched.coversTo)} · Compared with what you have` : `From ${source} · Found`;

  const newHours = shifts.reduce((m, d) => m + minutesOf(d.start, d.end), 0);
  const oldHours = diff ? [...diff.changed.map((ch) => ch.before), ...diff.unchanged.map((u) => u.before), ...diff.removed].reduce((m, i) => m + minutesOf(i.start, i.end), 0) : 0;
  const seriesCount = included.filter((d) => d.seriesId).length;

  const big = isUpdate
    ? count(changes, 'change')
    : isSchedule
      ? count(shifts.length, 'shift')
      : nonSeries.length > 0 || seriesCount === 0
        ? count(nonSeries.length, 'date')
        : count(seriesCount, 'class', 'classes');

  let line: string;
  if (isSchedule && shifts.length > 0) {
    const first = shifts[0]!.date;
    const last = shifts.at(-1)!.date;
    const span = first === last ? `${weekdayShort(first)} ${dayNum(first)}` : `${weekdayShort(first)} ${dayNum(first)} to ${weekdayShort(last)} ${dayNum(last)}`;
    line = isUpdate
      ? `${count(shifts.length, 'shift')} · ${hours(newHours)}${oldHours === newHours ? ', as before' : `, ${newHours > oldHours ? 'up' : 'down'} from ${hours(oldHours, false)}`}`
      : `${span} · ${hours(newHours)}`;
  } else if (firstDate && lastDate) {
    const span = firstDate === lastDate ? `${weekdayLong(firstDate)}, ${monthDay(firstDate)}` : `${monthDay(firstDate)} to ${monthDay(lastDate)}`;
    const due = nonSeries.length - exams.length;
    const todos = nonSeries.filter((d) => d.kind === 'task' && !exams.includes(d)).length;
    const events = nonSeries.filter((d) => d.kind === 'event').length;
    const parts = isSyllabus
      ? [count(exams.length, 'exam'), count(due, 'due date')]
      : [exams.length ? count(exams.length, 'exam') : null, todos ? count(todos, 'to-do') : null, events ? count(events, 'event') : null, seriesCount ? count(seriesCount, 'class', 'classes') : null].filter(Boolean);
    line = parts.length ? `${span} · ${parts.join(', ')}` : span;
  } else {
    line = undated.length ? 'Nothing has a date yet' : 'Nothing to add';
  }

  const note = newCourse
    ? `Adds the course ${[newCourse.code, newCourse.title].filter(Boolean).join(' · ')}`
    : isUpdate ? 'Reminders move with the shifts.' : 'Nothing is saved until you confirm.';

  // ---- Chart -----------------------------------------------------------------------
  const weeks = isSchedule ? uniqueWeeks([...shifts.map((d) => d.date), ...removed.map((r) => r.item.date)]) : [];
  const dayFor = (date: string): WeekDay => {
    const mine = shifts.filter((d) => d.date === date);
    const gone = removed.filter((r) => r.item.date === date);
    const blocks: WeekBlock[] = [];
    let label: string | undefined;
    let labelTone: WeekDay['labelTone'];
    let unknown = false;
    for (const d of mine) {
      if (!d.start || !d.end) { unknown = true; continue; }
      const added = addedKeys.has(d.key);
      const before = changedByKey.get(d.key);
      if (before?.start && before.end) blocks.push({ id: `${d.key}-was`, start: before.start, end: before.end, tone: 'grey', outline: 'dashed' });
      blocks.push({ id: d.key, start: d.start, end: d.end, tone: isUpdate && added ? 'green' : 'ink' });
      if (!label) { label = compactRange(d.start, d.end); labelTone = isUpdate && added ? 'green' : before ? 'ink' : undefined; }
    }
    for (const r of gone) {
      if (!r.item.start || !r.item.end) continue;
      blocks.push({ id: r.item.id, start: r.item.start, end: r.item.end, tone: r.kept ? 'ink' : 'red', outline: r.kept ? undefined : 'solid' });
      if (!label) { label = compactRange(r.item.start, r.item.end); labelTone = r.kept ? undefined : 'red'; }
    }
    if (unknown) { label = 'time'; labelTone = 'amber'; }
    return { date, blocks, unknown, label: label ?? 'off', labelTone };
  };
  const chartCaption = isUpdate ? 'Green is new, orange outline is dropped, dashed is where a shift was.' : 'Each bar is 6 am to midnight. Tap a day to change it.';

  const marks: TermMark[] = nonSeries.map((d) => {
    const exam = exams.includes(d);
    return { id: d.key, date: d.date, kind: exam ? 'ring' : 'dot', label: exam ? (d.title.length <= 10 ? d.title : 'Exam') : undefined };
  });

  // ---- Rows ------------------------------------------------------------------------
  const shiftTitle = (d: DatedDraft) => `${weekdayLong(d.date)}'s shift`;
  const shiftWhen = (d: { date: string; start: string | null; end: string | null }) => `${weekdayShort(d.date)} ${dayNum(d.date)} · ${d.start && d.end ? longRange(d.start, d.end) : 'No time'}`;
  const overlapTitle = (d: DatedDraft): string | null => {
    if (!d.start || !d.end) return null;
    const probe: Pick<Item, 'id' | 'kind' | 'date' | 'start' | 'end' | 'done'> = { id: `draft:${d.key}`, kind: 'event', date: d.date, start: d.start, end: d.end, done: false };
    const hit = existing.find((i) => i.date === d.date && i.category !== 'work' && i.kind === 'event' && !i.done && conflictIds([probe, i]).has(i.id));
    return hit ? hit.title : null;
  };

  const shiftRows = () => {
    if (isUpdate) {
      const rows: { date: string; node: ReactNode }[] = [];
      for (const d of shifts) {
        const before = changedByKey.get(d.key);
        const added = addedKeys.has(d.key);
        const open = editing.has(d.key) || !d.start || !d.end;
        if (!added && !before && !editing.has(d.key)) continue;
        const overlap = overlapTitle(d);
        const sub = [before ? `Was ${before.start && before.end ? longRange(before.start, before.end) : 'untimed'}` : null, overlap ? `Overlaps ${overlap}` : null, !added && !before ? 'Same as before' : null].filter(Boolean).join(' · ');
        rows.push({
          date: d.date,
          node: (
            <ReviewRow key={d.key} glyph={<ReviewGlyph />} title={shiftWhen(d)} sub={sub || null} onPress={() => toggleEditing([d.key])}
              trailing={!d.start || !d.end ? <StatusPill label="Add a time" tone="amber" /> : before ? <StatusPill label="Moved" /> : added ? <StatusPill label="New" tone="green" /> : <StatusPill label="Same" />}
              below={open ? timeEditor(d) : null} />
          ),
        });
      }
      for (const r of removed) {
        rows.push({
          date: r.item.date,
          node: (
            <ReviewRow key={r.item.id} glyph={<ReviewGlyph color={r.kept ? c.inkPrimary : c.controlOutline} />} title={shiftWhen(r.item)} struck={!r.kept}
              sub={r.kept ? 'Stays as it is' : 'Not on the new schedule'}
              trailing={<>
                <TextButton label={r.kept ? 'Drop it' : 'Keep it'} onPress={() => toggleKept(r.item.id)} />
                <StatusPill label={r.kept ? 'Kept' : 'Dropped'} tone={r.kept ? 'grey' : 'redText'} />
              </>} />
          ),
        });
      }
      return rows.sort((a, b) => a.date.localeCompare(b.date)).map((r) => r.node);
    }
    const visible = listOpen ? shifts : shifts.filter((d) => !d.start || !d.end || editing.has(d.key));
    return visible.map((d) => {
      const needs = !d.start || !d.end;
      return (
        <ReviewRow key={d.key} glyph={<ReviewGlyph />} title={shiftTitle(d)} onPress={needs ? undefined : () => toggleEditing([d.key])}
          sub={needs ? `The ${docNoun} has no time for it` : `${weekdayShort(d.date)}, ${monthDay(d.date)} · ${longRange(d.start!, d.end!)}`}
          trailing={needs ? <StatusPill label="Add a time" tone="amber" /> : <StatusPill label={compactRange(d.start!, d.end!)} />}
          below={needs || editing.has(d.key) ? timeEditor(d) : null} />
      );
    });
  };

  const seriesRow = (s: Series) => {
    const end = seriesEnd[s.id];
    const finalExam = exams.filter((e) => e.date >= s.first.date).at(-1);
    const suggested = finalExam
      ? { date: finalExam.date, label: `${monthDay(finalExam.date)} · ${/final/i.test(finalExam.title) ? 'The final' : 'The last exam'}` }
      : { date: s.first.seriesUntil ?? s.last.date, label: `${monthDay(s.first.seriesUntil ?? s.last.date)} · 15 weeks` };
    const when = s.first.start && s.first.end ? `${s.weekdays} ${longRange(s.first.start, s.first.end)}` : s.weekdays;
    const unknown = s.first.seriesEndUnknown;
    return (
      <ReviewRow key={s.id} glyph={<ReviewGlyph />} title={`${s.first.title} · ${when}`}
        sub={unknown ? `The ${docNoun} doesn't say when the term ends` : `Until ${monthDay(end?.date ?? s.last.date)}`}
        trailing={unknown ? <StatusPill label="Until when?" tone="amber" /> : <StatusPill label={monthDay(end?.date ?? s.last.date)} />}
        below={unknown ? (
          <ReviewPillRow>
            <ReviewPill label={suggested.label} selected={end?.mode !== 'pick'} onPress={() => setSeriesEnd((prev) => ({ ...prev, [s.id]: { mode: 'suggested', date: suggested.date } }))} />
            {end?.mode === 'pick' ? (
              <ReviewPickerSlot>
                <DateField date={end.date} time={null} onChange={(date) => { if (isLocalDate(date)) setSeriesEnd((prev) => ({ ...prev, [s.id]: { mode: 'pick', date } })); }} />
              </ReviewPickerSlot>
            ) : (
              <ReviewPill label="Pick a date" onPress={() => { feedback('select'); setSeriesEnd((prev) => ({ ...prev, [s.id]: { mode: 'pick', date: end?.date ?? suggested.date } })); }} />
            )}
          </ReviewPillRow>
        ) : null} />
    );
  };

  const dateRow = (d: Draft) => {
    const exam = exams.includes(d as DatedDraft);
    const evidence = d.evidence.trim();
    const sub = (d.kind === 'event' || exam) && !d.start ? `Time not in the ${docNoun}` : evidence || d.courseCode || null;
    return <ReviewRow key={d.key} glyph={<ReviewGlyph kind={exam ? 'ring' : 'dot'} />} title={d.title} sub={sub} trailing={dateTrailing(d, exam)} />;
  };

  const undatedNoun = undated.length && undated.every((d) => d.icon === 'book') ? ['reading', 'readings'] : ['item', 'items'];
  const skippedLabel = undated.length ? ` · ${undated.length} ${undated.length === 1 ? undatedNoun[0] : undatedNoun[1]} without a date ${undated.length === 1 ? 'is' : 'are'} skipped` : '';

  const dateRows = () => {
    const visible = isSyllabus && !listOpen ? exams : nonSeries;
    return (
      <>
        {series.map(seriesRow)}
        {visible.map(dateRow)}
        {isSyllabus ? <ReviewDisclosure label={`All ${count(nonSeries.length, 'date')} as a list${skippedLabel}`} open={listOpen} onPress={() => { feedback('select'); setListOpen((v) => !v); }} /> : null}
        {!isSyllabus || listOpen ? undated.map(dateRow) : null}
      </>
    );
  };

  // ---- Footer ------------------------------------------------------------------------
  const cta = total === 0
    ? 'Close'
    : isUpdate
      ? nextWeek ? 'Update next week' : shifts.some((d) => d.date <= thisWeekEnd && d.date >= weekOf(today)[0]!) ? 'Update this week' : 'Update the schedule'
      : isSchedule
        ? `Add ${count(shifts.length, 'shift')}`
        : `Add ${plan.create.length + plan.update.length}${undated.length ? ` · Skip ${undated.length}` : ''}`;

  const footerNote = untimed.length
    ? `${untimed.map((d) => weekdayLong(d.date)).join(' and ')} ${untimed.length === 1 ? 'goes' : 'go'} in without a time. Plan will ask for ${untimed.length === 1 ? 'it' : 'them'}.`
    : isUpdate && diff.unchanged.length
      ? `${count(diff.unchanged.length, 'shift')} ${diff.unchanged.length === 1 ? 'is the same as before and stays as it is' : 'are the same as before and stay as they are'}.`
      : isSyllabus ? 'Deadlines get a reminder the evening before and the morning of.' : null;

  return (
    <Sheet
      title={title}
      onClose={close}
      footer={<>
        {isUpdate && !isPro && total > 0 ? <T token="caption" color={c.inkSecondary} style={{ textAlign: 'center' }}>Preview your changes here. Updating an existing schedule is included with Semli Plus.</T> : null}
        {accessError ? <T token="callout" color={c.conflict} accessibilityRole="alert">{accessError}</T> : null}
        {footerNote ? <T token="caption" color={c.inkSecondary} style={{ textAlign: 'center' }}>{footerNote}</T> : null}
        <Button label={checkingAccess ? 'Checking Plus…' : isUpdate && !isPro && total > 0 ? 'Update with Plus' : cta} disabled={checkingAccess} onPress={total === 0 ? close : () => void confirm()} />
      </>}>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <T token="callout" color={c.inkSecondary}>{intro}</T>
          <T token="displayXl" tabular>{big}</T>
          <T token="body" style={styles.line}>{line}</T>
          <T token="callout" color={c.inkSecondary}>{note}</T>
          {total === 0 ? (
            <T token="callout" color={c.inkSecondary} style={{ paddingTop: 8 }}>
              {included.length === 0 ? 'Nothing has a date yet. Add one to bring it in.' : 'Already in your plan. Nothing to add.'}
            </T>
          ) : null}
        </View>

        {isSchedule && weeks.length > 0 ? (
          <View style={styles.chart}>
            {weeks.map((week) => (
              <WeekChart key={week[0]} days={week.map(dayFor)} today={today} onSelect={(date) => toggleEditing(shifts.filter((d) => d.date === date).map((d) => d.key))} />
            ))}
            <T token="caption" color={c.inkSecondary}>{chartCaption}</T>
          </View>
        ) : null}
        {!isSchedule && firstDate && lastDate && included.length >= 2 ? (
          <View style={styles.chart}>
            <TermLine from={firstDate} to={lastDate} marks={marks} today={today} scale="months" />
          </View>
        ) : null}

        <Animated.View layout={layout} style={styles.rows}>
          {isUpdate ? <SectionTitle title="What changes" /> : null}
          {isSchedule ? shiftRows() : dateRows()}
          {isSchedule && !isUpdate && shifts.length > 0 ? (
            <ReviewDisclosure label={`All ${count(shifts.length, 'shift')} as a list`} open={listOpen} onPress={() => { feedback('select'); setListOpen((v) => !v); }} />
          ) : null}
        </Animated.View>
      </ScrollView>
    </Sheet>
  );
}

/** An amber ask ("Add a date") as a pressable status pill in the trailing slot of a row. */
function AskPill({ label, tone, onPress }: { label: string; tone: 'amber' | 'grey'; onPress: () => void }) {
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} haptic="select" onPress={onPress} scale={0.97}>
      <StatusPill label={label} tone={tone} />
    </Press>
  );
}

// ---- Helpers ----------------------------------------------------------------------------

type Dated = Draft & { date: string };
type Series = { id: string; first: Dated; last: Dated; weekdays: string; count: number };

/** Repeating classes grouped by series, in date order, with their weekday list ("Tue, Thu"). */
function groupSeries(drafts: Draft[]): Series[] {
  const by = new Map<string, Draft[]>();
  for (const d of drafts) if (d.seriesId && d.date) by.set(d.seriesId, [...(by.get(d.seriesId) ?? []), d]);
  return [...by.entries()].map(([id, list]) => {
    const dated = list.filter((d): d is Dated => !!d.date).sort((a, b) => a.date.localeCompare(b.date));
    const included = dated.filter((d) => d.include);
    const days = [...new Set(dated.map((d) => weekdayOf(d.date)))].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
    return { id, first: dated[0]!, last: (included.at(-1) ?? dated.at(-1))!, weekdays: days.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(', '), count: included.length };
  });
}

/** The default term end for each open-ended series: the last exam if there is one, else the fifteen-week guess. */
function suggestSeriesEnds(drafts: Draft[]): Record<string, SeriesEnd> {
  const out: Record<string, SeriesEnd> = {};
  const lastExam = drafts.filter((d) => !d.seriesId && d.isDeadline && isLocalDate(d.date) && EXAM.test(d.title)).map((d) => d.date!).sort().at(-1);
  for (const d of drafts) {
    if (!d.seriesId || !d.seriesEndUnknown || out[d.seriesId]) continue;
    const date = lastExam && d.date && lastExam >= d.date ? lastExam : d.seriesUntil;
    if (date) out[d.seriesId] = { mode: 'suggested', date };
  }
  return out;
}

function uniqueWeeks(dates: string[]): string[][] {
  const starts = [...new Set(dates.map((d) => weekOf(d)[0]!))].sort();
  return starts.map((s) => weekOf(s));
}

function minutesOf(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const m = toMinutes(end) - toMinutes(start);
  return m > 0 ? m : m + 24 * 60;
}

/** "36 hours", "7.5 hours", "1 hour"; without the unit when the sentence already has it. */
function hours(minutes: number, unit = true): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return unit ? `${h} ${h === 1 ? 'hour' : 'hours'}` : String(h);
}

function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function dayNum(date: string): string {
  return String(Number(date.slice(-2)));
}

/** "4:00 – 10:00 pm", "9:00 am – 3:00 pm". */
function longRange(start: string, end: string): string {
  const a = formatTime(start);
  const b = formatTime(end);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
}

/** "a screenshot", "a photo", "a PDF", "your message". */
function sourceNoun(source: string): string {
  const s = source.toLowerCase();
  if (s === 'message') return 'your message';
  if (s === 'screenshot') return 'a screenshot';
  if (s === 'photo') return 'a photo';
  if (s.endsWith('.pdf')) return 'a PDF';
  return source;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 16 },
  hero: { gap: 12 },
  line: { fontSize: 18, lineHeight: 26, letterSpacing: -0.2 },
  chart: { paddingTop: 24, gap: 8 },
  rows: { paddingTop: 20 },
});
