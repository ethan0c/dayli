import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('./api', () => ({ DEFAULT_API_URL: 'https://example.test' }));
vi.mock('./storage', () => ({
  plannerLoadFailed: vi.fn(),
  plannerStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
  },
}));

beforeEach(() => {
  vi.resetModules();
  storage.clear();
});

describe('saved app language', () => {
  it('loads older settings with device matching as the default', async () => {
    storage.set('semli', JSON.stringify({ state: { settings: { name: 'Ana', region: 'US' } }, version: 0 }));
    const { useStore } = await import('../store');
    expect(useStore.getState().settings.language).toBeNull();
    expect(useStore.getState().settings.name).toBe('Ana');
    expect(useStore.getState().settings.region).toBe('US');
  });

  it('restores the saved language after a fresh store load without changing the region', async () => {
    const { useStore } = await import('../store');
    useStore.getState().setSettings({ language: 'es', region: 'US', termSystem: 'quarter' });
    vi.resetModules();
    const restored = (await import('../store')).useStore.getState();
    expect(restored.settings.language).toBe('es');
    expect(restored.settings.region).toBe('US');
    expect(restored.settings.termSystem).toBe('quarter');
  });

  it('keeps the device language when clearing the plan and excludes it from account sync', async () => {
    const { useStore } = await import('../store');
    const { snapshotOf } = await import('./cloud-snapshot');
    useStore.getState().setSettings({ language: 'es', name: 'Ana' });
    expect(snapshotOf(useStore.getState()).settings).not.toHaveProperty('language');
    useStore.getState().clearAll('plan');
    expect(useStore.getState().settings.language).toBe('es');
    useStore.getState().clearAll('everything');
    expect(useStore.getState().settings.language).toBe('es');
    expect(useStore.getState().settings.name).toBe('');
  });
});
