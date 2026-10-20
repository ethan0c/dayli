import type { StaticImageData } from 'next/image';
import add from '@/public/screens/add.png';
import item from '@/public/screens/item.png';
import paywall from '@/public/screens/paywall.png';
import plan from '@/public/screens/plan.png';
import reviewUpdate from '@/public/screens/review-update.png';
import review from '@/public/screens/review.png';
import school from '@/public/screens/school.png';
import todayMonHours from '@/public/screens/today-mon-hours.png';
import today from '@/public/screens/today.png';

/**
 * The app captures as static imports, so Next knows each one's size and ships a
 * blurred placeholder: the slot is reserved before the image arrives and nothing
 * pops in. See public/screens/README.md for how they are made.
 */
export const SCREENS = { today, add, review, item, plan, 'today-mon-hours': todayMonHours, 'review-update': reviewUpdate, school, paywall } satisfies Record<string, StaticImageData>;

export type ShotName = keyof typeof SCREENS;
