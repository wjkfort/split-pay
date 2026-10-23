import type { ReactNode } from 'react';

export function SectionHead({
  step,
  id,
  title,
  copy,
  aside,
}: {
  step: string;
  id: string;
  title: string;
  copy: string;
  aside?: ReactNode;
}) {
  return (
    <header className="section-head">
      <span className="section-step" aria-hidden="true">
        {step}
      </span>
      <div className="section-titles">
        <h2 id={id}>{title}</h2>
        <p>{copy}</p>
      </div>
      {aside ? <div className="section-aside">{aside}</div> : null}
    </header>
  );
}

export function FieldNote({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'hint' | 'good' }) {
  return (
    <p className={`field-note field-note-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </p>
  );
}
