import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));
const review = vi.hoisted(() => ({ hasAction: vi.fn(), requestReview: vi.fn() }));
const analytics = vi.hoisted(() => ({ track: vi.fn() }));
const errors = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
vi.mock('expo-store-review', () => review);
vi.mock('./analytics', () => analytics);
vi.mock('./errors', () => errors);

/** An in-memory AsyncStorage so a sequence of imports reads back what it wrote. */
let saved: string | null;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  saved = null;
  storage.getItem.mockImplementation(async () => saved);
  storage.setItem.mockImplementation(async (_: string, value: string) => void (saved = value));
  review.hasAction.mockResolvedValue(true);
  review.requestReview.mockResolvedValue(undefined);
});

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe('the rating prompt', () => {
  it('waits for a second confirmed import on a second day', async () => {
    const { noteConfirmedImport } = await import('./store-review');
    expect(await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 })).toBe(false);
    expect(await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 })).toBe(false);
    expect(review.requestReview).not.toHaveBeenCalled();
    expect(await noteConfirmedImport({ now: day('2026-11-05'), delayMs: 0 })).toBe(true);
    expect(review.requestReview).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith('review_requested');
  });

  it('asks at most once every 120 days', async () => {
    const { noteConfirmedImport } = await import('./store-review');
    await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 });
    await noteConfirmedImport({ now: day('2026-11-05'), delayMs: 0 });
    expect(await noteConfirmedImport({ now: day('2027-01-20'), delayMs: 0 })).toBe(false);
    expect(await noteConfirmedImport({ now: day('2027-03-10'), delayMs: 0 })).toBe(true);
    expect(review.requestReview).toHaveBeenCalledTimes(2);
  });

  it('records the day but stays quiet after a Plus gate', async () => {
    const { noteConfirmedImport } = await import('./store-review');
    await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 });
    expect(await noteConfirmedImport({ prompt: false, now: day('2026-11-05'), delayMs: 0 })).toBe(false);
    expect(review.requestReview).not.toHaveBeenCalled();
    expect(await noteConfirmedImport({ now: day('2026-11-06'), delayMs: 0 })).toBe(true);
  });

  it('keeps the cooldown unspent when the system cannot show the sheet', async () => {
    const { noteConfirmedImport } = await import('./store-review');
    review.hasAction.mockResolvedValue(false);
    await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 });
    expect(await noteConfirmedImport({ now: day('2026-11-05'), delayMs: 0 })).toBe(false);
    expect(JSON.parse(saved!).askedAt).toBeNull();
    review.hasAction.mockResolvedValue(true);
    expect(await noteConfirmedImport({ now: day('2026-11-06'), delayMs: 0 })).toBe(true);
  });

  it('never throws into the confirm flow', async () => {
    const { noteConfirmedImport } = await import('./store-review');
    storage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
    expect(await noteConfirmedImport({ now: day('2026-11-03'), delayMs: 0 })).toBe(false);
    expect(errors.reportError).toHaveBeenCalledWith('review.prompt', expect.any(Error));
  });
});
