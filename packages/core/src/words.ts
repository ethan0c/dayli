/** "1 shift", "3 shifts", "2 classes" with `many`. */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Essay", "Essay and Reading", "Essay, Reading and Lab". */
export function andList(parts: string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
