import { z } from 'zod';
import { ExtractContext, ExtractedItem, Extraction, LocalDate, LocalTime } from '@dayli/schema';

export const ExpectedItem = ExtractedItem.partial().omit({ title: true, evidence: true, confidence: true, question: true }).extend({
  match: z.string().min(1),
  date: LocalDate.nullable(),
  start: LocalTime.nullable(),
  end: LocalTime.nullable(),
  needsQuestion: z.boolean().optional(),
});
export type ExpectedItem = z.infer<typeof ExpectedItem>;

export const EvalCase = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  provenance: z.enum(['synthetic', 'public', 'user']),
  source: z.string(),
  format: z.string(),
  notes: z.string(),
  input: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string().min(1) }),
    z.object({ kind: z.literal('image'), file: z.string(), mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']) }),
    z.object({ kind: z.literal('pdf'), file: z.string() }),
  ]),
  context: ExtractContext,
  expected: z.object({
    // Partial annotations are useful for diagnosis but can never pass the release gate.
    complete: z.boolean(),
    metadata: Extraction.omit({ items: true }).partial(),
    items: z.array(ExpectedItem),
  }),
});
export type EvalCase = z.infer<typeof EvalCase>;
