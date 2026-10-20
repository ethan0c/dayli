import AsyncStorage from '@react-native-async-storage/async-storage';
import { localParts } from '@dayli/core';
import * as StoreReview from 'expo-store-review';

import { track } from './analytics';
import { reportError } from './errors';

/**
 * The App Store rating prompt. Apple's sheet appears after the second confirmed
 * import on a second day, at most once every 120 days, and only from a plain
 * confirm (never right after a Plus gate, where the purchase celebration may be
 * on screen). Apple decides whether the sheet actually shows; "Rate Semli" in You
 * remains the manual path. See docs/launch-guide.md §3.4.
 */
const KEY = 'semli.review';
const DAYS_BEFORE_ASKING = 2;
const COOLDOWN_DAYS = 120;
/** After the success haptic and the toast, so the sheet does not land on top of them. */
const DELAY_MS = 1500;

type ReviewState = { days: string[]; askedAt: string | null };

async function load(): Promise<ReviewState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { days: [], askedAt: null };
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return { days: [], askedAt: null };
  const { days, askedAt } = parsed as Partial<ReviewState>;
  return {
    days: Array.isArray(days) ? days.filter((d): d is string => typeof d === 'string') : [],
    askedAt: typeof askedAt === 'string' ? askedAt : null,
  };
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Record a confirmed import and ask for a rating when it is due.
 * Resolves true when the system prompt was requested.
 */
export async function noteConfirmedImport({ prompt = true, now = new Date(), delayMs = DELAY_MS }: { prompt?: boolean; now?: Date; delayMs?: number } = {}): Promise<boolean> {
  try {
    const state = await load();
    const today = localParts(now).date;
    if (!state.days.includes(today)) state.days = [...state.days, today].slice(-DAYS_BEFORE_ASKING);
    const cooling = state.askedAt !== null && now.getTime() - new Date(state.askedAt).getTime() < COOLDOWN_DAYS * 86_400_000;
    const due = prompt && !cooling && state.days.length >= DAYS_BEFORE_ASKING;
    const ask = due && (await StoreReview.hasAction());
    if (ask) state.askedAt = now.toISOString();
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    if (!ask) return false;
    await wait(delayMs);
    await StoreReview.requestReview();
    track('review_requested');
    return true;
  } catch (error) {
    reportError('review.prompt', error);
    return false;
  }
}
