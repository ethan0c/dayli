import type { IconKey } from '@/components/Icon';

/** A field of study, asked in You → Studying. Onboarding no longer asks it (Oct 21, 2026). */
export interface Profile {
  id: string;
  label: string;
  icon: IconKey;
}

export const MAJORS: Profile[] = [
  { id: 'nursing', label: 'Nursing & health', icon: 'heart' },
  { id: 'engineering', label: 'Engineering', icon: 'exam' },
  { id: 'cs', label: 'Computer science', icon: 'check' },
  { id: 'business', label: 'Business', icon: 'work' },
  { id: 'science', label: 'Sciences', icon: 'exam' },
  { id: 'arts', label: 'Arts & design', icon: 'pen' },
  { id: 'humanities', label: 'Humanities & social sciences', icon: 'book' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'other', label: 'Something else', icon: 'sparkle' },
];

export const WORKING: Profile = { id: 'working', label: 'Working', icon: 'work' };

export function profileFor(major: string | null | undefined, student: boolean): Profile {
  if (!student) return WORKING;
  return MAJORS.find((m) => m.id === major) ?? MAJORS[MAJORS.length - 1]!;
}
