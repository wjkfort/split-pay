import type { Dispatch, SetStateAction } from 'react';
import type { SplitMethod, SplitResult, SplitState } from '../lib/types';
import { formatMoney, normaliseMoneyInput, sanitiseMoneyInput, sanitisePercentInput } from '../lib/money';
import { personName, seedCustom, seedPercents, withSplitMethod } from '../lib/state';
import { Avatar } from './Avatar';
import { CheckIcon, EqualIcon, PercentIcon, ReceiptIcon, RotateIcon, SlidersIcon } from './Icons';
import { SectionHead } from './Section';

const METHODS: {
  key: SplitMethod;
  title: string;
  copy: string;
  icon: typeof EqualIcon;
}[] = [
  { key: 'equal', title: 'Equal', copy: 'Same share for everyone', icon: EqualIcon },
  { key: 'custom', title: 'Custom', copy: 'Type each final amount', icon: SlidersIcon },
  { key: 'percent', title: 'Percent', copy: 'Set a share for each person', icon: PercentIcon },
  { key: 'item', title: 'By item', copy: 'Each person pays for their plates', icon: ReceiptIcon },
];

export function SplitEditor({
  state,
  setState,
  model,
}: {
  state: SplitState;
  setState: Dispatch<SetStateAction<SplitState>>;
  model: SplitResult;
}) {
  const allocationIssue = model.issues.find((entry) => entry.target === 'allocation');
  const method = METHODS.find((entry) => entry.key === model.effectiveSplit) ?? METHODS[0];
  const isPercent = state.split === 'percent';
  const showAllocation = model.effectiveSplit === 'custom' || model.effectiveSplit === 'percent';

  const resetToEqual = () => setState((previous) => withSplitMethod(previous, 'equal'));

  const resetAllocation = () =>
    setState((previous) =>
      previous.split === 'percent'
        ? { ...previous, percents: seedPercents(previous) }
        : { ...previous, custom: seedCustom(previous) },
    );

  return (
    <section className="panel" aria-labelledby="split-title">
      <SectionHead
        step="03"
        id="split-title"
        title="The split"
        copy="Choose how the table divides it. Every cent is accounted for."
        aside={<span className="binary-label">{method.title}</span>}
      />

      <div className="methods" role="group" aria-label="Split method">
        {METHODS.map((entry) => {
          const Icon = entry.icon;
          const disabled = entry.key === 'item' && state.mode !== 'items';
          const checked = model.effectiveSplit === entry.key;
          return (
            <button
              type="button"
              aria-pressed={checked}
              aria-disabled={disabled}
              key={entry.key}
              className={`method ${checked ? 'is-on' : ''}`}
              disabled={disabled}
              title={disabled ? 'Switch to item by item to use this split' : undefined}
              onClick={() => setState((previous) => withSplitMethod(previous, entry.key))}
            >
              <span className="method-icon">
                <Icon size={19} />
              </span>
              <span className="method-copy">
                <strong>{entry.title}</strong>
                <small>{disabled ? 'Item by item only' : entry.copy}</small>
              </span>
              <span className="method-check" aria-hidden="true">
                <CheckIcon size={13} />
              </span>
            </button>
          );
        })}
      </div>

      {showAllocation ? (
        <div className="allocation">
          <div className="allocation-head">
            <div>
              <h3>{isPercent ? 'Share of the check' : 'Final amount per person'}</h3>
              <p>
                {isPercent
                  ? `Must add up to 100% of ${formatMoney(model.totals.total)}.`
                  : `Must add up to ${formatMoney(model.totals.total)}, tip and tax included.`}
              </p>
            </div>
            <button type="button" className="text-button" onClick={resetAllocation}>
              <RotateIcon size={14} />
              Split evenly
            </button>
          </div>

          <ul className="allocation-list">
            {state.people.map((person, index) => {
              const value = isPercent
                ? (state.percents[person.id] ?? '')
                : (state.custom[person.id] ?? '');
              return (
                <li className="allocation-row" key={person.id}>
                  <span className="seat" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Avatar name={person.name} index={index} size="sm" />
                  <span className="allocation-name">{personName(person, index)}</span>
                  <div className="inline-number allocation-input">
                    {isPercent ? null : <span aria-hidden="true">$</span>}
                    <input
                      value={value}
                      onChange={(event) => {
                        const raw = isPercent
                          ? sanitisePercentInput(event.target.value)
                          : sanitiseMoneyInput(event.target.value);
                        setState((previous) => ({
                          ...previous,
                          ...(isPercent
                            ? { percents: { ...previous.percents, [person.id]: raw } }
                            : { custom: { ...previous.custom, [person.id]: raw } }),
                        }));
                      }}
                      onBlur={() => {
                        if (!isPercent) {
                          setState((previous) => ({
                            ...previous,
                            custom: {
                              ...previous.custom,
                              [person.id]: normaliseMoneyInput(previous.custom[person.id] ?? ''),
                            },
                          }));
                        }
                      }}
                      placeholder="0"
                      inputMode="decimal"
                      aria-label={
                        isPercent
                          ? `${personName(person, index)} percentage`
                          : `${personName(person, index)} amount`
                      }
                    />
                    {isPercent ? <span aria-hidden="true">%</span> : null}
                  </div>
                  {isPercent ? (
                    <span className="allocation-preview">{formatMoney(model.shares[person.id] ?? 0)}</span>
                  ) : (
                    <span className="allocation-preview allocation-pct">
                      {model.totals.total > 0
                        ? `${Math.round(((model.shares[person.id] ?? 0) / model.totals.total) * 100)}%`
                        : '—'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className={`allocation-status ${allocationIssue ? 'is-warn' : 'is-good'}`} aria-live="polite">
            {allocationIssue ? (
              <span>{allocationIssue.message}</span>
            ) : (
              <span>
                {isPercent
                  ? `100% allocated — ${formatMoney(model.totals.total)} in total.`
                  : `All ${formatMoney(model.totals.total)} allocated.`}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {model.effectiveSplit === 'item' ? (
        <div className="item-method-note">
          <span className="method-icon">
            <ReceiptIcon size={18} />
          </span>
          <p>
            Tip and tax are spread by what each person ordered. Assign every item above, or use{' '}
            <button
              type="button"
              className="text-button inline-text-button"
              onClick={() => resetToEqual()}
            >
              an equal split
            </button>
            .
          </p>
        </div>
      ) : null}

      <div className="payer">
        <div className="payer-head">
          <h3>Who covered the check?</h3>
          <p>We&rsquo;ll point every transfer at them. Skip this if nobody needs to pay anyone back.</p>
        </div>
        <div className="payer-options">
          {state.people.map((person, index) => {
            const on = state.payer === person.id;
            const name = personName(person, index);
            return (
              <button
                type="button"
                key={person.id}
                className={`payer-chip ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                onClick={() => setState((previous) => ({ ...previous, payer: person.id }))}
              >
                <Avatar name={person.name} index={index} size="xs" />
                <span>{name}</span>
                {on ? <CheckIcon size={13} /> : null}
              </button>
            );
          })}
          <button
            type="button"
            className={`payer-chip payer-none ${state.payer === null ? 'is-on' : ''}`}
            aria-pressed={state.payer === null}
            onClick={() => setState((previous) => ({ ...previous, payer: null }))}
          >
            <span className="payer-none-mark" aria-hidden="true">
              —
            </span>
            <span>Not now</span>
          </button>
        </div>
        {state.payer === null ? (
          <p className="field-hint">No payer set, so the result will show shares without transfers.</p>
        ) : null}
      </div>

    </section>
  );
}
