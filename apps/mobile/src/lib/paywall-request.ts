// A single pending gate survives the modal's lifetime without putting callbacks in route params.
let pending: { promise: Promise<boolean>; resolve: (unlocked: boolean) => void } | null = null;

export function requestPaywall(present: () => void): Promise<boolean> {
  if (pending) return pending.promise;
  let resolve!: (unlocked: boolean) => void;
  const promise = new Promise<boolean>((done) => { resolve = done; });
  pending = { promise, resolve };
  try {
    present();
  } catch {
    finishPaywall(false);
  }
  return promise;
}

export function finishPaywall(unlocked: boolean) {
  const request = pending;
  pending = null;
  request?.resolve(unlocked);
}
