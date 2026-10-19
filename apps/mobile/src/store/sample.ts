import { addDays, weekOf } from '@dayli/core';
import type { Course, Item, ScheduleVersion } from '@dayli/schema';

/** Marker on sample rows so the app can label and clear them. */
export const SAMPLE_SOURCE = 'sample';
const EMPLOYER = 'Campus Café';

type Seed = Omit<Item, 'id' | 'createdAt' | 'sourceId' | 'batchId' | 'courseId' | 'completedAt' | 'notes'> & {
  course?: 0 | 1;
  seriesId?: string;
};

/**
 * The week from the design boards, placed around `today`: Campus Café shifts, a Stats
 * lecture that repeats, a study group that overlaps a shift, a reading due today, an
 * exam on Friday. The same content the screenshots and the canvas show.
 *
 * `preview` marks the rows as real imports (a screenshot and a syllabus) so they show in
 * every list; the default marks them as the sample, which the lists hide.
 */
export function sampleWeek(today: string, options: { student?: boolean; preview?: boolean } = {}): { items: Item[]; courses: Course[]; schedules: ScheduleVersion[] } {
  const { student = true, preview = false } = options;
  const week = weekOf(today);
  const [mon, tue, wed, thu, fri, sat, sun] = week as [string, string, string, string, string, string, string];
  const createdAt = new Date().toISOString();
  const shots = preview ? 'Screenshot' : SAMPLE_SOURCE;
  const pdf = preview ? 'syllabus.pdf' : SAMPLE_SOURCE;
  const courses: Course[] = student
    ? [
        { id: 'sample-course-0', code: 'STAT 200', title: 'Statistics', instructor: 'Dr. Mehta', sourceId: pdf },
        { id: 'sample-course-1', code: 'PSYC 101', title: 'Intro to Psychology', instructor: 'Dr. Alvarez', sourceId: pdf },
      ]
    : [];

  const work = (date: string, start: string, end: string): Seed => ({
    kind: 'event', title: 'Café shift', category: 'work', icon: 'work', date, start, end, isDeadline: false, done: false, employer: EMPLOYER,
  });
  const lecture = (date: string): Seed => ({
    kind: 'event', title: 'Stats lecture', category: 'school', icon: 'school', date, start: '09:00', end: '10:15', isDeadline: false, done: date < today, employer: null, course: 0, seriesId: 'sample-series-stats',
  });
  const school: Seed[] = student
    ? [
        lecture(mon), lecture(wed), lecture(addDays(mon, 7)), lecture(addDays(wed, 7)), lecture(addDays(mon, 14)), lecture(addDays(wed, 14)),
        { kind: 'event', title: 'Study group', category: 'school', icon: 'book', date: mon, start: '19:00', end: '20:00', isDeadline: false, done: false, employer: null, course: 0 },
        { kind: 'event', title: 'Stats exam 2', category: 'school', icon: 'exam', date: fri, start: '09:00', end: '10:30', isDeadline: true, done: false, employer: null, course: 0 },
        { kind: 'task', title: 'Read chapter 6', category: 'school', icon: 'book', date: mon, start: null, end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Quiz 2', category: 'school', icon: 'exam', date: addDays(fri, 7), start: '09:00', end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Midterm paper', category: 'school', icon: 'pen', date: addDays(fri, 21), start: null, end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Problem set 4', category: 'school', icon: 'pen', date: addDays(fri, 14), start: null, end: null, isDeadline: true, done: false, employer: null, course: 0 },
        { kind: 'task', title: 'Quiz 1', category: 'school', icon: 'check', date: mon, start: null, end: null, isDeadline: true, done: true, employer: null, course: 1 },
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
    work(sat, '09:00', '15:00'),
    work(sun, '11:00', '17:00'),
    { kind: 'task', title: 'Return library book', category: 'personal', icon: 'bag', date: mon, start: null, end: null, isDeadline: false, done: false, employer: null },
  ];
  const items: Item[] = seeds.map((s, i) => {
    const { course, seriesId, ...rest } = s;
    return {
      ...rest,
      id: `sample-${i}`,
      createdAt,
      completedAt: s.done ? createdAt : null,
      notes: null,
      sourceId: s.category === 'work' ? shots : s.category === 'school' ? pdf : preview ? 'Message' : SAMPLE_SOURCE,
      batchId: null,
      courseId: course === undefined ? null : (courses[course]?.id ?? null),
      seriesId: seriesId ?? null,
    };
  });
  const schedules: ScheduleVersion[] = [
    { id: 'sample-sched', employer: EMPLOYER, coversFrom: mon, coversTo: addDays(mon, 6), sourceId: shots, createdAt },
  ];
  return { items, courses, schedules };
}
