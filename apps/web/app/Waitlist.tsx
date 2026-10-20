'use client';

import { useState } from 'react';
import { feedback } from '@/lib/feedback';
import { WAITLIST_MESSAGES, validEmail } from '@/lib/waitlist';
import styles from './home.module.css';

/**
 * The beta waitlist: one field, one pill. A `?r=` tag on the page (from semli.app/beta?r=name)
 * rides along so a signup credits the creator or ambassador who sent it.
 */
export function Waitlist({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** The `?r=` tag on the page, read at submit so the prerendered page needs no effect. */
  const refTag = () => {
    try {
      return new URLSearchParams(window.location.search).get('r');
    } catch {
      return null;
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validEmail(email.trim())) {
      feedback('error');
      setError(WAITLIST_MESSAGES.email);
      return;
    }
    feedback('tap');
    setBusy(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), ref: refTag() }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && body?.ok) {
        feedback('success');
        setDone(true);
      } else {
        feedback('error');
        setError(body?.error ?? WAITLIST_MESSAGES.unavailable);
      }
    } catch {
      feedback('error');
      setError(WAITLIST_MESSAGES.unavailable);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className={styles.waitlistDone} role="status">
        You’re on the list. The TestFlight link comes the day the beta opens.
      </p>
    );
  }

  return (
    <form className={styles.waitlist} onSubmit={submit} noValidate aria-label="Join the iPhone beta">
      <label className="sr-only" htmlFor={compact ? 'beta-email-hero' : 'beta-email'}>Email</label>
      <input
        id={compact ? 'beta-email-hero' : 'beta-email'}
        className={styles.waitlistInput}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@school.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'beta-error' : undefined}
      />
      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'Adding you…' : 'Get the TestFlight link'}
      </button>
      {error ? <p id="beta-error" className={styles.waitlistError} role="alert">{error}</p> : null}
      {!compact && !error ? <p className={styles.waitlistNote}>200 spots. The real app, the real trial, nothing to set up first.</p> : null}
    </form>
  );
}
