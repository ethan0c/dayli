/**
 * How an import's source reads after "From": a screenshot, a photo, a message, a PDF (or, for a
 * course, a syllabus), else its own name, such as a file name or Canvas. Matches any case.
 */
export function sourceName(source: string, pdf: 'a PDF' | 'a syllabus' = 'a PDF'): string {
  const s = source.toLowerCase();
  if (s === 'screenshot') return 'a screenshot';
  if (s === 'photo') return 'a photo';
  if (s === 'message') return 'a message';
  if (s.endsWith('.pdf') || s.includes('syllabus')) return pdf;
  return source;
}
