/** A Canvas calendar feed link on a real domain: never an IP address, localhost or another port. */
export function isCanvasFeed(url: string): boolean {
  if (!/^https:\/\/[^\s/]+\/feeds\/calendars\/[^\s/]+\.ics(\?\S*)?$/i.test(url)) return false;
  const { hostname, port } = new URL(url);
  if (port) return false;
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(hostname) && !/^\d+(\.\d+){3}$/.test(hostname);
}
