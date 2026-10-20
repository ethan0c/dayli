/**
 * Whether Semli Plus is active, as the store last reported it, for code that runs outside React
 * (alarm sync). `unknown` until the first customer info arrives, so a cold start never cancels a
 * subscriber's alarms before the store has answered. PurchasesProvider keeps it current.
 */
export type PlusStatus = 'unknown' | 'active' | 'inactive';

let status: PlusStatus = 'unknown';
const listeners = new Set<(status: PlusStatus) => void>();

export const getPlusStatus = (): PlusStatus => status;

export function setPlusStatus(next: PlusStatus): void {
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener(next));
}

export function onPlusStatus(listener: (status: PlusStatus) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
