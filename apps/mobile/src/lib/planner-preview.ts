/** Sample records stay stored but never enter a person's live plan. */
export function realRecords<T extends { sourceId?: string | null }>(records: T[]): T[] {
  return records.filter((record) => record.sourceId !== 'sample');
}
