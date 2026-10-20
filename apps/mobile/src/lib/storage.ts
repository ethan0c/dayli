import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { reportError } from './errors';

/** Separate from persisted data: reporting a failed save must not cause another save. */
export const useStorageStatus = create(() => ({ loadFailed: false, saveFailed: false }));
let pending: { name: string; value: string } | null = null;
let writes: Promise<void> = Promise.resolve();

export function plannerLoadFailed(error: unknown) {
  reportError('storage.hydrate', error);
  useStorageStatus.setState({ loadFailed: true });
}

export const plannerStorage = {
  async getItem(name: string) {
    try {
      const value = await AsyncStorage.getItem(name);
      useStorageStatus.setState({ loadFailed: false });
      return value;
    } catch (error) { plannerLoadFailed(error); throw error; }
  },
  setItem(name: string, value: string): Promise<void> {
    // A failed read must never be replaced by a new empty plan.
    if (useStorageStatus.getState().loadFailed) return Promise.resolve();
    const write = { name, value };
    pending = write;
    writes = writes.then(async () => {
      try {
        await AsyncStorage.setItem(name, value);
        if (pending === write) { pending = null; useStorageStatus.setState({ saveFailed: false }); }
      } catch (error) {
        reportError('storage.save', error);
        useStorageStatus.setState({ saveFailed: true });
      }
    });
    return writes;
  },
  async removeItem(name: string) {
    try { await AsyncStorage.removeItem(name); }
    catch (error) { reportError('storage.remove', error); throw error; }
  },
};

export async function retryPlannerSave() {
  if (pending) await plannerStorage.setItem(pending.name, pending.value);
}
