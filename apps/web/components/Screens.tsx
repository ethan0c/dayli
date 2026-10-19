import { DayBar, GlassToggle, HourView, MapHead, MapRow, Phone, Pill, PrimaryPill, Row, Screen, ShotCard, Tabs, TermLine, Toast, WeekChart, mock as m } from './Mock';

/*
 * The screens drawn on the landing page. Each is the real app screen reduced to
 * the pieces in Mock.tsx; the copy mirrors what the app shows.
 */

const SHIFT = { top: 56, height: 33 } as const; // 4–10 pm
const SAT = { top: 17, height: 33 } as const; // 9 am–3 pm
const SUN = { top: 28, height: 33 } as const; // 11 am–5 pm

/** Today: the countdown, the day as a bar, the list with status pills, the five-tab bar. Drawn into the real PhoneFrame. */
export function TodayScreen() {
  return (
    <Screen>
      <div className={m.padLg}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className={m.caption}>Monday, October 19 · next in</div>
            <div className={m.big}>2h 14m</div>
            <div style={{ fontSize: 14, paddingTop: 4 }}>Café shift · 4–10 pm</div>
            <div className={m.caption}>Campus Café · Work</div>
          </div>
          <GlassToggle />
        </div>
        <DayBar
          style={{ marginTop: 18 }}
          now={39}
          segments={[
            { left: 12, width: 6, tone: 'green' },
            { left: 50, width: 30 },
            { left: 62, width: 8, tone: 'red' },
          ]}
        />
        <div className={m.title} style={{ marginTop: 20, paddingBottom: 4 }}>
          On your list
        </div>
        <Row lead="ring" title="Read chapter 6" sub="PSYC 101" trailing={<Pill tone="red">Due today</Pill>} />
        <Row lead="ring" title="Return library book" sub="Personal" trailing={<Pill>Any time</Pill>} />
        <Row lead="dot" title="Study group" sub="STAT 200 · overlaps your shift" trailing={<Pill tone="redText">7:00 pm</Pill>} />
        <Row lead="done" muted title="Stats lecture" sub="9–10:15 am" trailing={<Pill tone="green">Done</Pill>} last />
      </div>
      <Tabs active="Today" />
    </Screen>
  );
}

const STEP = { width: 300 } as const;

/** Add: the composer and the recent screenshots strip. */
export function AddPhone() {
  return (
    <Phone {...STEP} label="Add: the composer and your recent screenshots">
      <div className={m.padMd}>
        <div className={m.display}>What&apos;s coming up?</div>
        <div className={m.composer} style={{ marginTop: 14 }}>
          Paste a message, or add a screenshot or PDF
        </div>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 500 }} className={m.muted}>
          Recent screenshots
        </div>
        <div className={m.shots} style={{ marginTop: 8 }}>
          <div className={m.shot}>
            <ShotCard small />
          </div>
          <div className={m.shot}>
            <ShotCard small />
          </div>
          <div className={m.shot} />
        </div>
      </div>
      <Tabs active="Today" />
    </Phone>
  );
}

const REVIEW_WEEK = [
  { label: 'Mon', blocks: [SHIFT] },
  { label: 'Tue', blocks: [SHIFT] },
  { label: 'Wed' },
  { label: 'Thu', blocks: [SHIFT] },
  { label: 'Fri', unknown: true },
  { label: 'Sat', blocks: [SAT] },
  { label: 'Sun', blocks: [SUN] },
];

/** Review: the big number, the week chart, one row for the shift that needs a time. */
export function ReviewPhone() {
  return (
    <Phone {...STEP} label="Review: 7 shifts as a week chart, Friday asks for a time">
      <div className={m.padMd}>
        <div className={m.caption}>Found</div>
        <div className={m.bigMd}>7 shifts</div>
        <WeekChart days={REVIEW_WEEK} height={70} style={{ marginTop: 18 }} />
        <Row lead="dot" title="Friday's shift" sub="No time in the screenshot" trailing={<Pill tone="amber">Add a time</Pill>} style={{ marginTop: 14 }} />
        <PrimaryPill style={{ marginTop: 28 }}>Add 7 shifts</PrimaryPill>
      </div>
    </Phone>
  );
}

/** Plan right after adding: the rows are in and the toast offers Undo. */
export function AddedPhone() {
  return (
    <Phone {...STEP} label="Plan with the Undo toast: 7 shifts added to this week">
      <div className={m.padMd}>
        <div className={m.title}>Friday</div>
        <Row lead="ring" title="Stats exam 2" sub="STAT 200 · deadline" trailing={<Pill>9:00 am</Pill>} />
        <Row lead="dot" title="Café shift" sub="Campus Café · no time yet" trailing={<Pill tone="amber">Add a time</Pill>} />
        <Toast text="7 shifts added to this week." style={{ marginTop: 150 }} />
      </div>
      <Tabs active="Plan" />
    </Phone>
  );
}

const PAIR = { width: 240 } as const;

const PLAN_WEEK = [
  { label: 'Mon', blocks: [{ top: 17, height: 7, tone: 'green' as const }, SHIFT, { top: 72, height: 5, tone: 'red' as const, half: true }] },
  { label: 'Tue', blocks: [{ top: 6, height: 44 }] },
  { label: 'Wed', blocks: [{ top: 17, height: 7 }, SHIFT] },
  { label: 'Thu' },
  { label: 'Fri', blocks: [SHIFT] },
  { label: 'Sat', blocks: [SAT] },
  { label: 'Sun', blocks: [SUN] },
];

/** Plan: the week chart as the header, then today's rows. */
export function PlanPhone() {
  return (
    <Phone {...PAIR} label="Plan: the week as seven bars, then today's rows">
      <div className={m.pad}>
        <div className={m.titleSm}>Week of October 19</div>
        <WeekChart days={PLAN_WEEK} style={{ marginTop: 14 }} />
        <div className={m.titleSm} style={{ marginTop: 18 }}>
          Today
        </div>
        <Row lead="done" muted title="Stats lecture" trailing={<Pill tone="green">Done</Pill>} />
        <Row lead="dot" title="Café shift" trailing={<Pill>4:00 pm</Pill>} />
      </div>
      <Tabs active="Plan" />
    </Phone>
  );
}

/** Today by the hour: the same day opened up behind the toggle. */
export function HourPhone() {
  return (
    <Phone {...PAIR} label="Today by the hour: the lecture done, the shift at 4, the study group overlapping it">
      <div className={m.pad}>
        <div className={m.caption}>next in</div>
        <div className={m.bigSm}>2h 14m</div>
        <HourView />
      </div>
    </Phone>
  );
}

const DIFF_WEEK = [
  { label: 'Mon', blocks: [{ top: 61, height: 22, outline: 'dashed' as const }, SHIFT] },
  { label: 'Tue', blocks: [SHIFT] },
  { label: 'Wed' },
  { label: 'Thu', blocks: [{ ...SHIFT, tone: 'green' as const }] },
  { label: 'Fri', blocks: [SHIFT] },
  { label: 'Sat', blocks: [{ ...SAT, tone: 'green' as const }] },
  { label: 'Sun', blocks: [{ ...SUN, outline: 'dropped' as const }] },
];

/** The update review: next week compared with what is already in the plan. */
export function DiffPhone() {
  return (
    <Phone width={300} label="Next week compared with your plan: 4 changes, one moved, two new, one dropped">
      <div className={m.padLg}>
        <div className={m.caption}>Oct 26 to Nov 1 · compared with what you have</div>
        <div className={m.big}>4 changes</div>
        <WeekChart days={DIFF_WEEK} style={{ marginTop: 18 }} />
        <div className={m.title} style={{ marginTop: 18 }}>
          What changes
        </div>
        <Row lead="dot" title="Mon 26 · 4:00 – 10:00 pm" sub="Was 5:00 – 9:00 pm" trailing={<Pill>Moved</Pill>} />
        <Row lead="dot" title="Thu 29 · 4:00 – 10:00 pm" trailing={<Pill tone="green">New</Pill>} />
        <Row
          lead="dotGrey"
          muted
          strike
          title="Sun 1 · 11:00 am – 5:00 pm"
          last
          trailing={
            <>
              <span className={m.textLink}>Keep it</span>
              <Pill tone="redText">Dropped</Pill>
            </>
          }
        />
      </div>
    </Phone>
  );
}

const SYL_MARKS = [
  { left: 4, kind: 'dot' as const },
  { left: 17, kind: 'ring' as const },
  { left: 31, kind: 'dot' as const },
  { left: 44, kind: 'dot' as const },
  { left: 58, kind: 'ring' as const },
  { left: 73, kind: 'dot' as const },
  { left: 85, kind: 'dot' as const },
  { left: 100, kind: 'ring' as const },
];

/** Syllabus review: the term as one line, the class pattern that asks "Until when?". */
export function SyllabusPhone() {
  return (
    <Phone {...PAIR} label="Syllabus review: 14 dates on one line from October to December, the class asks until when">
      <div className={m.pad}>
        <div className={m.caption}>PSYC 101 · from a PDF</div>
        <div className={m.bigSm}>14 dates</div>
        <TermLine
          style={{ marginTop: 20 }}
          months={[
            { label: 'Oct', left: 0 },
            { label: 'Nov', left: 21 },
            { label: 'Dec', left: 79 },
          ]}
          marks={SYL_MARKS}
        />
        <Row lead="dot" title="Class · Tue, Thu 11:00" sub="No end date in the syllabus" trailing={<Pill tone="amber">Until when?</Pill>} style={{ marginTop: 20 }} />
        <Row lead="ringSm" title="Exam 1" trailing={<Pill>Fri, Oct 30</Pill>} />
      </div>
    </Phone>
  );
}

/** School: the four-week map, one line per course. */
export function SchoolPhone() {
  return (
    <Phone {...PAIR} label="School: four courses on a four-week map, next due in 2 days">
      <div className={m.pad}>
        <div className={m.caption}>4 courses · next due in</div>
        <div className={m.bigSm}>2 days</div>
        <div className={m.titleSm} style={{ marginTop: 20 }}>
          Next four weeks
        </div>
        <MapHead cols={['Oct 19', '26', 'Nov 2', '9']} />
        <MapRow code="STAT" marks={[{ left: 14, kind: 'ring' }, { left: 64, kind: 'dot' }]} />
        <MapRow code="PSYC" marks={[{ left: 0, kind: 'dot', tone: 'red' }, { left: 39, kind: 'dot' }, { left: 89, kind: 'dot' }]} />
        <MapRow code="NURS" marks={[{ left: 28, kind: 'dot' }, { left: 79, kind: 'ring' }]} />
        <MapRow code="BIOL" marks={[{ left: 86, kind: 'dot' }]} />
      </div>
      <Tabs active="School" />
    </Phone>
  );
}
