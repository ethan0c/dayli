import type { ReactNode } from 'react';

/** Shell for long-form pages: terms, privacy, contact, delete. */
export function Prose({ title, lede, meta, children }: { title: ReactNode; lede?: ReactNode; meta?: ReactNode; children: ReactNode }) {
  return (
    <article className="prose">
      <header className="prose-head">
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
        {meta ? <div className="prose-meta">{meta}</div> : null}
      </header>
      {children}
    </article>
  );
}
