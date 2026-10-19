'use client';

import { formatRange, formatTime, localParts, monthDay, toDrafts, weekdayLong, type Draft } from '@dayli/core';
import { ExtractResponse, IMPORT_MESSAGES, importErrorForStatus, type Extraction, type ExtractRequest } from '@dayli/schema';
import { useState } from 'react';

const ICONS: Record<Draft['icon'], string> = {
  calendar: 'M3 4h18v18H3z M16 2v4M8 2v4M3 10h18',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z',
  check: 'M3 3h18v18H3z m8.5 12 2.5 2.5 4.5-5',
  work: 'M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18M16 10a4 4 0 0 1-8 0',
  pen: 'M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  school: 'M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5',
  exam: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 15l2 2 4-4',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
};

const SAMPLE = 'I work Friday 4-10 and Saturday 11-5 at Olive Garden, have a pharm exam next Monday at 9, and need to buy scrubs Wednesday.';

async function fileToBase64(file: globalThis.File): Promise<string> {
  const buf = await file.arrayBuffer();
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function TryIt() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ extraction: Extraction; drafts: Draft[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Read the clock here, not during render: the page is prerendered.
    const today = localParts(new Date()).date;
    let input: ExtractRequest['input'];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError(IMPORT_MESSAGES.tooLarge);
        return;
      }
      // Check the format before trying to read the file.
      let data: string;
      if (file.type !== 'application/pdf' && !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
        setError(IMPORT_MESSAGES.unsupported);
        return;
      }
      try {
        data = await fileToBase64(file);
      } catch {
        setError(IMPORT_MESSAGES.file);
        return;
      }
      input = file.type === 'application/pdf'
        ? { kind: 'pdf', data }
        : { kind: 'image', mediaType: file.type as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif', data };
    } else if (text.trim()) {
      input = { kind: 'text', text: text.trim() };
    } else {
      setError('Add a message, screenshot, or PDF so Dayli can find your dates.');
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input,
          context: { today, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, courses: [], employers: [] },
        } satisfies ExtractRequest),
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        setError(importErrorForStatus(res.status));
        return;
      }
      const parsed = ExtractResponse.safeParse(body);
      if (!parsed.success || (!res.ok && parsed.data.ok)) {
        setError(importErrorForStatus(res.status));
        return;
      }
      if (!parsed.data.ok) {
        setError(parsed.data.error);
        return;
      }
      setResult({ extraction: parsed.data.extraction, drafts: toDrafts(parsed.data.extraction, today) });
    } catch {
      setError(IMPORT_MESSAGES.connection);
    } finally {
      setBusy(false);
    }
  }

  const ex = result?.extraction;
  const typeLabel = ex
    ? ex.detected_type === 'work_schedule'
      ? `Work schedule${ex.employer ? ` · ${ex.employer}` : ''}`
      : ex.detected_type === 'syllabus'
        ? `Syllabus${ex.course ? ` · ${ex.course.code ?? ex.course.title}` : ''}`
        : ex.detected_type === 'course_schedule'
          ? 'Class schedule'
          : 'From your message'
    : null;

  const groups = new Map<string, Draft[]>();
  for (const d of result?.drafts ?? []) groups.set(d.date ?? '', [...(groups.get(d.date ?? '') ?? []), d]);
  return (
    <section className="try" id="try">
      <form onSubmit={submit}>
        <h2>Try it with your own week</h2>
        <p className="sub">Paste a message, or drop in a screenshot or syllabus. You&apos;ll see what Dayli would add.</p>
        <textarea
          id="try-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
          disabled={busy}
          aria-label="Message"
        />
        <div className="or">or</div>
        <label className="file">
          <input
            id="try-file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
          </svg>
          <span>{file ? file.name : 'Choose a screenshot or PDF'}</span>
        </label>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Reading…' : 'Preview my plan'}
          </button>
          {!text && !file ? (
            <button className="btn ghost" type="button" onClick={() => setText(SAMPLE)} disabled={busy}>
              Use the example
            </button>
          ) : null}
          {file ? (
            <button className="btn ghost" type="button" onClick={() => setFile(null)} disabled={busy}>
              Remove file
            </button>
          ) : null}
        </div>
        {busy ? <div className="status info" role="status">Reading {file ? file.name : 'your message'}…</div> : null}
        {error ? (
          <div className="status err" role="alert">
            {error}
          </div>
        ) : null}
      </form>

      <div className="results" aria-live="polite">
        {!result ? (
          <>
            <div className="ov">What Dayli would add</div>
            <p className="empty">Your events and to-dos will appear here, grouped by day.</p>
          </>
        ) : (
          <>
            <div className="ov">{typeLabel}</div>
            {result.drafts.length === 0 ? <p className="empty">{IMPORT_MESSAGES.empty}</p> : null}
            {[...groups.entries()].map(([date, list]) => (
              <div key={date || 'none'} className="rows">
                <div className="ov">{date ? `${weekdayLong(date)} · ${monthDay(date)}` : 'No date yet'}</div>
                {list.map((d) => {
                  const time = d.start ? (d.end ? formatRange(d.start, d.end) : formatTime(d.start)) : null;
                  return (
                    <div key={d.key}>
                      <div className={`row ${d.kind === 'event' ? `ev ${d.category}` : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={ICONS[d.icon]} />
                        </svg>
                        <span className="t">{d.title}</span>
                        {d.kind === 'event' ? time ? <span className="chip">{time}</span> : null : <span className="ck" />}
                      </div>
                      {d.question ? <div className="q">{d.question}</div> : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
