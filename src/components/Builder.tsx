import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { SplitState } from '../lib/types';
import { formatMoney } from '../lib/money';
import { computeSplit } from '../lib/split';
import { createInitialState, decodeState, encodeState } from '../lib/state';
import { ArrowRightIcon, LockIcon } from './Icons';
import { PeopleEditor } from './PeopleEditor';
import { BillEditor } from './BillEditor';
import { SplitEditor } from './SplitEditor';
import { SiteHeader } from './SiteHeader';
import { TallyPanel } from './TallyPanel';

export function Builder({
  initialData,
  navigate,
}: {
  initialData?: string;
  navigate: (path: string) => void;
}) {
  const [state, setState] = useState<SplitState>(() => decodeState(initialData) ?? createInitialState());
  const [loadError] = useState(() => Boolean(initialData) && decodeState(initialData) === null);
  const model = useMemo(() => computeSplit(state), [state]);
  const ready = model.issues.length === 0;
  const nextStep =
    model.issues[0]?.target === 'people'
      ? 'Add the table'
      : model.issues[0]?.target === 'bill'
        ? 'Add the bill'
        : model.issues[0]?.target === 'items'
          ? 'Assign every item'
          : 'Finish the split';

  useEffect(() => {
    document.title = 'DinnerSplit — The check, divided fairly';
  }, []);

  const review = () => {
    if (!ready) return;
    const encoded = encodeState(state);
    // Keep the working check on this history entry so Back returns to a filled
    // builder instead of a blank page.
    window.history.replaceState({ builderState: encoded }, '', '/');
    navigate(`/s/${encoded}`);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    review();
  };

  const startOver = () => {
    window.history.replaceState(null, '', '/');
    setState(createInitialState());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="builder-page">
      <div className="page-glow" aria-hidden="true" />
      <div className="shell">
        <SiteHeader />

        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-grid">
              <h1 id="hero-title">
                The check,
                <br />
                <em>divided fairly.</em>
              </h1>
              <div className="hero-aside">
                <p>
                  One bill, a few friends, and a link that carries every share. Tip, tax, and the
                  last cent are settled before the plates are cleared.
                </p>
                <span className="hero-stamp">
                  <LockIcon size={14} />
                  No accounts. No uploads.
                </span>
              </div>
            </div>
          </section>

          {loadError ? (
            <p className="load-note" role="status">
              That shared link couldn&rsquo;t be read, so we started a fresh check.
            </p>
          ) : null}

          <div className="workspace">
            <form id="builder-form" className="editor" onSubmit={onSubmit} noValidate>
              <PeopleEditor state={state} setState={setState} model={model} />
              <BillEditor state={state} setState={setState} model={model} />
              <SplitEditor state={state} setState={setState} model={model} />
            </form>

            <TallyPanel state={state} model={model} onReview={review} />
          </div>

          <footer className="site-footer">
            <p>
              A one-night tool. Your check is computed on this device and travels only inside the link
              you share.
            </p>
            <button type="button" className="text-button" onClick={startOver}>
              Start over
            </button>
          </footer>
        </main>
      </div>

      <aside className="mobile-bar" aria-label="Check total and review">
        <div className="mobile-total">
          <span>Total</span>
          <strong>{formatMoney(model.totals.total)}</strong>
          {!ready ? <em>{nextStep}</em> : null}
        </div>
        <button type="button" className="btn btn-primary" onClick={review} disabled={!ready}>
          Review the split
          <ArrowRightIcon size={18} />
        </button>
      </aside>
    </div>
  );
}
