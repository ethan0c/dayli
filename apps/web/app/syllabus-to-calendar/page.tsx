import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { pageMetadata } from '@/lib/seo';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  path: '/syllabus-to-calendar',
  title: 'Syllabus to calendar',
  description: 'Turn a syllabus PDF into a semester plan with Semli. Review class times, exams, and assignment dates before adding them to your calendar.',
  shareTitle: 'Turn your syllabus into a semester plan',
});

export default function SyllabusPage() {
  return (
    <LandingPage
      path="/syllabus-to-calendar"
      name="Syllabus to calendar"
      title="Turn your syllabus into a semester plan."
      lede="Start with the PDF your professor posted. Semli finds class times, exams, and assignment dates for you to review. Confirm what to add, one course at a time."
      steps={[
        { title: 'Upload the PDF', body: 'From Canvas, email, or your downloads. Course schedules and registration screenshots work too.' },
        { title: 'Review the details', body: 'Check the dates and times, correct anything that needs attention, and fill in missing details.' },
        { title: 'Add it to your plan', body: 'Save the course, repeating class times, and deadlines together. You can edit them later or undo the import.' },
      ]}
      detail={
        <>
          <h2>What Semli reads from a syllabus</h2>
          <p>
            Semli looks for the course, meeting days and times, exams, quizzes, assignment deadlines, and dated reading.
            Repeating classes can run across the term, so you don’t have to add each lecture separately.
          </p>
          <h2>Give unclear dates a second look</h2>
          <p>
            A week number or a time without am or pm needs context. Check the proposed dates against your syllabus,
            especially when the original is incomplete. You can correct the details before adding them.
          </p>
          <h2>Set up one course at a time</h2>
          <p>
            Each syllabus PDF counts as one import, even if it has several pages. Start with the
            free plan’s {FREE_IMPORTS_PER_MONTH} imports a month, or use Plus for unlimited imports as you set up the semester.
          </p>
        </>
      }
      faqs={[
        { q: 'Which file types work?', a: 'PDF syllabi, and screenshots or photos (PNG, JPEG) of a course schedule or a registration page. Word documents can be exported to PDF first.' },
        { q: 'What if my syllabus only lists week numbers?', a: 'Week numbers need a term start date to make sense. Check the proposed dates carefully and correct any missing or unclear details before adding them.' },
        { q: 'Does it work with Canvas?', a: 'Yes, two ways. Upload the syllabus PDF from Canvas, or connect your Canvas calendar feed so assignments come in on their own. With Plus, Canvas stays in sync when professors change dates.' },
        { q: 'Can I undo an import?', a: 'Yes. Open You, then Your data, and find the import under Recent changes. Tap Undo next to it.' },
        { q: 'Is my syllabus stored?', a: 'Semli’s servers don’t save the uploaded file. The dates and course details you confirm live on your phone, with cloud backup if you create an account. See our privacy policy for how the AI provider handles requests.' },
      ]}
      related={[
        { href: '/assignment-tracker', label: 'Assignment tracker for college' },
        { href: '/work-and-school-schedule-planner', label: 'Work and school schedule planner' },
      ]}
    />
  );
}
