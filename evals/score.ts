import type { ExtractedItem, Extraction } from '@dayli/schema';
import type { EvalCase, ExpectedItem } from './schema';

const TIME_FIELDS = ['date', 'start', 'end'] as const;
const OTHER_FIELDS = ['kind', 'category', 'is_deadline', 'repeat_weekdays', 'repeat_until', 'course_code'] as const;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const identifies = (expected: ExpectedItem, item: ExtractedItem) => new RegExp(expected.match, 'i').test(item.title);
const timeMatches = (expected: ExpectedItem, item: ExtractedItem) => TIME_FIELDS.filter((key) => same(expected[key], item[key])).length;

/** Maximum-weight, one-to-one assignment. Titles identify items; times break ties
 * between repeated names. Missing and duplicate items cannot reuse a match. */
function assign(expected: ExpectedItem[], actual: ExtractedItem[]): number[] {
  const n = expected.length;
  const m = actual.length + n; // One dummy column per expected item allows missing items.
  const u = Array(n + 1).fill(0) as number[];
  const v = Array(m + 1).fill(0) as number[];
  const p = Array(m + 1).fill(0) as number[];
  const way = Array(m + 1).fill(0) as number[];
  const cost = (i: number, j: number) => j > actual.length ? 0
    : identifies(expected[i - 1]!, actual[j - 1]!) ? -10_000 - timeMatches(expected[i - 1]!, actual[j - 1]!) : 10_000;
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = Array(m + 1).fill(Infinity) as number[];
    const used = Array(m + 1).fill(false) as boolean[];
    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = cost(i0, j) - u[i0]! - v[j]!;
        if (cur < minv[j]!) { minv[j] = cur; way[j] = j0; }
        if (minv[j]! < delta) { delta = minv[j]!; j1 = j; }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) { u[p[j]!]! += delta; v[j]! -= delta; }
        else minv[j]! -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]!; p[j0] = p[j1]!; j0 = j1; } while (j0 !== 0);
  }
  const out = Array(n).fill(-1) as number[];
  for (let j = 1; j <= actual.length; j++) if (p[j] && cost(p[j]!, j) < 0) out[p[j]! - 1] = j - 1;
  return out;
}

export function score(test: EvalCase, actual: Extraction | null) {
  const expected = test.expected.items;
  const items = actual?.items ?? [];
  const assignment = assign(expected, items);
  const matched = new Set(assignment.filter((index) => index >= 0));
  let timeCorrect = 0;
  let otherCorrect = 0;
  let otherTotal = 0;
  const failures: string[] = [];
  expected.forEach((wanted, index) => {
    const found = items[assignment[index]!];
    if (!found) failures.push(`Missing: ${wanted.match}`);
    for (const key of TIME_FIELDS) {
      if (found && same(wanted[key], found[key])) timeCorrect++;
      else failures.push(`${wanted.match}.${key}: expected ${JSON.stringify(wanted[key])}, got ${JSON.stringify(found?.[key])}`);
    }
    for (const key of OTHER_FIELDS) if (key in wanted) {
      otherTotal++;
      if (found && same(wanted[key], found[key])) otherCorrect++;
      else failures.push(`${wanted.match}.${key}: expected ${JSON.stringify(wanted[key])}, got ${JSON.stringify(found?.[key])}`);
    }
    if (wanted.needsQuestion !== undefined) {
      otherTotal++;
      if (found && Boolean(found.question?.trim()) === wanted.needsQuestion) otherCorrect++;
      else failures.push(`${wanted.match}: expected needsQuestion=${wanted.needsQuestion}`);
    }
  });
  for (const [key, value] of Object.entries(test.expected.metadata)) {
    otherTotal++;
    if (actual && same(value, actual[key as keyof Extraction])) otherCorrect++;
    else failures.push(`metadata.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual?.[key as keyof Extraction])}`);
  }
  const extra = items.filter((_, index) => !matched.has(index));
  if (test.expected.complete) extra.forEach((item) => failures.push(`Extra: ${item.title} (${item.date} ${item.start})`));
  return {
    successful: actual !== null,
    expected: expected.length, actual: items.length, matched: matched.size,
    timeCorrect, timeTotal: expected.length * 3, otherCorrect, otherTotal,
    // Extra output on partially annotated cases is ungraded, never claimed to be hallucination-free.
    extra: test.expected.complete ? extra.length : null,
    questions: items.filter((item) => item.question).length,
    failures,
  };
}

export type Score = ReturnType<typeof score>;
export function aggregate(scores: Score[]) {
  const sum = (key: 'expected' | 'actual' | 'matched' | 'timeCorrect' | 'timeTotal' | 'otherCorrect' | 'otherTotal' | 'questions') => scores.reduce((n, s) => n + s[key], 0);
  const ratio = (a: number, b: number) => b ? a / b : 1;
  const fullyAnnotated = scores.every((s) => s.extra !== null);
  const dateTimeAccuracy = sum('timeTotal') ? ratio(sum('timeCorrect'), sum('timeTotal')) : null;
  const recall = scores.length ? ratio(sum('matched'), sum('expected')) : null;
  const otherAccuracy = scores.length ? ratio(sum('otherCorrect'), sum('otherTotal')) : null;
  const extraRate = scores.length && fullyAnnotated ? (sum('actual') ? scores.reduce((n, s) => n + s.extra!, 0) / sum('actual') : 0) : null;
  return {
    cases: scores.length, expectedItems: sum('expected'), actualItems: sum('actual'),
    dateTimeAccuracy, recall, otherAccuracy, extraRate, questionRate: sum('actual') ? sum('questions') / sum('actual') : null,
    pass: scores.length > 0 && scores.every((s) => s.successful) && fullyAnnotated && dateTimeAccuracy !== null && dateTimeAccuracy >= .95 && recall! >= .95 && otherAccuracy! >= .95 && extraRate! <= .02,
  };
}
