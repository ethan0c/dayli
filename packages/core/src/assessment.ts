/**
 * What kind of test an item is, read from its title: an exam (midterm, final, exam) or a
 * quiz (quiz, test), or not a test at all. One answer for the import's icon, the charts'
 * rings and the term's end, so a ring means the same thing on every screen.
 */
export type Assessment = 'exam' | 'quiz';

const EXAM = /\b(exams?|midterms?|mid-terms?|finals?)\b/i;
const QUIZ = /\b(quiz(zes)?|tests?)\b/i;
/** Things named after a test that are not one: the final project, the exam review, a practice quiz. */
const NOT = /\bfinal\s+(project|paper|essay|draft|report|presentation|portfolio|submission)s?\b|\b(review|prep|study|practice|registration|sign[- ]?up)\b/i;

export function assessment(title: string): Assessment | null {
  if (NOT.test(title)) return null;
  if (EXAM.test(title)) return 'exam';
  if (QUIZ.test(title)) return 'quiz';
  return null;
}
