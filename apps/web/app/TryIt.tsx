'use client';

import { addDays, errorDiagnostic, localParts, toDrafts, weekOf } from '@dayli/core';
import { ExtractResponse, IMPORT_MESSAGES, friendlyImportError, importErrorForStatus, type ExtractRequest, type Extraction } from '@dayli/schema';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Pill, Roll, Row, TermLine, WeekChart } from '@/components/Mock';
import { feedback } from '@/lib/feedback';
import type { Qr } from '@/lib/qr';
import { GetAppDialog } from './GetAppDialog';
import { summarize, type Summary } from './review';

const SAMPLE = 'I work Friday 4-10 and Saturday 11-5 at the campus café, have a stats exam Thursday at 9, and need to return a library book Wednesday.';
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** What the status line says while Semli reads, by elapsed time. */
const PHASES = ['Reading', 'Finding dates and times', 'Sorting by day', 'Almost there'];
const PHASE_MS = 1600;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** What Semli reads from SAMPLE, placed around `today`, so the result side is never empty. */
function exampleExtraction(today: string): Extraction {
  // One week, so the result is one chart like Plan: this one while Wednesday is ahead, else the next.
  const week = weekOf(today < weekOf(today)[2]! ? today : addDays(today, 7));
  const wed = week[2]!;
  const thu = week[3]!;
  const fri = week[4]!;
  const sat = week[5]!;
  const item = (kind: 'event' | 'task', title: string, category: 'work' | 'school' | 'personal', date: string, start: string | null, end: string | null, is_deadline: boolean, evidence: string) => ({
    kind, title, category, date, start, end, is_deadline, repeat_weekdays: [] as never[], repeat_until: null, course_code: null, evidence, confidence: 0.95, question: null,
  });
  return {
    detected_type: 'general', employer: 'Campus café', course: null, covers_from: null, covers_to: null,
    items: [
      item('event', 'Café shift', 'work', fri, '16:00', '22:00', false, 'Friday 4-10'),
      item('event', 'Café shift', 'work', sat, '11:00', '17:00', false, 'Saturday 11-5'),
      item('event', 'Stats exam', 'school', thu, '09:00', null, true, 'stats exam Thursday at 9'),
      item('task', 'Return library book', 'personal', wed, null, null, true, 'return a library book Wednesday'),
    ],
  };
}

const noop = () => () => {};

/**
 * Each preview spends model tokens, so the site gives a browser two before it points to the app.
 * The server's per-IP daily limit is the real cap; this one is cleared with the browser's storage.
 */
const PREVIEWS = 2;
const PREVIEWS_KEY = 'semli.previews';

function previewsUsed(): number {
  try {
    return Number(localStorage.getItem(PREVIEWS_KEY)) || 0;
  } catch {
    return 0;
  }
}

function countPreview() {
  try {
    localStorage.setItem(PREVIEWS_KEY, String(previewsUsed() + 1));
  } catch {}
}

async function fileToBase64(file: globalThis.File): Promise<string> {
  const buf = await file.arrayBuffer();
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * The try-it box: the app's composer on the left, the app's review on the right
 * (the big number, the week or the term as a chart, rows only for what needs input).
 */
export function TryIt({ qr }: { qr: Qr }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [drag, setDrag] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Summary | null>(null);
  const [capped, setCapped] = useState(false);
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // The example result depends on today's date, so it renders only on the client (the page is prerendered).
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const example = useMemo(() => {
    if (!mounted) return null;
    const ex = exampleExtraction(localParts(new Date()).date);
    return summarize(ex, toDrafts(ex, localParts(new Date()).date));
  }, [mounted]);
  const shown = result ?? example;
  const isExample = !result;

  // Advance the status line while a request is in flight.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), PHASE_MS);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => () => void (typer.current && clearInterval(typer.current)), []);

  function useExample() {
    feedback('select');
    setFile(null);
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
    feedback(f ? 'select' : 'remove');
    setError(null);
    setFile(f);
    if (!f && fileInput.current) fileInput.current.value = '';
  }

  function fail(message: string) {
    feedback('error');
    setError(message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Read the clock here, not during render: the page is prerendered.
    const today = localParts(new Date()).date;
    let input: ExtractRequest['input'];
    if (file) {
      if (file.size > 20 * 1024 * 1024) return fail('That file is over 20 MB. Try a smaller one.');
      const data = await fileToBase64(file).catch((error: unknown) => {
        console.info('[web.import.read_file]', errorDiagnostic(error));
        return null;
      });
      if (data === null) return fail(IMPORT_MESSAGES.file);
      if (file.type === 'application/pdf') input = { kind: 'pdf', data };
      else if (ACCEPT.includes(file.type)) input = { kind: 'image', mediaType: file.type as 'image/png', data };
      else return fail('Semli reads PDFs and images (PNG, JPEG, WebP, GIF).');
    } else if (text.trim()) {
      input = { kind: 'text', text: text.trim() };
    } else {
      return fail('Type something or add a file first.');
    }
    if (previewsUsed() >= PREVIEWS) {
      feedback('ready');
      setCapped(true);
      return;
    }

    feedback('tap');
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
      let body: unknown;
      try { body = await res.json(); }
      catch (error) {
        console.info('[web.import.response_json]', { ...errorDiagnostic(error), status: res.status });
        return fail(importErrorForStatus(res.status));
      }
      const parsed = ExtractResponse.safeParse(body);
      if (!parsed.success || (!res.ok && parsed.data.ok)) {
        console.info('[web.import.response_schema]', { code: 'invalid_response', status: res.status });
        return fail(importErrorForStatus(res.status));
      }
      if (!parsed.data.ok && parsed.data.error === IMPORT_MESSAGES.demoLimit) {
        feedback('ready');
        setCapped(true);
        return;
      }
      if (!parsed.data.ok) {
        console.info('[web.import.response]', { code: 'import_rejected', status: res.status });
        return fail(friendlyImportError(parsed.data.error, res.status));
      }
      countPreview();
      const drafts = toDrafts(parsed.data.extraction, today);
      feedback(drafts.length > 0 ? 'success' : 'ready');
      setResult(summarize(parsed.data.extraction, drafts));
    } catch (error) {
      console.info('[web.import.request_or_review]', errorDiagnostic(error));
      fail(IMPORT_MESSAGES.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`try${busy ? ' busy' : ''}`} id="try" aria-labelledby="try-title">
      <div>
        <h2 id="try-title" className="section-title">Try it with your week.</h2>
        <p className="lede">Paste a message or upload a screenshot or syllabus PDF. Preview the dates and times Semli finds. No account needed.</p>
        <form
          onSubmit={submit}
          className={`try-box${drag ? ' drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f && !busy) pick(f);
          }}
        >
          <textarea
            id="try-text"
            className={typing ? 'typing' : undefined}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I work Friday 4–10 at the café and have a stats exam Thursday at 9…"
            disabled={busy || typing || !!file}
            aria-label="Message"
          />
          {file ? (
            <div className="try-file">
              <span>{file.name}</span>
              <button type="button" onClick={() => pick(null)} aria-label={`Remove ${file.name}`} disabled={busy}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
          ) : null}
          {drag ? <div className="try-drop">Drop it here</div> : null}
          <div className="try-tools">
            <label className="try-icon" aria-label="Add a screenshot or PDF" title="Add a screenshot or PDF">
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
                disabled={busy}
                hidden
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
              </svg>
            </label>
            <span className="spacer" />
            {!text && !file ? (
              <button className="textlink" type="button" onClick={useExample} disabled={busy}>
                Use the example
              </button>
            ) : null}
            <button className="btn" type="submit" disabled={busy || typing}>
              {busy ? 'Reading…' : 'Preview my plan'}
            </button>
          </div>
        </form>
        {error ? (
          <div className="try-error" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className="try-stage">
      <div className="try-result" aria-live="polite" aria-busy={busy}>
        {busy ? (
          <>
            <div className="try-progress" aria-hidden="true" />
            <div className="try-phase" key={phase}>{PHASES[phase]}</div>
            <div className="skel-rows" aria-hidden="true">
              {[0, 1, 2].map((i) => <div key={i} className="skel" />)}
            </div>
          </>
        ) : !shown ? (
          <>
            <div className="try-found">What Semli would add</div>
            <p className="try-empty">See the dates and times from your upload here, with missing details marked for you to check.</p>
          </>
        ) : (
          <div className="rise" key={`${shown.found} ${shown.big}`}>
            <div className="try-found">{isExample ? 'Example · from the message on the left' : shown.found}</div>
            <div className="try-big"><Roll text={String(shown.big)} /></div>
            {shown.line ? <div className="try-line">{shown.line}</div> : null}
            {shown.view?.kind === 'week'
              ? shown.view.weeks.map((days, i) => <div key={i} className="try-chart"><WeekChart days={days} height={120} label="Your week as seven day bars" /></div>)
              : shown.view?.kind === 'term'
                ? <div className="try-chart"><TermLine months={shown.view.months} marks={shown.view.marks} label="Your dates on one line" /></div>
                : null}
            {shown.needs.length > 0 || shown.rows.length > 0 ? (
              <div className="try-rows">
                {shown.needs.map((n, i) => (
                  <Row key={n.draft.key} index={i} lead="dot" title={n.draft.title} sub={n.sub} trailing={<Pill tone="amber">{n.pill}</Pill>} last={shown.rows.length === 0 && i === shown.needs.length - 1} />
                ))}
                {shown.rows.map((r, i) => (
                  <Row key={r.key} index={shown.needs.length + i} lead={r.lead} title={r.title} sub={r.sub} trailing={<Pill>{r.when}</Pill>} last={i === shown.rows.length - 1} />
                ))}
                {shown.more > 0 ? <p className="try-more">And {shown.more} more in the app.</p> : null}
              </div>
            ) : null}
            <p className="try-caption">{isExample ? 'Paste your own message, or drop in a screenshot or syllabus, to see yours.' : 'This is a preview, not a saved plan. In the app, you review the details before adding them.'}</p>
          </div>
        )}
      </div>
      </div>
      <GetAppDialog open={capped} onClose={() => setCapped(false)} qr={qr} />
    </section>
  );
}
