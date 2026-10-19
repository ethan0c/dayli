import type { IconName } from '@dayli/schema';

import type { IconKey } from '@/components/Icon';

export type Role = 'student' | 'working' | 'both';

export interface Chip {
  key: string;
  label: string;
  icon: IconKey;
}

export interface DemoRow {
  title: string;
  kind: 'event' | 'task';
  cat: 'work' | 'school' | 'personal';
  icon: IconKey;
  chip?: string;
}

export interface SampleCourse {
  code: string;
  title: string;
  instructor: string;
}

/** Everything the onboarding and the sample week need to feel like it was made for this person. */
export interface Profile {
  id: string;
  label: string;
  icon: IconKey;
  /** Extra week chips beyond the shared ones (Classes, A job, Sports, Clubs, Pure chaos). */
  chips: Chip[];
  demo: { text: string; rows: DemoRow[] };
  sample: {
    courses: [SampleCourse, SampleCourse];
    lecture: string;
    /** A recurring non-lecture commitment: clinical, lab, studio, practicum. */
    fieldwork: { title: string; icon: IconName; start: string; end: string } | null;
    exam: string;
    reading: string;
    draft: string;
    done: string;
    errand: string;
  };
}

const workShift: DemoRow = { title: 'Work shift', kind: 'event', cat: 'work', icon: 'work', chip: 'Fri · 4–10 pm' };

export const MAJORS: Profile[] = [
  {
    id: 'nursing',
    label: 'Nursing & health',
    icon: 'heart',
    chips: [{ key: 'clinicals', label: 'Clinicals', icon: 'heart' }],
    demo: {
      text: 'I work Fri 4–10, have a pharm exam Monday at 9, and need to buy scrubs Wednesday',
      rows: [{ title: 'Buy scrubs', kind: 'task', cat: 'personal', icon: 'bag' }, workShift, { title: 'Pharm exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'NUR 410', title: 'Adult Health Nursing', instructor: 'Dr. Okafor' },
        { code: 'NUR 420', title: 'Pharmacology II', instructor: 'Prof. Lindqvist' },
      ],
      lecture: 'Adult Health lecture',
      fieldwork: { title: 'Clinical rotation', icon: 'heart', start: '06:30', end: '14:30' },
      exam: 'Pharm exam 2',
      reading: 'Pharm reading, ch. 12',
      draft: 'Draft care plan',
      done: 'Submit med-surg quiz',
      errand: 'Buy scrubs',
    },
  },
  {
    id: 'engineering',
    label: 'Engineering',
    icon: 'exam',
    chips: [{ key: 'labs', label: 'Labs', icon: 'exam' }],
    demo: {
      text: 'I work Fri 4–10, statics exam Monday at 9, and the lab report is due Wednesday',
      rows: [{ title: 'Lab report', kind: 'task', cat: 'school', icon: 'pen' }, workShift, { title: 'Statics exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'ME 201', title: 'Statics', instructor: 'Dr. Haddad' },
        { code: 'MATH 251', title: 'Calculus III', instructor: 'Prof. Novak' },
      ],
      lecture: 'Statics lecture',
      fieldwork: { title: 'Materials lab', icon: 'exam', start: '14:00', end: '17:00' },
      exam: 'Calc III exam 2',
      reading: 'Calc problem set 6',
      draft: 'Lab report draft',
      done: 'Submit statics homework',
      errand: 'Pick up safety glasses',
    },
  },
  {
    id: 'cs',
    label: 'Computer science',
    icon: 'check',
    chips: [{ key: 'labs', label: 'Labs', icon: 'exam' }, { key: 'hackathons', label: 'Hackathons', icon: 'sparkle' }],
    demo: {
      text: 'I work Fri 4–10, data structures midterm Monday at 9, and PA2 is due Wednesday at 11:59',
      rows: [{ title: 'PA2 due', kind: 'task', cat: 'school', icon: 'pen' }, workShift, { title: 'Data structures midterm', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'CS 2110', title: 'Data Structures', instructor: 'Dr. Reyes' },
        { code: 'MATH 2400', title: 'Discrete Math', instructor: 'Prof. Chen' },
      ],
      lecture: 'Data Structures lecture',
      fieldwork: { title: 'Discussion section', icon: 'school', start: '15:00', end: '15:50' },
      exam: 'Discrete midterm',
      reading: 'Read ch. 4, hash tables',
      draft: 'Start PA3',
      done: 'Submit PA2',
      errand: 'Return library book',
    },
  },
  {
    id: 'business',
    label: 'Business',
    icon: 'work',
    chips: [{ key: 'groups', label: 'Group projects', icon: 'calendar' }],
    demo: {
      text: 'I work Fri 4–10, accounting exam Monday at 9, and the case write-up is due Wednesday',
      rows: [{ title: 'Case write-up', kind: 'task', cat: 'school', icon: 'pen' }, workShift, { title: 'Accounting exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'ACCT 201', title: 'Financial Accounting', instructor: 'Prof. Delgado' },
        { code: 'MKTG 301', title: 'Marketing Principles', instructor: 'Dr. Osei' },
      ],
      lecture: 'Accounting lecture',
      fieldwork: { title: 'Group project meeting', icon: 'calendar', start: '15:00', end: '16:00' },
      exam: 'Marketing exam 2',
      reading: 'Marketing case, ch. 7',
      draft: 'Case write-up draft',
      done: 'Submit accounting problem set',
      errand: 'Print the pitch deck',
    },
  },
  {
    id: 'science',
    label: 'Sciences',
    icon: 'exam',
    chips: [{ key: 'labs', label: 'Labs', icon: 'exam' }, { key: 'research', label: 'Research', icon: 'book' }],
    demo: {
      text: 'I work Fri 4–10, orgo exam Monday at 9, and need to print the lab manual Wednesday',
      rows: [{ title: 'Print lab manual', kind: 'task', cat: 'personal', icon: 'file' }, workShift, { title: 'Orgo exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'CHEM 212', title: 'Organic Chemistry', instructor: 'Dr. Morales' },
        { code: 'BIO 240', title: 'Genetics', instructor: 'Prof. Adeyemi' },
      ],
      lecture: 'Orgo lecture',
      fieldwork: { title: 'Orgo lab', icon: 'exam', start: '13:00', end: '16:00' },
      exam: 'Genetics exam 2',
      reading: 'Genetics reading, ch. 9',
      draft: 'Lab write-up',
      done: 'Submit pre-lab quiz',
      errand: 'Buy lab notebook',
    },
  },
  {
    id: 'arts',
    label: 'Arts & design',
    icon: 'pen',
    chips: [{ key: 'studio', label: 'Studio', icon: 'pen' }, { key: 'rehearsals', label: 'Rehearsals', icon: 'calendar' }],
    demo: {
      text: 'I work Fri 4–10, have a critique Monday at 9, and need to pick up canvas Wednesday',
      rows: [{ title: 'Pick up canvas', kind: 'task', cat: 'personal', icon: 'bag' }, workShift, { title: 'Critique', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'ART 230', title: 'Painting II', instructor: 'Prof. Lindgren' },
        { code: 'ARTH 110', title: 'Art History Survey', instructor: 'Dr. Mbeki' },
      ],
      lecture: 'Art history lecture',
      fieldwork: { title: 'Painting studio', icon: 'pen', start: '13:00', end: '16:00' },
      exam: 'Art history midterm',
      reading: 'Art history reading, ch. 5',
      draft: 'Finish piece for critique',
      done: 'Submit artist statement',
      errand: 'Pick up canvas',
    },
  },
  {
    id: 'humanities',
    label: 'Humanities & social sciences',
    icon: 'book',
    chips: [{ key: 'seminars', label: 'Seminars', icon: 'book' }],
    demo: {
      text: 'I work Fri 4–10, psych midterm Monday at 9, and the reading response is due Wednesday',
      rows: [{ title: 'Reading response', kind: 'task', cat: 'school', icon: 'pen' }, workShift, { title: 'Psych midterm', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'PSYC 101', title: 'Intro to Psychology', instructor: 'Dr. Whitfield' },
        { code: 'HIST 210', title: 'Modern World History', instructor: 'Prof. Sato' },
      ],
      lecture: 'Psych lecture',
      fieldwork: { title: 'History seminar', icon: 'book', start: '14:00', end: '15:15' },
      exam: 'History midterm',
      reading: 'History reading, ch. 11',
      draft: 'Essay outline',
      done: 'Submit reading response',
      errand: 'Return library books',
    },
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'school',
    chips: [{ key: 'practicum', label: 'Practicum', icon: 'school' }],
    demo: {
      text: 'I work Fri 4–10, practicum observation Monday at 9, and the lesson plan is due Wednesday',
      rows: [{ title: 'Lesson plan', kind: 'task', cat: 'school', icon: 'pen' }, workShift, { title: 'Practicum observation', kind: 'event', cat: 'school', icon: 'school', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'EDUC 310', title: 'Classroom Management', instructor: 'Dr. Patel' },
        { code: 'EDUC 325', title: 'Literacy Methods', instructor: 'Prof. Brennan' },
      ],
      lecture: 'Classroom Management lecture',
      fieldwork: { title: 'Practicum placement', icon: 'school', start: '08:00', end: '12:00' },
      exam: 'Literacy Methods exam',
      reading: 'Literacy reading, ch. 6',
      draft: 'Lesson plan draft',
      done: 'Submit observation log',
      errand: 'Laminate flashcards',
    },
  },
  {
    id: 'other',
    label: 'Something else',
    icon: 'sparkle',
    chips: [{ key: 'labs', label: 'Labs', icon: 'exam' }],
    demo: {
      text: 'I work Fri 4–10, have an exam Monday at 9, and need to return a library book Wednesday',
      rows: [{ title: 'Return library book', kind: 'task', cat: 'personal', icon: 'book' }, workShift, { title: 'Exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' }],
    },
    sample: {
      courses: [
        { code: 'STAT 201', title: 'Intro to Statistics', instructor: 'Dr. Alvarez' },
        { code: 'ENGL 120', title: 'College Writing', instructor: 'Prof. Kim' },
      ],
      lecture: 'Stats lecture',
      fieldwork: null,
      exam: 'Stats exam 2',
      reading: 'Stats reading, ch. 4',
      draft: 'Essay draft',
      done: 'Submit writing journal',
      errand: 'Return library book',
    },
  },
];

/** For people who are not students: no courses, same shape otherwise. */
export const WORKING: Profile = {
  id: 'working',
  label: 'Working',
  icon: 'work',
  chips: [{ key: 'gym', label: 'Gym', icon: 'heart' }, { key: 'family', label: 'Family', icon: 'heart' }],
  demo: {
    text: 'I work Fri 4–10 and Sat 11–5, have the dentist Monday at 9, and need to pick up a package Wednesday',
    rows: [{ title: 'Pick up package', kind: 'task', cat: 'personal', icon: 'bag' }, workShift, { title: 'Dentist', kind: 'event', cat: 'personal', icon: 'heart', chip: 'Mon · 9 am' }],
  },
  sample: {
    courses: [
      { code: '', title: '', instructor: '' },
      { code: '', title: '', instructor: '' },
    ],
    lecture: '',
    fieldwork: null,
    exam: '',
    reading: '',
    draft: '',
    done: '',
    errand: 'Pick up package',
  },
};

/** Chips everyone sees, before the profile adds its own. */
export const BASE_CHIPS: Chip[] = [
  { key: 'classes', label: 'Classes', icon: 'school' },
  { key: 'work', label: 'A job', icon: 'work' },
  { key: 'sports', label: 'Sports', icon: 'calendar' },
  { key: 'clubs', label: 'Clubs', icon: 'sparkle' },
  { key: 'chaos', label: 'Pure chaos', icon: 'sparkle' },
];

export function profileFor(major: string | null | undefined, student: boolean): Profile {
  if (!student) return WORKING;
  return MAJORS.find((m) => m.id === major) ?? MAJORS[MAJORS.length - 1]!;
}

export function chipsFor(profile: Profile, student: boolean): Chip[] {
  const base = student ? BASE_CHIPS : BASE_CHIPS.filter((c) => c.key !== 'classes');
  const extra = profile.chips.filter((c) => !base.some((b) => b.key === c.key));
  // Keep "Pure chaos" last; it is the punchline.
  const chaos = base.find((c) => c.key === 'chaos')!;
  return [...base.filter((c) => c.key !== 'chaos'), ...extra, chaos];
}
