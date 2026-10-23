import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/work-and-school-schedule-planner',
  title: 'Work and school schedule planner',
  description: 'Put work shifts and classes in one plan with Semli. Import a schedule screenshot, spot overlaps, and compare schedule updates with Plus.',
  shareTitle: 'Work shifts and classes, one calendar',
  ownCard: true,
});

export default function WorkSchoolPage() {
  return (
    <LandingPage
      path="/work-and-school-schedule-planner"
      name="Work and school schedule planner"
      title="Work shifts and classes, one calendar."
      lede="Your work schedule changes. Your classes and deadlines keep coming. Put them in one plan so you can see where your shifts fit and catch overlaps early."
      steps={[
        { title: 'Send your schedule', body: 'Use a screenshot from your scheduling app, a group chat message, or a photo of the printed sheet.' },
        { title: 'Review the changes', body: 'With Plus, compare an updated schedule with your existing shifts. Choose which new, moved, or removed shifts to apply.' },
        { title: 'Spot the overlaps', body: 'See work and classes on the same timeline. Open an overlapping event to check what it conflicts with.' },
      ]}
      detail={
        <>
          <h2>Built for schedules that change every week</h2>
          <p>
            See which work weeks you have added and which schedules are still missing. When an updated schedule arrives,
            Plus can compare it with the shifts in your plan, so you can review the changes together.
          </p>
          <h2>Overnight shifts, double shifts, split shifts</h2>
          <p>
            Check each shift’s start and end time before adding it, including overnight shifts and days with more than one shift.
            If the source leaves out a time or am and pm, fill in the missing details during review.
          </p>
          <h2>See what needs to move</h2>
          <p>
            Overlapping events appear in red. Open the details to see which plans clash, then change a flexible event yourself.
            Plus can suggest another time while respecting events marked as fixed, such as a work shift.
          </p>
        </>
      }
      faqs={[
        { q: 'Which scheduling apps does it read?', a: 'You can upload screenshots from scheduling apps such as HotSchedules, 7shifts, When I Work, Deputy, Sling, or Homebase, a spreadsheet, or a photo of a printed schedule. You can also paste a text message. Check the shifts and fill in missing details before saving.' },
        { q: 'What if the schedule lists everyone on staff?', a: 'Tell Semli your name once. It picks out your rows and ignores the rest. If it cannot tell, it asks before saving anything.' },
        { q: 'How do I update shifts I’ve already added?', a: 'With Plus, import the updated schedule and review the comparison. Semli proposes new, changed, or removed shifts for you to confirm. You can also edit any shift by hand on the free plan.' },
        { q: 'Can it connect to my employer’s scheduling system directly?', a: 'Not currently. Send a screenshot, photo, or message instead; you don’t need to connect your employer’s account.' },
      ]}
      related={[
        { href: '/syllabus-to-calendar', label: 'Syllabus to calendar' },
        { href: '/assignment-tracker', label: 'Assignment tracker for college' },
      ]}
    />
  );
}
