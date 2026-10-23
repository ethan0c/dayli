import type { Snapshot } from './cloud-snapshot';
import { supabase } from './supabase';
import type { PlanRecord, StoredRecord } from './sync-records';

/* The server side of sync, kept apart so the sync rules can be tested against an in-memory server. */

const PAGE = 1000;
const CHUNK = 500;

/** Every record the account wrote after `after`, oldest first, deletions included. */
export async function pullRecords(userId: string, after: number): Promise<StoredRecord[]> {
  const rows: StoredRecord[] = [];
  let cursor = after;
  for (;;) {
    const { data, error } = await supabase!
      .from('plan_records')
      .select('kind, id, data, deleted, seq, updated_at')
      .eq('user_id', userId)
      .gt('seq', cursor)
      .order('seq', { ascending: true })
      .limit(PAGE);
    if (error) throw error;
    const page = (data ?? []) as StoredRecord[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
    cursor = page[page.length - 1]!.seq;
  }
}

/** Saves records; the server stamps each with the next `seq`. */
export async function pushRecords(userId: string, records: PlanRecord[]): Promise<void> {
  for (let i = 0; i < records.length; i += CHUNK) {
    const rows = records.slice(i, i + CHUNK).map((r) => ({ user_id: userId, kind: r.kind, id: r.id, data: r.deleted ? null : r.data, deleted: r.deleted }));
    const { error } = await supabase!.from('plan_records').upsert(rows, { onConflict: 'user_id,kind,id' });
    if (error) throw error;
  }
}

/** The whole-plan backup saved before sync, read when an account has no records yet. */
export async function readLegacyPlan(userId: string): Promise<{ snapshot: Snapshot; at: string | null } | null> {
  const { data, error } = await supabase!.from('plans').select('data, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const stored = data?.data as Snapshot | undefined;
  return stored?.version === 1 ? { snapshot: stored, at: (data?.updated_at as string | undefined) ?? null } : null;
}
