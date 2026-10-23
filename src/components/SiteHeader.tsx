import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="site-header">
      <Wordmark />
      {right ?? (
        <span className="privacy-pill">
          <span className="privacy-dot" aria-hidden="true" />
          On-device only
        </span>
      )}
    </header>
  );
}
