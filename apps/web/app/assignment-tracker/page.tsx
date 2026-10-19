import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Assignment tracker',
  description:
    'Every due date from every class in one list, with reminders the day before and the morning of. Semli builds it from your syllabi and messages so you never type an assignment in by hand.',
  alternates: { canonical: '/assignment-tracker' },
  openGraph: { title: 'Never miss an assignment again', url: '/assignment-tracker' },
};

export default function AssignmentTrackerPage() {
  return (
    <LandingPage
      path="/assignment-tracker"
      name="Assignment tracker"
      title="Never miss an assignment again."
      lede="Eighty-three percent of the students we surveyed had missed or nearly missed an assignment because it got buried. Semli keeps every due date from every class in one list, ranked by what matters today, with reminders that arrive before it is too late."
      steps={[
        { title: 'Fill it without typing', body: 'Syllabi, a screenshot of the Canvas to-do list, a professor’s email, or a text like “paper due Friday.”' },
        { title: 'See what matters today', body: 'Today shows what is due and what is coming in the next two weeks. Done items sink out of the way.' },
        { title: 'Get reminded in time', body: 'The day before and the morning of, by default. Change it per item or turn on quiet hours.' },
      ]}
      detail={
        <>
          <h2>One list, every class</h2>
          <p>
            Each assignment keeps its course, so you can look at one class on the School tab or everything at once on Today.
            Exams and quizzes are marked as deadlines and get a heads-up card when the days before them are already full of
            shifts, labs, or clinicals.
          </p>
          <h2>Assignments posted outside Canvas</h2>
          <p>
            Three in four students told us assignments show up outside the LMS: in a PDF syllabus, a Google Doc, a textbook
            site, or an email. Those are exactly the ones that slip. Semli reads any of them from a screenshot or a pasted
            message, which is why the list stays complete.
          </p>
          <h2>Nothing is saved until you confirm</h2>
          <p>
            Every item Semli reads comes with the exact text it came from. You check the list, fix a date if needed, and confirm.
            That review takes a few seconds and means the tracker is one you can trust.
          </p>
        </>
      }
      faqs={[
        { q: 'Is the assignment tracker free?', a: 'Yes. The calendar, to-dos, reminders, and repeating classes are free with no time limit. Reading syllabi and screenshots uses AI imports; the free plan includes three a month.' },
        { q: 'Does it sync with Canvas?', a: 'Not yet. Today you import a screenshot or the syllabus PDF. Direct Canvas sync is on the Plus roadmap.' },
        { q: 'Can I add an assignment by hand?', a: 'Yes, and it never counts as an import. Tap the plus button and type it.' },
        { q: 'What happens when a due date changes?', a: 'Import the update (a new screenshot or the professor’s message). Semli matches it to the existing assignment and shows you the change instead of creating a duplicate.' },
      ]}
      related={[
        { href: '/syllabus-to-calendar', label: 'Syllabus to calendar' },
        { href: '/work-and-school-schedule-planner', label: 'Work and school schedule planner' },
      ]}
    />
  );
}
