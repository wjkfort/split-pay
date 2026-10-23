import type { Dispatch, SetStateAction } from 'react';
import type { SplitResult, SplitState } from '../lib/types';
import { addPerson, MAX_PEOPLE, personName, removePerson } from '../lib/state';
import { Avatar } from './Avatar';
import { PlusIcon, TrashIcon } from './Icons';
import { FieldNote, SectionHead } from './Section';

export function PeopleEditor({
  state,
  setState,
  model,
}: {
  state: SplitState;
  setState: Dispatch<SetStateAction<SplitState>>;
  model: SplitResult;
}) {
  const issue = model.issues.find((entry) => entry.target === 'people');

  return (
    <section className="panel" aria-labelledby="people-title">
      <SectionHead
        step="01"
        id="people-title"
        title="The table"
        copy="Who shared the meal? Two names minimum."
        aside={
          <span className="table-count">
            {state.people.length}
            <small>at the table</small>
          </span>
        }
      />

      <ul className="people-list">
        {state.people.map((person, index) => (
          <li className="person-row" key={person.id}>
            <span className="seat" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Avatar name={person.name} index={index} />
            <input
              className="person-name"
              value={person.name}
              onChange={(event) => {
                const name = event.target.value.slice(0, 40);
                setState((previous) => ({
                  ...previous,
                  people: previous.people.map((entry) =>
                    entry.id === person.id ? { ...entry, name } : entry,
                  ),
                }));
              }}
              placeholder={index === 0 ? 'Your name' : 'Name'}
              aria-label={`Person ${index + 1} name`}
              autoComplete="off"
              spellCheck={false}
              maxLength={40}
            />
            <button
              type="button"
              className="icon-button remove-person"
              onClick={() => setState((previous) => removePerson(previous, person.id))}
              disabled={state.people.length <= 2}
              aria-label={`Remove ${personName(person, index)}`}
              title={state.people.length <= 2 ? 'A split needs at least two people' : 'Remove person'}
            >
              <TrashIcon size={17} />
            </button>
          </li>
        ))}
      </ul>

      <div className="people-actions">
        <button
          type="button"
          className="add-row"
          onClick={() => setState(addPerson)}
          disabled={state.people.length >= MAX_PEOPLE}
        >
          <PlusIcon size={18} />
          {state.people.length >= MAX_PEOPLE ? 'A table of twelve is plenty' : 'Add a person'}
        </button>
        <span className="seat-limit">2–{MAX_PEOPLE} people</span>
      </div>

      {issue ? <FieldNote tone="hint">{issue.message}</FieldNote> : null}
    </section>
  );
}
