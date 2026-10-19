import { addDays, weekOf } from '@dayli/core';
import type { Course, Item, ScheduleVersion } from '@dayli/schema';

/** Marker on sample rows so the app can label and clear them. */
export const SAMPLE_SOURCE = 'sample';

type Seed = Omit<Item, 'id' | 'createdAt' | 'sourceId' | 'batchId' | 'courseId' | 'completedAt' | 'notes'> & {
  courseCode?: string;
};

/** One believable week for a working nursing student, placed around `today`. */
export function sampleWeek(today: string): { items: Item[]; courses: Course[]; schedules: ScheduleVersion[] } {
  const week = weekOf(today);
  const [mon, tue, wed, thu, fri, sat] = week as [string, string, string, string, string, string, string];
  const createdAt = new Date().toISOString();
  const courses: Course[] = [
    { id: 'sample-nur410', code: 'NUR 410', title: 'Adult Health Nursing', instructor: 'Dr. Okafor', sourceId: SAMPLE_SOURCE },
    { id: 'sample-nur420', code: 'NUR 420', title: 'Pharmacology II', instructor: 'Prof. Lindqvist', sourceId: SAMPLE_SOURCE },
  ];
  const seeds: Seed[] = [
    { kind: 'event', title: 'Adult Health lecture', category: 'school', icon: 'school', date: tue, start: '09:00', end: '10:15', isDeadline: false, done: false, employer: null, courseCode: 'NUR 410' },
    { kind: 'event', title: 'Adult Health lecture', category: 'school', icon: 'school', date: thu, start: '09:00', end: '10:15', isDeadline: false, done: false, employer: null, courseCode: 'NUR 410' },
    { kind: 'event', title: 'Clinical rotation', category: 'school', icon: 'heart', date: wed, start: '06:30', end: '14:30', isDeadline: false, done: false, employer: null, courseCode: 'NUR 410' },
    { kind: 'event', title: 'Pharm exam 2', category: 'school', icon: 'exam', date: fri, start: '09:00', end: '10:30', isDeadline: true, done: false, employer: null, courseCode: 'NUR 420' },
    { kind: 'event', title: 'Olive Garden shift', category: 'work', icon: 'work', date: tue, start: '16:00', end: '22:00', isDeadline: false, done: false, employer: 'Olive Garden' },
    { kind: 'event', title: 'Olive Garden shift', category: 'work', icon: 'work', date: thu, start: '16:00', end: '22:00', isDeadline: false, done: false, employer: 'Olive Garden' },
    { kind: 'event', title: 'Olive Garden shift', category: 'work', icon: 'work', date: sat, start: '11:00', end: '17:00', isDeadline: false, done: false, employer: 'Olive Garden' },
    { kind: 'event', title: 'Study · Pharm, 45 min', category: 'personal', icon: 'book', date: tue, start: '13:00', end: '13:45', isDeadline: false, done: false, employer: null },
    { kind: 'task', title: 'Pharm reading, ch. 12', category: 'school', icon: 'book', date: tue, start: null, end: null, isDeadline: false, done: false, employer: null, courseCode: 'NUR 420' },
    { kind: 'task', title: 'Buy scrubs', category: 'personal', icon: 'bag', date: wed, start: null, end: null, isDeadline: false, done: false, employer: null },
    { kind: 'task', title: 'Draft care plan', category: 'school', icon: 'pen', date: thu, start: null, end: null, isDeadline: true, done: false, employer: null, courseCode: 'NUR 410' },
    { kind: 'task', title: 'Submit med-surg quiz', category: 'school', icon: 'check', date: mon, start: null, end: null, isDeadline: true, done: true, employer: null, courseCode: 'NUR 410' },
  ];
  const items: Item[] = seeds.map((s, i) => {
    const { courseCode, ...rest } = s;
    return {
      ...rest,
      id: `sample-${i}`,
      createdAt,
      completedAt: s.done ? createdAt : null,
      notes: null,
      sourceId: SAMPLE_SOURCE,
      batchId: null,
      courseId: courses.find((c) => c.code === courseCode)?.id ?? null,
    };
  });
  const schedules: ScheduleVersion[] = [
    { id: 'sample-sched', employer: 'Olive Garden', coversFrom: mon, coversTo: addDays(mon, 6), sourceId: SAMPLE_SOURCE, createdAt },
  ];
  return { items, courses, schedules };
}
