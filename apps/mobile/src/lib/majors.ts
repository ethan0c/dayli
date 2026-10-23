import type { IconKey } from '@/components/Icon';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

/** A field of study, asked in You → Studying. Onboarding no longer asks it (Oct 21, 2026). */
export interface Profile {
  id: string;
  label: MessageDescriptor;
  icon: IconKey;
}

export const MAJORS: Profile[] = [
  { id: 'nursing', label: msg`Nursing & health`, icon: 'heart' },
  { id: 'engineering', label: msg`Engineering`, icon: 'exam' },
  { id: 'cs', label: msg`Computer science`, icon: 'check' },
  { id: 'business', label: msg`Business`, icon: 'work' },
  { id: 'science', label: msg`Sciences`, icon: 'exam' },
  { id: 'arts', label: msg`Arts & design`, icon: 'pen' },
  { id: 'humanities', label: msg`Humanities & social sciences`, icon: 'book' },
  { id: 'education', label: msg`Education`, icon: 'school' },
  { id: 'other', label: msg`Something else`, icon: 'sparkle' },
];

export const WORKING: Profile = { id: 'working', label: msg`Working`, icon: 'work' };

export function profileFor(major: string | null | undefined, student: boolean): Profile {
  if (!student) return WORKING;
  return MAJORS.find((m) => m.id === major) ?? MAJORS[MAJORS.length - 1]!;
}
