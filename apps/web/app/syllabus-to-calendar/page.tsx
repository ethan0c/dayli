import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Syllabus to calendar',
  description:
    'Upload a syllabus PDF and get every exam, due date, and class time on your calendar in about a minute. Semli reads it, shows you what it found, and saves nothing until you confirm.',
  alternates: { canonical: '/syllabus-to-calendar' },
  openGraph: { title: 'Turn a syllabus into every deadline', url: '/syllabus-to-calendar' },
};

export default function SyllabusPage() {
  return (
    <LandingPage
      path="/syllabus-to-calendar"
      name="Syllabus to calendar"
      title="Turn a syllabus into every deadline."
      lede="Upload the PDF your professor posted. Semli finds the exams, due dates, and class meeting times and puts them on your calendar, one course at a time. Nothing is saved until you confirm it."
      steps={[
        { title: 'Upload the PDF', body: 'From Canvas, email, or your downloads. Course schedules and registration screenshots work too.' },
        { title: 'Check what it found', body: 'Every date comes with the line it was read from. Anything unclear gets a question, not a guess.' },
        { title: 'Confirm, once', body: 'The course, its meeting times for the whole term, and every deadline land in one tap. Undo if you change your mind.' },
      ]}
      detail={
        <>
          <h2>What Semli reads from a syllabus</h2>
          <p>
            The course code and title, the instructor, meeting days and times (expanded across the term, so a Tuesday/Thursday
            lecture shows up every Tuesday and Thursday until the last week), exams and quizzes, assignment due dates, project
            milestones, and reading that has a date on it. Grading breakdowns are kept with the course for later.
          </p>
          <h2>What it does not do</h2>
          <p>
            It does not invent dates. If a syllabus says &ldquo;Exam 2: week 9&rdquo; with no calendar date, Semli asks you which
            week rather than picking one. If two syllabi describe the same course, the second import updates the first instead of
            doubling every deadline.
          </p>
          <h2>Five syllabi, one afternoon</h2>
          <p>
            Most students carry four to six courses. Each syllabus is one import, so a full semester is five or six imports. The
            free plan includes {FREE_IMPORTS_PER_MONTH} a month; Plus removes the limit for semester setup week.
          </p>
        </>
      }
      faqs={[
        { q: 'Which file types work?', a: 'PDF syllabi, and screenshots or photos (PNG, JPEG) of a course schedule or a registration page. Word documents can be exported to PDF first.' },
        { q: 'What if my syllabus only lists week numbers?', a: 'Semli asks for the first day of term and expands weeks into dates. If it is unsure, it marks the date and asks you to confirm before anything is saved.' },
        { q: 'Does it work with Canvas?', a: 'Yes, two ways. Upload the syllabus PDF from Canvas, or connect your Canvas calendar feed so assignments come in on their own. With Plus, Canvas stays in sync when professors change dates.' },
        { q: 'Can I undo an import?', a: 'Yes. Every import is one undoable change. Open You, then Your data, and tap Undo next to it.' },
        { q: 'Is my syllabus stored?', a: 'The file is used to read the dates and is not kept on our servers. The dates and course details live on your phone.' },
      ]}
      related={[
        { href: '/assignment-tracker', label: 'Assignment tracker for college' },
        { href: '/work-and-school-schedule-planner', label: 'Work and school schedule planner' },
      ]}
    />
  );
}
