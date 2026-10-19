import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Work and school schedule planner',
  description:
    'Screenshot your work schedule when it is posted. Semli adds the shifts to your class calendar, shows what changed from last week, and flags clashes with class, clinicals, and exams.',
  alternates: { canonical: '/work-and-school-schedule-planner' },
  openGraph: { title: 'Work shifts and classes, one calendar', url: '/work-and-school-schedule-planner' },
};

export default function WorkSchoolPage() {
  return (
    <LandingPage
      path="/work-and-school-schedule-planner"
      name="Work and school schedule planner"
      title="Work shifts and classes, one calendar."
      lede="Your schedule drops on Thursday for a week that starts Monday. Screenshot it, and Semli puts the shifts next to your classes, tells you what changed since last week, and warns you when a shift lands on a lab or the night before an exam."
      steps={[
        { title: 'Screenshot the schedule', body: 'HotSchedules, 7shifts, a group chat, or a photo of the printed sheet on the wall. Any of them.' },
        { title: 'See what changed', body: 'New, changed, and removed shifts, each one named. Confirm them together or one at a time. Nothing is doubled up.' },
        { title: 'Catch the clashes', body: 'A shift over a clinical, or two closing shifts before a Monday exam, shows up as a heads-up on Today.' },
      ]}
      detail={
        <>
          <h2>Built for schedules that change every week</h2>
          <p>
            Most planners assume you know your week in advance. Semli assumes you don&rsquo;t. Weeks that have no schedule yet
            show as &ldquo;not posted&rdquo; rather than free, so you never plan study time into hours you will end up working.
            When the new schedule arrives, Semli compares it to what it already has and shows the difference.
          </p>
          <h2>Overnight shifts, double shifts, split shifts</h2>
          <p>
            A shift that ends after midnight stays on the day it started. Two shifts on the same day are matched separately, so
            moving the evening one does not touch the morning one. Times are read the way they are written on the sheet, 4&ndash;10
            becomes 4:00 to 10:00 pm.
          </p>
          <h2>What the heads-up looks like</h2>
          <p>
            &ldquo;Olive Garden shift overlaps Clinical rotation on Oct 22.&rdquo; Or: &ldquo;Only 2.5 free hours before Pharm exam
            2. Want to look at the week?&rdquo; Semli points at the problem early and leaves the decision to you.
          </p>
        </>
      }
      faqs={[
        { q: 'Which scheduling apps does it read?', a: 'Any of them, because it reads the screenshot, not the app. HotSchedules, 7shifts, When I Work, Deputy, Sling, Homebase, a spreadsheet, a text message, or a photo of a printed sheet.' },
        { q: 'What if the schedule lists everyone on staff?', a: 'Tell Semli your name once. It picks out your rows and ignores the rest. If it cannot tell, it asks before saving anything.' },
        { q: 'Do changed shifts create duplicates?', a: 'No. A new import of the same week is compared with the existing one. Changed shifts are updated in place, removed shifts are removed, and you see the list before anything happens.' },
        { q: 'Can it connect to my employer’s scheduling system directly?', a: 'Not yet. Screenshots cover every system today, and direct connections are planned for the ones that offer access.' },
      ]}
      related={[
        { href: '/syllabus-to-calendar', label: 'Syllabus to calendar' },
        { href: '/assignment-tracker', label: 'Assignment tracker for college' },
      ]}
    />
  );
}
