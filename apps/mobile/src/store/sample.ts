import { addDays, weekOf } from '@dayli/core';
import type { Course, Extraction, Item, ScheduleVersion } from '@dayli/schema';

/** Marker on sample rows so the app can label and clear them. */
export const SAMPLE_SOURCE = 'sample';
const EMPLOYER = 'Campus Café';

type Seed = Omit<Item, 'id' | 'createdAt' | 'sourceId' | 'batchId' | 'courseId' | 'completedAt' | 'notes'> & {
  course?: 0 | 1 | 2 | 3;
  seriesId?: string;
};

/**
 * A full student week placed around `today`: four courses with lectures that repeat, a lab,
 * office hours, Campus Café shifts, a study group that overlaps a shift, the gym, readings
 * and posts due today, an exam on Friday. Deadlines stay spread out so no heavy-week moment
 * takes over Today. The same content the screenshots show.
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
        { id: 'sample-course-2', code: 'BIOL 110', title: 'General Biology', instructor: 'Dr. Chen', sourceId: pdf },
        { id: 'sample-course-3', code: 'ENGL 102', title: 'Composition II', instructor: 'Prof. Reyes', sourceId: pdf },
      ]
    : [];

  const work = (date: string, start: string, end: string): Seed => ({
    kind: 'event', title: 'Café shift', category: 'work', icon: 'work', date, start, end, isDeadline: false, done: false, employer: EMPLOYER,
  });
  const series = (title: string, course: 0 | 1 | 2 | 3, start: string, end: string, days: string[]): Seed[] =>
    [0, 7, 14].flatMap((w) => days.map((d) => addDays(d, w))).map((date) => ({
      kind: 'event', title, category: 'school', icon: 'school', date, start, end, isDeadline: false, done: date < today, employer: null, course, seriesId: `sample-series-${course}`,
    }));
  const school: Seed[] = student
    ? [
        ...series('Stats lecture', 0, '09:00', '10:15', [mon, wed]),
        ...series('Psych lecture', 1, '11:00', '12:15', [tue, thu]),
        ...series('Bio lecture', 2, '10:30', '11:20', [mon, wed, fri]),
        ...series('Composition seminar', 3, '13:30', '14:45', [mon, wed]),
        { kind: 'event', title: 'Bio lab', category: 'school', icon: 'school', date: tue, start: '13:00', end: '15:30', isDeadline: false, done: false, employer: null, course: 2 },
        { kind: 'event', title: 'Office hours, Dr. Mehta', category: 'school', icon: 'school', date: wed, start: '15:00', end: '15:45', isDeadline: false, done: false, employer: null, course: 0 },
        { kind: 'event', title: 'Study group', category: 'school', icon: 'book', date: mon, start: '19:00', end: '20:00', isDeadline: false, done: false, employer: null, course: 0 },
        { kind: 'event', title: 'Stats exam 2', category: 'school', icon: 'exam', date: fri, start: '09:00', end: '10:30', isDeadline: true, done: false, employer: null, course: 0 },
        { kind: 'task', title: 'Read chapter 6', category: 'school', icon: 'book', date: mon, start: null, end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Quiz 2', category: 'school', icon: 'exam', date: addDays(fri, 7), start: '09:00', end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Midterm paper', category: 'school', icon: 'pen', date: addDays(fri, 21), start: null, end: null, isDeadline: true, done: false, employer: null, course: 1 },
        { kind: 'task', title: 'Problem set 4', category: 'school', icon: 'pen', date: addDays(fri, 14), start: null, end: null, isDeadline: true, done: false, employer: null, course: 0 },
        { kind: 'task', title: 'Quiz 1', category: 'school', icon: 'check', date: mon, start: null, end: null, isDeadline: true, done: true, employer: null, course: 1 },
        { kind: 'task', title: 'Pre-lab worksheet', category: 'school', icon: 'pen', date: today, start: null, end: null, isDeadline: true, done: false, employer: null, course: 2 },
        { kind: 'task', title: 'Discussion post 4', category: 'school', icon: 'pen', date: today, start: '23:59', end: null, isDeadline: true, done: false, employer: null, course: 3 },
        { kind: 'task', title: 'Watch lecture 9 recording', category: 'school', icon: 'book', date: today, start: null, end: null, isDeadline: false, done: true, employer: null, course: 1 },
        { kind: 'task', title: 'Essay outline', category: 'school', icon: 'pen', date: thu, start: '23:59', end: null, isDeadline: true, done: false, employer: null, course: 3 },
        { kind: 'task', title: 'Lab report 3', category: 'school', icon: 'pen', date: addDays(thu, 7), start: '13:00', end: null, isDeadline: true, done: false, employer: null, course: 2 },
        { kind: 'task', title: 'Essay draft', category: 'school', icon: 'pen', date: addDays(thu, 14), start: '23:59', end: null, isDeadline: true, done: false, employer: null, course: 3 },
        { kind: 'task', title: 'Read chapters 7 and 8', category: 'school', icon: 'book', date: addDays(mon, 7), start: null, end: null, isDeadline: false, done: false, employer: null, course: 1 },
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
    { kind: 'task', title: 'Submit timesheet', category: 'work', icon: 'work', date: today, start: null, end: null, isDeadline: true, done: false, employer: EMPLOYER },
    { kind: 'task', title: 'Pick up groceries', category: 'personal', icon: 'bag', date: today, start: null, end: null, isDeadline: false, done: false, employer: null },
    ...(student
      ? ([
          { kind: 'event', title: 'Gym', category: 'personal', icon: 'heart', date: tue, start: '07:00', end: '08:00', isDeadline: false, done: tue <= today, employer: null },
          { kind: 'event', title: 'Gym', category: 'personal', icon: 'heart', date: thu, start: '07:00', end: '08:00', isDeadline: false, done: thu <= today, employer: null },
          { kind: 'event', title: 'Pre-nursing club', category: 'personal', icon: 'heart', date: wed, start: '18:30', end: '19:30', isDeadline: false, done: false, employer: null },
          { kind: 'task', title: 'Call mom', category: 'personal', icon: 'heart', date: sun, start: null, end: null, isDeadline: false, done: false, employer: null },
        ] satisfies Seed[])
      : []),
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

/**
 * Development only: a Campus Café schedule as the model would read it, for the review screen
 * without calling the API. `next` is next week with one shift missing its time; `update` is
 * this week with one shift moved, one new and one dropped, so the review shows the changes.
 */
export function sampleScheduleExtraction(today: string, mode: 'next' | 'update' = 'next'): Extraction {
  const next = weekOf(mode === 'next' ? addDays(today, 7) : today) as [string, string, string, string, string, string, string];
  const shift = (date: string, start: string | null, end: string | null) => ({
    kind: 'event' as const, title: 'Café shift', category: 'work' as const, date, start, end, is_deadline: false,
    repeat_weekdays: [], repeat_until: null, course_code: null, evidence: `${date} ${start ?? ''}–${end ?? ''}`,
    confidence: start ? 0.97 : 0.6, question: start ? null : 'What time is this shift?',
  });
  return {
    detected_type: 'work_schedule', employer: EMPLOYER, course: null, covers_from: next[0], covers_to: next[6],
    items: mode === 'next'
      ? [shift(next[0], '16:00', '22:00'), shift(next[1], '16:00', '22:00'), shift(next[3], '16:00', '22:00'), shift(next[4], null, null), shift(next[5], '09:00', '15:00'), shift(next[6], '11:00', '17:00')]
      : [shift(next[0], '16:00', '22:00'), shift(next[1], '16:00', '22:00'), shift(next[2], '17:00', '21:00'), shift(next[3], '17:00', '23:00'), shift(next[6], '11:00', '17:00')],
  };
}

/**
 * Development only: this week's Campus Café schedule read again after the manager changed
 * it: Thursday moved later, Saturday dropped, Wednesday added. Shows the New / Changed /
 * Removed review without calling the API.
 */
export function sampleScheduleUpdate(today: string): Extraction {
  const [mon, tue, wed, thu, , , sun] = weekOf(today) as [string, string, string, string, string, string, string];
  const shift = (date: string, start: string, end: string) => ({
    kind: 'event' as const, title: 'Café shift', category: 'work' as const, date, start, end, is_deadline: false,
    repeat_weekdays: [], repeat_until: null, course_code: null, evidence: `${date} ${start}–${end}`, confidence: 0.97, question: null,
  });
  return {
    detected_type: 'work_schedule', employer: EMPLOYER, course: null, covers_from: mon, covers_to: sun,
    items: [shift(mon, '16:00', '22:00'), shift(tue, '16:00', '22:00'), shift(wed, '17:00', '21:00'), shift(thu, '17:00', '23:00'), shift(sun, '11:00', '17:00')],
  };
}

/**
 * Development only: a Pharmacology syllabus for the nursing persona, read as the model would
 * return it: the class meeting as one repeating event, then every exam, quiz and assignment
 * through the end of term. Shows the syllabus review without calling the API.
 */
export function sampleSyllabusExtraction(today: string): Extraction {
  const [mon] = weekOf(today) as [string];
  const tue = addDays(mon, 1);
  const end = addDays(mon, 56);
  const on = (date: string, title: string, kind: 'event' | 'task', start: string | null, end: string | null, evidence: string, question: string | null = null) => ({
    kind, title, category: 'school' as const, date, start, end, is_deadline: true, repeat_weekdays: [] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
    repeat_until: null, course_code: 'NURS 210', evidence, confidence: start ? 0.96 : 0.7, question,
  });
  return {
    detected_type: 'syllabus', employer: null, course: { code: 'NURS 210', title: 'Pharmacology I', instructor: 'Dr. Okafor' }, covers_from: null, covers_to: null,
    items: [
      { kind: 'event', title: 'Pharmacology lecture', category: 'school', date: tue, start: '10:30', end: '11:45', is_deadline: false, repeat_weekdays: ['tue', 'thu'], repeat_until: end, course_code: 'NURS 210', evidence: 'Class meets Tuesday and Thursday 10:30–11:45, Nursing 204', confidence: 0.98, question: null },
      on(addDays(tue, 7), 'Drug card set 1', 'task', '23:59', null, 'Drug card set 1 due 11:59 pm'),
      on(addDays(tue, 14), 'Exam 1: Pharmacokinetics', 'event', '10:30', '11:45', 'Exam 1 (Units 1–3), in class'),
      on(addDays(tue, 16), 'Quiz: Dosage calculations', 'task', null, null, 'Dosage calc quiz, week 6', 'What time is this quiz?'),
      on(addDays(tue, 21), 'Drug card set 2', 'task', '23:59', null, 'Drug card set 2 due 11:59 pm'),
      on(addDays(tue, 28), 'Care plan: cardiac meds', 'task', '23:59', null, 'Care plan 1 due Sunday 11:59 pm'),
      on(addDays(tue, 35), 'Exam 2: Cardiovascular', 'event', '10:30', '11:45', 'Exam 2 (Units 4–6), in class'),
      on(addDays(tue, 42), 'Drug card set 3', 'task', '23:59', null, 'Drug card set 3 due 11:59 pm'),
      on(addDays(tue, 49), 'Care plan: antibiotics', 'task', '23:59', null, 'Care plan 2 due Sunday 11:59 pm'),
      on(addDays(tue, 58), 'Final exam', 'event', '08:00', '10:00', 'Cumulative final, finals week, 8:00–10:00 am'),
    ],
  };
}
