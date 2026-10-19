'use client';

import { formatRange, formatTime, localParts, monthDay, toDrafts, weekdayLong, type Draft } from '@dayli/core';
import { ExtractResponse, type Extraction, type ExtractRequest } from '@dayli/schema';
import { useEffect, useRef, useState } from 'react';

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
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** What the status line says while Claude works, by elapsed time. */
const PHASES = ['Reading', 'Finding dates and times', 'Sorting by day', 'Almost there'];
const PHASE_MS = 1600;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const [phase, setPhase] = useState(0);
  const [drag, setDrag] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ extraction: Extraction; drafts: Draft[] } | null>(null);
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance the status line while a request is in flight.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), PHASE_MS);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => () => void (typer.current && clearInterval(typer.current)), []);

  function useExample() {
    if (reducedMotion()) {
      setText(SAMPLE);
      return;
    }
    setTyping(true);
    setText('');
    let i = 0;
    typer.current = setInterval(() => {
      i += 3;
      setText(SAMPLE.slice(0, i));
      if (i >= SAMPLE.length) {
        if (typer.current) clearInterval(typer.current);
        typer.current = null;
        setTyping(false);
      }
    }, 16);
  }

  function pick(f: globalThis.File | null) {
    setError(null);
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (busy) return;
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Read the clock here, not during render: the page is prerendered.
    const today = localParts(new Date()).date;
    let input: ExtractRequest['input'];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('That file is over 20 MB. Try a smaller one.');
        return;
      }
      const data = await fileToBase64(file);
      if (file.type === 'application/pdf') input = { kind: 'pdf', data };
      else if (ACCEPT.includes(file.type)) input = { kind: 'image', mediaType: file.type as 'image/png', data };
      else {
        setError('Dayli reads PDFs and images (PNG, JPEG, WebP, GIF).');
        return;
      }
    } else if (text.trim()) {
      input = { kind: 'text', text: text.trim() };
    } else {
      setError('Type something or pick a file first.');
      return;
    }

    setPhase(0);
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
      const parsed = ExtractResponse.safeParse(await res.json());
      if (!parsed.success) throw new Error('bad response');
      if (!parsed.data.ok) {
        setError(parsed.data.error);
        return;
      }
      setResult({ extraction: parsed.data.extraction, drafts: toDrafts(parsed.data.extraction, today) });
    } catch {
      setError("Dayli couldn't read that right now. Try again.");
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
  let n = 0; // running index so rows stagger across groups

  return (
    <section className={`try${busy ? ' busy' : ''}`} id="try">
      <form
        onSubmit={submit}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
        }}
        onDrop={onDrop}
      >
        <h2>Try it with your own week</h2>
        <p className="sub">Paste a message, or drop in a screenshot or syllabus. You&apos;ll see what Dayli would add.</p>
        <textarea
          id="try-text"
          className={typing ? 'typing' : undefined}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
          disabled={busy || typing}
          aria-label="Message"
        />
        <div className="or">or</div>
        <label className={`file${drag ? ' drag' : ''}${file ? ' has' : ''}`}>
          <input
            id="try-file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {drag ? <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /> : <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />}
          </svg>
          <span key={drag ? 'drag' : file ? file.name : 'empty'} className="file-name">
            {drag ? 'Drop it here' : file ? file.name : 'Choose or drop a screenshot or PDF'}
          </span>
        </label>
        <div className="actions">
          <button className="btn" type="submit" disabled={busy || typing}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" />
                Reading…
              </>
            ) : (
              'Show me'
            )}
          </button>
          {!text && !file ? (
            <button className="btn ghost" type="button" onClick={useExample} disabled={busy}>
              Use the example
            </button>
          ) : null}
          {file ? (
            <button className="btn ghost" type="button" onClick={() => pick(null)} disabled={busy}>
              Remove file
            </button>
          ) : null}
        </div>
        {error ? (
          <div className="status err" role="alert">
            {error}
          </div>
        ) : null}
      </form>

      <div className="results" aria-live="polite" aria-busy={busy}>
        {busy ? (
          <>
            <div className="ov phase" key={phase}>
              {PHASES[phase]}
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="skel-rows" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skel" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </>
        ) : !result ? (
          <>
            <div className="ov">What Dayli would add</div>
            <p className="empty">Results show up here, one row per event or to-do, grouped by day.</p>
          </>
        ) : (
          <>
            <div className="ov rise">{typeLabel}</div>
            {result.drafts.length === 0 ? <p className="empty rise">Nothing with a date in there.</p> : null}
            {[...groups.entries()].map(([date, list]) => (
              <div key={date || 'none'} className="rows">
                <div className="ov rise" style={{ animationDelay: `${n * 45}ms` }}>
                  {date ? `${weekdayLong(date)} · ${monthDay(date)}` : 'No date yet'}
                </div>
                {list.map((d) => {
                  const time = d.start ? (d.end ? formatRange(d.start, d.end) : formatTime(d.start)) : null;
                  const delay = `${n++ * 45}ms`;
                  return (
                    <div key={d.key} className="rise" style={{ animationDelay: delay }}>
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
