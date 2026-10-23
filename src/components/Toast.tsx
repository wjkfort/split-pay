import { useEffect } from 'react';
import { CheckIcon } from './Icons';

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckIcon size={16} />
      <span>{message}</span>
    </div>
  );
}
