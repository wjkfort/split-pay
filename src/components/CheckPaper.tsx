import type { SplitResult, SplitState, Transfer } from '../lib/types';
import { formatMoney, parsePercent, percentToLabel } from '../lib/money';
import { nameFor, personName } from '../lib/state';

export function CheckPaper({
  state,
  model,
  transfers,
  host,
}: {
  state: SplitState;
  model: SplitResult;
  transfers: Transfer[];
  host: string;
}) {
  const tipBps = parsePercent(state.tipPct);
  const payerName = state.payer ? nameFor(state, state.payer) : null;
  const tipText = tipBps > 0 ? `${percentToLabel(tipBps)}% tip` : 'No tip';

  return (
    <article className="check-paper" aria-label={`Shared check for ${formatMoney(model.totals.total)}`}>
      <div className="check-top">
        <div className="check-brand">
          <span className="check-brand-name">DinnerSplit</span>
          <span className="check-brand-type">Shared check</span>
        </div>
        <div className="check-seats" aria-label={`${state.people.length} guests`}>
          <span>{String(state.people.length).padStart(2, '0')}</span>
          <small>guests</small>
        </div>
      </div>

      <div className="check-total">
        <span className="check-total-label">Total</span>
        <span className="check-total-amount">{formatMoney(model.totals.total)}</span>
      </div>
      <p className="check-meta">
        {tipText}
        <span className="check-meta-dot" aria-hidden="true">
          ·
        </span>
        {payerName ? `${payerName} paid` : 'Payer not set'}
      </p>

      <div className="check-rule" />

      <ul className="check-people">
        {state.people.map((person, index) => {
          const isPayer = person.id === state.payer;
          return (
            <li className={isPayer ? 'is-payer' : ''} key={person.id}>
              <span className="check-seat" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="check-name">
                {personName(person, index)}
                {isPayer ? <span className="check-paid">paid</span> : null}
              </span>
              <span className="check-share">{formatMoney(model.shares[person.id] ?? 0)}</span>
            </li>
          );
        })}
      </ul>

      <div className="check-rule" />

      <dl className="check-breakdown">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(model.totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Tip{tipBps > 0 ? ` · ${percentToLabel(tipBps)}%` : ''}</dt>
          <dd>{formatMoney(model.totals.tip)}</dd>
        </div>
        <div>
          <dt>Tax</dt>
          <dd>{formatMoney(model.totals.tax)}</dd>
        </div>
        <div className="check-breakdown-total">
          <dt>Total</dt>
          <dd>{formatMoney(model.totals.total)}</dd>
        </div>
      </dl>

      {payerName ? (
        <>
          <div className="check-rule" />
          <section className="check-settle" aria-labelledby="settle-title">
            <h2 id="settle-title">Settle up</h2>
            {transfers.length > 0 ? (
              <>
                <ul>
                  {transfers.map((transfer) => (
                    <li key={`${transfer.from}-${transfer.to}-${transfer.amount}`}>
                      <span className="check-transfer-names">
                        {nameFor(state, transfer.from)}
                        <span className="check-arrow" aria-label="pays">
                          →
                        </span>
                        {nameFor(state, transfer.to)}
                      </span>
                      <span className="check-transfer-amount">{formatMoney(transfer.amount)}</span>
                    </li>
                  ))}
                </ul>
                <p className="check-note">
                  {transfers.length} {transfers.length === 1 ? 'transfer' : 'transfers'} — the fewest this
                  table needs.
                </p>
              </>
            ) : (
              <p className="check-note">No transfers needed. Every share is already settled.</p>
            )}
          </section>
        </>
      ) : (
        <p className="check-note check-note-standalone">
          No payer was set, so this check shows shares only. Open the split to add who paid.
        </p>
      )}

      <footer className="check-footer">
        <span>{host}</span>
        <span>No account. No database.</span>
      </footer>
    </article>
  );
}
