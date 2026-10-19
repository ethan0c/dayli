import { profileFor, type DemoRow } from './majors';

/** Legacy sample records remain stored, but never enter a person's live plan. */
export function realRecords<T extends { sourceId?: string | null }>(records: T[]): T[] {
  return records.filter((record) => record.sourceId !== 'sample');
}

export interface StarterCard {
  id: 'work' | 'school' | 'message';
  title: string;
  detail: string;
  source?: 'image' | 'file';
  examples: DemoRow[];
}

/** Examples explain the outcome; these rows are never committed or scheduled. */
export function starterCards(settings: { isStudent: boolean; major: string | null; weekKinds: string[] }, schoolOnly = false): StarterCard[] {
  const profile = profileFor(settings.major, settings.isStudent);
  const cards: StarterCard[] = [];
  if (!schoolOnly && (!settings.isStudent || settings.weekKinds.includes('work'))) cards.push({
    id: 'work', title: 'Upload your work schedule', detail: 'A screenshot or photo becomes a week you can review.', source: 'image',
    examples: [{ title: 'Work shift', kind: 'event', cat: 'work', icon: 'work', chip: 'Fri · 4–10 pm' }],
  });
  if (settings.isStudent || schoolOnly) cards.push({
    id: 'school', title: 'Add your syllabus', detail: 'See your classes, assignments, and exam dates together.', source: 'file',
    examples: settings.isStudent ? profile.demo.rows.filter((row) => row.cat === 'school').slice(0, 2)
      : [{ title: 'Course assignment', kind: 'task', cat: 'school', icon: 'book', chip: 'Due Friday' }],
  });
  if (!schoolOnly) cards.push({
    id: 'message', title: 'Tell Semli what’s coming up', detail: 'A quick message is a good place to start.',
    examples: [{ title: profile.sample.errand, kind: 'task', cat: 'personal', icon: 'check' }],
  });
  return cards;
}
