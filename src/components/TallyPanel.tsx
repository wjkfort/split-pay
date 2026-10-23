import type { SplitResult, SplitState } from '../lib/types';
import { formatMoney, parsePercent, percentToLabel } from '../lib/money';
import { nameFor, personName } from '../lib/state';
import { Avatar } from './Avatar';
import { ArrowRightIcon, LockIcon } from './Icons';

export function TallyPanel({
  state,
  model,
  onReview,
}: {
  state: SplitState;
  model: SplitResult;
  onReview: () => void;
}) {
  const ready = model.issues.length === 0;
  const firstIssue = model.issues[0];
  const tipBps = parsePercent(state.tipPct);

  return (
    <aside className="tally" aria-label="Live tally">
      <div className="tally-clip" aria-hidden="true" />
      <div className="tally-head">
        <span className="tally-label">The tally</span>
        <span className="tally-live">
          <span className="tally-dot" aria-hidden="true" />
          Live
        </span>
      </div>

      <p className="tally-total">{formatMoney(model.totals.total)}</p>
      <p className="tally-sub">
        {state.people.length} {state.people.length === 1 ? 'person' : 'people'}
        {tipBps > 0 ? ` · ${percentToLabel(tipBps)}% tip` : ' · no tip'}
      </p>

      <ul className="tally-people">
        {state.people.map((person, index) => (
          <li key={person.id}>
            <span className="tally-seat" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Avatar name={person.name} index={index} size="xs" />
            <span className="tally-name">
              {personName(person, index)}
              {person.id === state.payer ? <span className="tally-paid">paid</span> : null}
            </span>
            <span className="tally-amount">{formatMoney(model.shares[person.id] ?? 0)}</span>
          </li>
        ))}
      </ul>

      <dl className="tally-breakdown">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(model.totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Tip</dt>
          <dd>{formatMoney(model.totals.tip)}</dd>
        </div>
        <div>
          <dt>Tax</dt>
          <dd>{formatMoney(model.totals.tax)}</dd>
        </div>
      </dl>

      <div className="tally-payer">
        <span className="tally-payer-label">Paid by</span>
        <span className="tally-payer-name">{state.payer ? nameFor(state, state.payer) : 'Not set'}</span>
      </div>

      {!ready && firstIssue ? <p className="tally-issue">{firstIssue.message}</p> : null}
      {ready && state.payer === null ? (
        <p className="tally-issue">Pick who paid the check to show who pays whom.</p>
      ) : null}

      <button
        type="button"
        className="btn btn-primary tally-cta"
        onClick={onReview}
        disabled={!ready}
      >
        Review the split
        <ArrowRightIcon size={18} />
      </button>

      <p className="tally-privacy">
        <LockIcon size={13} />
        Computed on this device. The link is the only copy.
      </p>
    </aside>
  );
}
