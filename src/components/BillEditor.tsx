import type { Dispatch, SetStateAction } from 'react';
import type { SplitResult, SplitState } from '../lib/types';
import {
  formatMoney,
  normaliseMoneyInput,
  sanitiseMoneyInput,
  sanitisePercentInput,
} from '../lib/money';
import {
  addItem,
  assignEveryone,
  personName,
  removeItem,
  switchMode,
  toggleItemPerson,
} from '../lib/state';
import { Avatar } from './Avatar';
import { PlusIcon, TrashIcon } from './Icons';
import { FieldNote, SectionHead } from './Section';

const TIP_PRESETS = [0, 15, 18, 20, 25];

export function BillEditor({
  state,
  setState,
  model,
}: {
  state: SplitState;
  setState: Dispatch<SetStateAction<SplitState>>;
  model: SplitResult;
}) {
  const issue = model.issues.find((entry) => entry.target === 'bill' || entry.target === 'items');

  const update = (patch: Partial<SplitState>) => setState((previous) => ({ ...previous, ...patch }));

  return (
    <section className="panel" aria-labelledby="bill-title">
      <SectionHead
        step="02"
        id="bill-title"
        title="The check"
        copy="One total, or every plate. Tip and tax are handled here."
        aside={<span className="binary-label">{state.mode === 'total' ? 'Total' : 'Items'}</span>}
      />

      <div className="mode-tabs" role="group" aria-label="How to enter the bill">
        <button
          type="button"
          aria-pressed={state.mode === 'total'}
          className="mode-tab"
          onClick={() => setState((previous) => switchMode(previous, 'total'))}
        >
          One total
        </button>
        <button
          type="button"
          aria-pressed={state.mode === 'items'}
          className="mode-tab"
          onClick={() => setState((previous) => switchMode(previous, 'items'))}
        >
          Item by item
        </button>
      </div>

      {state.mode === 'total' ? (
        <div
          className="bill-total-field"
        >
          <label htmlFor="bill-amount">Bill subtotal</label>
          <div className="big-money">
            <span aria-hidden="true">$</span>
            <input
              id="bill-amount"
              value={state.bill}
              onChange={(event) => update({ bill: sanitiseMoneyInput(event.target.value) })}
              onBlur={() => update({ bill: normaliseMoneyInput(state.bill) })}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              aria-describedby="bill-amount-hint"
            />
          </div>
          <p id="bill-amount-hint" className="field-hint">
            Before tip and tax.
          </p>
        </div>
      ) : (
        <div>
          <ul className="item-list">
            {state.items.map((item, index) => {
              const assignedCount = item.assigned.filter((id) =>
                state.people.some((person) => person.id === id),
              ).length;
              const unassigned = item.price.trim() !== '' && assignedCount === 0;
              const itemLabel = item.name.trim() || `Item ${index + 1}`;
              return (
                <li className={`item-row ${unassigned ? 'is-unassigned' : ''}`} key={item.id}>
                  <div className="item-line">
                    <span className="seat" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <input
                      className="item-name"
                      value={item.name}
                      onChange={(event) => {
                        const name = event.target.value.slice(0, 60);
                        setState((previous) => ({
                          ...previous,
                          items: previous.items.map((entry) =>
                            entry.id === item.id ? { ...entry, name } : entry,
                          ),
                        }));
                      }}
                      placeholder="Item name"
                      aria-label={`Item ${index + 1} name`}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={60}
                    />
                    <div className="money-field">
                      <span aria-hidden="true">$</span>
                      <input
                        value={item.price}
                        onChange={(event) => {
                          const price = sanitiseMoneyInput(event.target.value);
                          setState((previous) => ({
                            ...previous,
                            items: previous.items.map((entry) =>
                              entry.id === item.id ? { ...entry, price } : entry,
                            ),
                          }));
                        }}
                        onBlur={() => {
                          setState((previous) => ({
                            ...previous,
                            items: previous.items.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, price: normaliseMoneyInput(entry.price) }
                                : entry,
                            ),
                          }));
                        }}
                        placeholder="0.00"
                        inputMode="decimal"
                        aria-label={`${itemLabel} price`}
                      />
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove ${itemLabel}`}
                      onClick={() => setState((previous) => removeItem(previous, item.id))}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>

                  <div className="assign-row">
                    <span className="assign-label">Split between</span>
                    <div className="assignees">
                      {state.people.map((person, personIndex) => {
                        const on = item.assigned.includes(person.id);
                        const label = personName(person, personIndex);
                        return (
                          <button
                            type="button"
                            className={`assignee ${on ? 'is-on' : ''}`}
                            key={person.id}
                            aria-pressed={on}
                            aria-label={`${on ? 'Remove' : 'Add'} ${label} for ${itemLabel}`}
                            title={label}
                            onClick={() =>
                              setState((previous) => toggleItemPerson(previous, item.id, person.id))
                            }
                          >
                            <Avatar name={person.name} index={personIndex} size="xs" />
                            <span>{person.name.trim().split(/\s+/)[0] || `Guest ${personIndex + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="assign-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setState((previous) => assignEveryone(previous, item.id))}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setState((previous) => ({
                            ...previous,
                            items: previous.items.map((entry) =>
                              entry.id === item.id ? { ...entry, assigned: [] } : entry,
                            ),
                          }))
                        }
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {unassigned ? <p className="inline-warning">Pick at least one person for this item.</p> : null}
                </li>
              );
            })}
          </ul>

          <div className="items-footer">
            <button type="button" className="add-row" onClick={() => setState(addItem)}>
              <PlusIcon size={18} />
              Add an item
            </button>
            <span className="items-subtotal">
              Subtotal <strong>{formatMoney(model.totals.subtotal)}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="bill-extras">
        <div className="control">
          <div className="control-head">
            <span className="control-label" id="tip-label">
              Tip
            </span>
            <span className="control-value">{formatMoney(model.totals.tip)}</span>
          </div>
          <div className="chip-row" role="group" aria-labelledby="tip-label">
            {TIP_PRESETS.map((preset) => (
              <button
                type="button"
                aria-pressed={!state.tipCustom && Number(state.tipPct) === preset}
                className={`chip ${!state.tipCustom && Number(state.tipPct) === preset ? 'is-on' : ''}`}
                key={preset}
                onClick={() => update({ tipPct: String(preset), tipCustom: false })}
              >
                {preset}%
              </button>
            ))}
            <button
              type="button"
              aria-pressed={state.tipCustom}
              className={`chip ${state.tipCustom ? 'is-on' : ''}`}
              onClick={() => update({ tipCustom: true })}
            >
              Custom
            </button>
          </div>
          {state.tipCustom ? (
            <div className="inline-number">
              <input
                value={state.tipPct}
                onChange={(event) => update({ tipPct: sanitisePercentInput(event.target.value) })}
                onBlur={() => {
                  const next = state.tipPct === '' ? '0' : state.tipPct;
                  update({ tipPct: next });
                }}
                placeholder="0"
                inputMode="decimal"
                aria-label="Custom tip percentage"
              />
              <span aria-hidden="true">%</span>
            </div>
          ) : null}
          <p className="field-hint">Tip is calculated on the subtotal.</p>
        </div>

        <div className="control">
          <div className="control-head">
            <label className="control-label" htmlFor="tax-input">
              Tax
            </label>
            <span className="control-value">{formatMoney(model.totals.tax)}</span>
          </div>
          <div className="tax-line">
            <div className="mini-segmented" role="group" aria-label="Tax entry mode">
              <button
                type="button"
                aria-pressed={state.taxMode === 'percent'}
                className={state.taxMode === 'percent' ? 'is-on' : ''}
                onClick={() => update({ taxMode: 'percent' })}
              >
                %
              </button>
              <button
                type="button"
                aria-pressed={state.taxMode === 'amount'}
                className={state.taxMode === 'amount' ? 'is-on' : ''}
                onClick={() => update({ taxMode: 'amount' })}
              >
                $
              </button>
            </div>
            <div className="inline-number tax-input">
              {state.taxMode === 'amount' ? <span aria-hidden="true">$</span> : null}
              <input
                id="tax-input"
                value={state.tax}
                onChange={(event) =>
                  update({
                    tax:
                      state.taxMode === 'amount'
                        ? sanitiseMoneyInput(event.target.value)
                        : sanitisePercentInput(event.target.value),
                  })
                }
                onBlur={() =>
                  update({
                    tax:
                      state.taxMode === 'amount'
                        ? normaliseMoneyInput(state.tax)
                        : state.tax === ''
                          ? ''
                          : state.tax,
                  })
                }
                placeholder="0"
                inputMode="decimal"
                aria-label={state.taxMode === 'amount' ? 'Tax amount' : 'Tax percentage'}
              />
              {state.taxMode === 'percent' ? <span aria-hidden="true">%</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bill-summary" aria-label="Bill summary">
        <div>
          <span>Subtotal</span>
          <span>{formatMoney(model.totals.subtotal)}</span>
        </div>
        <div>
          <span>Tip</span>
          <span>{formatMoney(model.totals.tip)}</span>
        </div>
        <div>
          <span>Tax</span>
          <span>{formatMoney(model.totals.tax)}</span>
        </div>
        <div className="bill-summary-total">
          <span>Total</span>
          <span>{formatMoney(model.totals.total)}</span>
        </div>
      </div>

      {issue ? (
        <FieldNote tone={issue.target === 'items' ? 'error' : 'hint'}>{issue.message}</FieldNote>
      ) : null}
    </section>
  );
}
