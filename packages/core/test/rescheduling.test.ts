import type { Item } from '@dayli/schema';
import { describe, expect, it } from 'vitest';
import { eventLanes, isFlexibleEvent, suggestReschedule } from '../src';

const now = { date: '2026-10-19', time: '10:00' };
const make = (patch: Partial<Item>): Item => ({
  id: 'study', kind: 'event', title: 'Study group', category: 'school', icon: 'book',
  date: now.date, start: '19:00', end: '20:00', isDeadline: false, done: false,
  completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null,
  notes: null, createdAt: '2026-10-19T00:00:00Z', ...patch,
});
const study = make({});
const shift = make({ id: 'shift', title: 'Café shift', category: 'work', start: '16:00', end: '22:00', employer: 'Campus Café' });

describe('scheduling flexibility', () => {
  it('protects shifts, classes, exams and appointments by default', () => {
    for (const item of [shift, make({ title: 'Stats lecture' }), make({ title: 'Dentist appointment', category: 'personal' }), make({ title: 'Study skills exam', isDeadline: true }), make({ icon: 'exam' })]) {
      expect(isFlexibleEvent(item)).toBe(false);
    }
    expect(isFlexibleEvent(study)).toBe(true);
    expect(isFlexibleEvent(make({ title: 'Gym', category: 'personal' }))).toBe(true);
    expect(isFlexibleEvent(make({ title: 'Some plan' }))).toBe(false);
  });
  it('honors an explicit choice without making deadlines movable', () => {
    expect(isFlexibleEvent(make({ timeFlexibility: 'fixed' }))).toBe(false);
    expect(isFlexibleEvent(make({ title: 'Some plan', timeFlexibility: 'flexible' }))).toBe(true);
    expect(isFlexibleEvent(make({ isDeadline: true, timeFlexibility: 'flexible' }))).toBe(false);
  });
});

describe('rescheduling suggestions', () => {
  it('moves the study group before the shift, preserving duration and a buffer', () => {
    const items = [shift, study];
    expect(suggestReschedule(study, items, now)).toEqual({ date: now.date, start: '14:45', end: '15:45' });
    expect(suggestReschedule(shift, items, now)).toBeNull();
    expect(study.start).toBe('19:00');
    expect(shift.start).toBe('16:00');
  });
  it('checks every booking, including an overnight event from yesterday', () => {
    const previous = make({ id: 'night', date: '2026-10-18', start: '22:00', end: '15:00', category: 'work' });
    expect(suggestReschedule(study, [study, shift, previous], now)).toEqual({ date: '2026-10-20', start: '19:00', end: '20:00' });
  });
  it('finds a later slot if the nearest earlier slot is taken', () => {
    const earlyShift = { ...shift, end: '20:30' };
    const afternoon = make({ id: 'class', start: '10:00', end: '16:00', title: 'Lecture' });
    expect(suggestReschedule(study, [study, earlyShift, afternoon], now)).toEqual({ date: now.date, start: '20:45', end: '21:45' });
  });
  it('does not suggest the past, ongoing events, or completed events', () => {
    expect(suggestReschedule(study, [study, shift], { ...now, time: '19:00' })).toBeNull();
    expect(suggestReschedule(study, [study, shift], { date: '2026-10-20', time: '09:00' })).toBeNull();
    const done = { ...study, done: true };
    expect(suggestReschedule(done, [done, shift], now)).toBeNull();
  });
  it('returns no suggestion for uncertain availability or unknown duration', () => {
    expect(suggestReschedule(study, [study, shift, make({ id: 'untimed', start: null, end: null })], now))
      .toEqual({ date: '2026-10-20', start: '19:00', end: '20:00' });
    for (const item of [make({ start: null }), make({ end: null }), make({ start: '22:00', end: '02:00' })]) {
      expect(suggestReschedule(item, [item, shift], now)).toBeNull();
    }
  });
  it('offers nothing when there is no conflict or no room', () => {
    expect(suggestReschedule(study, [study], now)).toBeNull();
    const fullWeek = Array.from({ length: 7 }, (_, offset) => make({ id: `busy-${offset}`, date: `2026-10-${19 + offset}`, start: '08:00', end: '22:00', category: 'work' }));
    expect(suggestReschedule(study, [study, ...fullWeek], now)).toBeNull();
    expect(suggestReschedule({ ...study, timeFlexibility: 'fixed' }, [study, shift], now)).toBeNull();
  });
  it('ignores completed bookings and keeps non-hour durations', () => {
    const short = { ...study, end: '19:40' };
    expect(suggestReschedule(short, [short, shift, make({ id: 'done', start: '08:00', end: '16:00', done: true })], now))
      .toEqual({ date: now.date, start: '15:00', end: '15:40' });
  });
  it('changes only the selected occurrence of a repeating flexible event', () => {
    const occurrence = { ...study, seriesId: 'study-group' };
    const tomorrow = make({ id: 'tomorrow', date: '2026-10-20', seriesId: 'study-group' });
    expect(suggestReschedule(occurrence, [occurrence, shift, tomorrow], now)?.date).toBe(now.date);
    expect(tomorrow.start).toBe('19:00');
  });
  it('uses the next day when today has no remaining room, before the course exam', () => {
    const coursework = { ...study, courseId: 'stats' };
    const exam = make({ id: 'exam', courseId: 'stats', date: '2026-10-21', start: '09:00', end: '10:00', isDeadline: true });
    expect(suggestReschedule(coursework, [coursework, shift, exam], { ...now, time: '18:30' }))
      .toEqual({ date: '2026-10-20', start: '19:00', end: '20:00' });
  });
  it('never moves a study session beyond its next course deadline', () => {
    const coursework = { ...study, courseId: 'stats' };
    const exam = make({ id: 'exam', courseId: 'stats', date: '2026-10-20', start: '08:00', end: '09:00', isDeadline: true });
    expect(suggestReschedule(coursework, [coursework, shift, exam], { ...now, time: '18:30' })).toBeNull();
  });
});

describe('hourly layout', () => {
  it('keeps nested overlapping events in separate columns', () => {
    const later = make({ id: 'later', start: '20:00', end: '21:00' });
    const lanes = eventLanes([study, later, shift]);
    expect(lanes.get('shift')).toEqual({ lane: 0, lanes: 2 });
    expect(lanes.get('study')).toEqual({ lane: 1, lanes: 2 });
    expect(lanes.get('later')).toEqual({ lane: 1, lanes: 2 });
  });
  it('supports triple overlaps and resets after the group ends', () => {
    const third = make({ id: 'third', start: '19:30', end: '20:30' });
    const next = make({ id: 'next', start: '22:00', end: '23:00' });
    const lanes = eventLanes([shift, study, third, next]);
    expect(lanes.get('third')).toEqual({ lane: 2, lanes: 3 });
    expect(lanes.get('next')).toEqual({ lane: 0, lanes: 1 });
  });
});
