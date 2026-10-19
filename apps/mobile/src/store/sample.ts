import { addDays, weekOf } from '@dayli/core';
import type { Course, Item, ScheduleVersion } from '@dayli/schema';

import type { Profile } from '@/lib/majors';

/** Marker on sample rows so the app can label and clear them. */
export const SAMPLE_SOURCE = 'sample';
const EMPLOYER = 'Campus Café';

type Seed = Omit<Item, 'id' | 'createdAt' | 'sourceId' | 'batchId' | 'courseId' | 'completedAt' | 'notes'> & {
  course?: 0 | 1;
};

/**
 * One believable week for this person, placed around `today`: a working
 * student in their field, or a working non-student. Titles come from the profile.
 */
export function sampleWeek(today: string, profile: Profile, student: boolean): { items: Item[]; courses: Course[]; schedules: ScheduleVersion[] } {
  const week = weekOf(today);
  const [mon, tue, wed, thu, fri, sat] = week as [string, string, string, string, string, string, string];
  const createdAt = new Date().toISOString();
  const p = profile.sample;
  const courses: Course[] = student
    ? p.courses.map((k, i) => ({ id: `sample-course-${i}`, code: k.code, title: k.title, instructor: k.instructor, sourceId: SAMPLE_SOURCE }))
    : [];

  const work = (date: string, start: string, end: string): Seed => ({
    kind: 'event', title: `${EMPLOYER} shift`, category: 'work', icon: 'work', date, start, end, isDeadline: false, done: false, employer: EMPLOYER,
  });
  const school: Seed[] = student
    ? [
        { kind: 'event', title: p.lecture, category: 'school', icon: 'school', date: tue, start: '09:00', end: '10:15', isDeadline: false, done: false, employer: null, course: 0 },
        { kind: 'event', title: p.lecture, category: 'school', icon: 'school', date: thu, start: '09:00', end: '10:15', isDeadline: false, done: false, employer: null, course: 0 },
        ...(p.fieldwork
          ? [{ kind: 'event', title: p.fieldwork.title, category: 'school', icon: p.fieldwork.icon, date: wed, start: p.fieldwork.start, end: p.fieldwork.end, isDeadline: false, done: false, employer: null, course: 0 } satisfies Seed]
          : []),
        { kind: 'event', title: p.exam, category: 'school', icon: 'exam', date: fri, start: '09:00', end: '10:30', isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'event', title: 'Study block, 45 min', category: 'personal', icon: 'book', date: tue, start: '13:00', end: '13:45', isDeadline: false, done: false, employer: null },
        { kind: 'task', title: p.reading, category: 'school', icon: 'book', date: tue, start: null, end: null, isDeadline: false, done: false, employer: null, course: 1 },
        { kind: 'task', title: p.draft, category: 'school', icon: 'pen', date: thu, start: null, end: null, isDeadline: true, done: false, employer: null, course: 0 },
        { kind: 'task', title: p.done, category: 'school', icon: 'check', date: mon, start: null, end: null, isDeadline: true, done: true, employer: null, course: 0 },
      ]
    : [
        { kind: 'event', title: 'Gym', category: 'personal', icon: 'heart', date: tue, start: '07:00', end: '08:00', isDeadline: false, done: false, employer: null },
        { kind: 'event', title: 'Dentist', category: 'personal', icon: 'heart', date: fri, start: '09:00', end: '09:45', isDeadline: false, done: false, employer: null },
        { kind: 'task', title: 'Renew car registration', category: 'personal', icon: 'pen', date: thu, start: null, end: null, isDeadline: true, done: false, employer: null },
        { kind: 'task', title: 'Pay phone bill', category: 'personal', icon: 'check', date: mon, start: null, end: null, isDeadline: true, done: true, employer: null },
      ];
  const seeds: Seed[] = [
    ...school,
    work(mon, '16:00', '22:00'),
    work(tue, '16:00', '22:00'),
    work(thu, '16:00', '22:00'),
    work(sat, '11:00', '17:00'),
    { kind: 'task', title: p.errand, category: 'personal', icon: 'bag', date: wed, start: null, end: null, isDeadline: false, done: false, employer: null },
    { kind: 'task', title: 'Text Sam back', category: 'personal', icon: 'check', date: mon, start: null, end: null, isDeadline: false, done: false, employer: null },
  ];
  const items: Item[] = seeds.map((s, i) => {
    const { course, ...rest } = s;
    return {
      ...rest,
      id: `sample-${i}`,
      createdAt,
      completedAt: s.done ? createdAt : null,
      notes: null,
      sourceId: SAMPLE_SOURCE,
      batchId: null,
      courseId: course === undefined ? null : (courses[course]?.id ?? null),
    };
  });
  const schedules: ScheduleVersion[] = [
    { id: 'sample-sched', employer: EMPLOYER, coversFrom: mon, coversTo: addDays(mon, 6), sourceId: SAMPLE_SOURCE, createdAt },
  ];
  return { items, courses, schedules };
}
