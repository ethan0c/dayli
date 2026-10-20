import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  storage.getItem.mockResolvedValue('saved plan'); storage.setItem.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('planner persistence recovery', () => {
  it('blocks writes after a failed read so an empty plan cannot overwrite saved data', async () => {
    const { plannerStorage, useStorageStatus } = await import('./storage');
    storage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
    await expect(plannerStorage.getItem('semli')).rejects.toThrow('Storage unavailable');
    expect(useStorageStatus.getState().loadFailed).toBe(true);
    await plannerStorage.setItem('semli', 'empty default plan');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(await plannerStorage.getItem('semli')).toBe('saved plan');
    expect(useStorageStatus.getState().loadFailed).toBe(false);
  });
  it('retains failed writes in memory and retries the latest changes without an unhandled rejection', async () => {
    const { plannerStorage, retryPlannerSave, useStorageStatus } = await import('./storage');
    storage.setItem.mockRejectedValueOnce(new Error('Disk full'));
    await plannerStorage.setItem('semli', 'latest plan');
    expect(useStorageStatus.getState().saveFailed).toBe(true);
    await retryPlannerSave();
    expect(storage.setItem).toHaveBeenLastCalledWith('semli', 'latest plan');
    expect(useStorageStatus.getState().saveFailed).toBe(false);
  });
  it('serializes writes so an older save cannot finish after a newer plan', async () => {
    const { plannerStorage } = await import('./storage');
    let finish!: () => void;
    storage.setItem.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = plannerStorage.setItem('semli', 'old plan');
    const second = plannerStorage.setItem('semli', 'new plan');
    await Promise.resolve();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    finish(); await Promise.all([first, second]);
    expect(storage.setItem).toHaveBeenLastCalledWith('semli', 'new plan');
  });
  it('also blocks replacement after saved JSON cannot be decoded', async () => {
    const { plannerStorage, plannerLoadFailed } = await import('./storage');
    plannerLoadFailed(new SyntaxError('Unexpected token, private content at position 12'));
    await plannerStorage.setItem('semli', 'empty plan');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain('private content');
  });
});
