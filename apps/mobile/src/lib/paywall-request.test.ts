import { afterEach, describe, expect, it, vi } from 'vitest';
import { finishPaywall, requestPaywall } from './paywall-request';

afterEach(() => finishPaywall(false));

describe('paywall continuation', () => {
  it('waits for dismissal before resuming a pending action', async () => {
    const resume = vi.fn();
    const result = requestPaywall(vi.fn());
    void result.then(resume);
    await Promise.resolve();
    expect(resume).not.toHaveBeenCalled();
    finishPaywall(true);
    await expect(result).resolves.toBe(true);
    expect(resume).toHaveBeenCalledWith(true);
  });

  it('shares one modal between concurrent gates and returns false on cancellation', async () => {
    const present = vi.fn();
    const first = requestPaywall(present);
    expect(requestPaywall(present)).toBe(first);
    expect(present).toHaveBeenCalledOnce();
    finishPaywall(false);
    await expect(first).resolves.toBe(false);
  });

  it('can open a fresh paywall after closing and ignores duplicate finishes', async () => {
    const first = requestPaywall(vi.fn());
    finishPaywall(false);
    finishPaywall(true);
    await expect(first).resolves.toBe(false);
    const second = requestPaywall(vi.fn());
    finishPaywall(true);
    await expect(second).resolves.toBe(true);
  });

  it('releases the pending gate if presentation fails', async () => {
    await expect(requestPaywall(() => { throw new Error('No navigator'); })).resolves.toBe(false);
    const next = requestPaywall(vi.fn());
    finishPaywall(true);
    await expect(next).resolves.toBe(true);
  });
});
