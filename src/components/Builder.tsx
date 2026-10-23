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
  const firstTarget = model.issues[0]?.target;
  const shareCents = state.people.map((person) => model.shares[person.id] ?? 0);
  const showEach = model.effectiveSplit === 'equal' && model.totals.total > 0 && shareCents.length > 0;
  const minShare = showEach ? Math.min(...shareCents) : 0;
  const maxShare = showEach ? Math.max(...shareCents) : 0;

  const ctaLabel = ready
    ? 'Review the split'
    : firstTarget === 'bill'
      ? state.mode === 'items'
        ? 'Add an item'
        : 'Add the bill total'
      : firstTarget === 'people'
        ? 'Add the table'
        : firstTarget === 'items'
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

  const goToNextStep = () => {
    const behaviour = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    if (firstTarget === 'bill') {
      const target =
        state.mode === 'items'
          ? document.getElementById('bill-add-item')
          : document.getElementById('bill-amount');
      target?.scrollIntoView({ behavior: behaviour, block: 'center' });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
      return;
    }

    if (firstTarget === 'people') {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.person-name'));
      const input = inputs.find((entry) => entry.value.trim() === '') ?? inputs[0];
      input?.scrollIntoView({ behavior: behaviour, block: 'center' });
      input?.focus({ preventScroll: true });
      return;
    }

    if (firstTarget === 'items') {
      document.querySelector('.item-row.is-unassigned')?.scrollIntoView({ behavior: behaviour, block: 'center' });
      return;
    }

    document.querySelector('.allocation')?.scrollIntoView({ behavior: behaviour, block: 'center' });
  };

  const primaryAction = () => {
    if (ready) review();
    else goToNextStep();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    primaryAction();
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
                  Start with the bill. Add the table. Share one link. Every cent settles itself.
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
              <BillEditor state={state} setState={setState} model={model} />
              <PeopleEditor state={state} setState={setState} />
              <SplitEditor state={state} setState={setState} model={model} />
            </form>

            <TallyPanel
              state={state}
              model={model}
              ready={ready}
              ctaLabel={ctaLabel}
              onAction={primaryAction}
            />
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
          {showEach ? (
            <small className="mobile-each">
              {minShare === maxShare ? formatMoney(minShare) : `${formatMoney(minShare)}–${formatMoney(maxShare)}`}{' '}
              each
            </small>
          ) : null}
        </div>
        <button
          type="button"
          className={`btn ${ready ? 'btn-primary' : 'btn-next'}`}
          onClick={primaryAction}
        >
          {ctaLabel}
          <ArrowRightIcon size={18} />
        </button>
      </aside>
    </div>
  );
}
