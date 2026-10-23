import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { allocateEvenly, formatMoney, sanitiseMoneyInput, sanitisePercentInput } from './money';
import { computeSplit, computeTotals, computeTransfers } from './split';
import type { BillMode, Item, Person, SplitMethod, SplitState, TaxMode } from './types';

export const MAX_PEOPLE = 12;
const MAX_ITEMS = 100;
const MAX_PAYLOAD = 20_000;

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createPerson(name = ''): Person {
  return { id: newId('p'), name };
}

export function createItem(assigned: string[]): Item {
  return { id: newId('i'), name: '', price: '', assigned };
}

export function createInitialState(): SplitState {
  const first = createPerson();
  const second = createPerson();
  return {
    version: 1,
    people: [first, second],
    mode: 'total',
    bill: '',
    tipPct: '20',
    tipCustom: false,
    tax: '',
    taxMode: 'percent',
    items: [],
    split: 'equal',
    custom: {},
    percents: {},
    payer: first.id,
  };
}

export function personName(person: Person, index: number): string {
  return person.name.trim() || `Guest ${index + 1}`;
}

export function nameFor(state: SplitState, id: string): string {
  const index = state.people.findIndex((person) => person.id === id);
  if (index === -1) return 'Someone';
  return personName(state.people[index], index);
}

export function seedCustom(state: SplitState): Record<string, string> {
  const total = computeTotals(state).total;
  const parts = allocateEvenly(total, state.people.length);
  const next: Record<string, string> = {};
  state.people.forEach((person, index) => {
    next[person.id] = (parts[index] / 100).toFixed(2);
  });
  return next;
}

export function seedPercents(state: SplitState): Record<string, string> {
  const parts = allocateEvenly(10000, state.people.length);
  const next: Record<string, string> = {};
  state.people.forEach((person, index) => {
    next[person.id] = (parts[index] / 100).toFixed(2);
  });
  return next;
}

export function withSplitMethod(state: SplitState, method: SplitMethod): SplitState {
  if (method === 'custom') {
    const complete =
      state.people.length > 0 && state.people.every((person) => state.custom[person.id] !== undefined);
    return { ...state, split: method, custom: complete ? state.custom : seedCustom(state) };
  }
  if (method === 'percent') {
    const complete =
      state.people.length > 0 && state.people.every((person) => state.percents[person.id] !== undefined);
    return { ...state, split: method, percents: complete ? state.percents : seedPercents(state) };
  }
  return { ...state, split: method };
}

export function addPerson(state: SplitState): SplitState {
  if (state.people.length >= MAX_PEOPLE) return state;
  return { ...state, people: [...state.people, createPerson()] };
}

export function removePerson(state: SplitState, id: string): SplitState {
  if (state.people.length <= 2) return state;
  const people = state.people.filter((person) => person.id !== id);
  const items = state.items.map((item) => ({
    ...item,
    assigned: item.assigned.filter((personId) => personId !== id),
  }));
  const custom = { ...state.custom };
  const percents = { ...state.percents };
  delete custom[id];
  delete percents[id];
  return {
    ...state,
    people,
    items,
    custom,
    percents,
    payer: state.payer === id ? null : state.payer,
  };
}

export function addItem(state: SplitState): SplitState {
  if (state.items.length >= MAX_ITEMS) return state;
  return {
    ...state,
    items: [...state.items, createItem(state.people.map((person) => person.id))],
  };
}

export function removeItem(state: SplitState, id: string): SplitState {
  return { ...state, items: state.items.filter((item) => item.id !== id) };
}

export function toggleItemPerson(state: SplitState, itemId: string, personId: string): SplitState {
  return {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== itemId) return item;
      const assigned = item.assigned.includes(personId)
        ? item.assigned.filter((id) => id !== personId)
        : [...item.assigned, personId];
      return { ...item, assigned };
    }),
  };
}

export function assignEveryone(state: SplitState, itemId: string): SplitState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, assigned: state.people.map((person) => person.id) } : item,
    ),
  };
}

export function switchMode(state: SplitState, mode: BillMode): SplitState {
  if (mode === 'items') {
    // Entering item mode is a deliberate choice to track plates, so by-item is
    // the only method that makes use of the new detail.
    return { ...state, mode, split: 'item' };
  }
  return { ...state, mode, split: state.split === 'item' ? 'equal' : state.split };
}

export function encodeState(state: SplitState): string {
  // lz-string's URI alphabet uses '+', which is ambiguous in some path
  // handlers. A period is not in that alphabet and is path-safe, so swap it.
  return compressToEncodedURIComponent(JSON.stringify(state)).replace(/\+/g, '.');
}

export function decodeState(encoded: string | null | undefined): SplitState | null {
  if (!encoded || encoded.length > MAX_PAYLOAD) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded.replace(/\./g, '+'));
    if (!json) return null;
    const raw = JSON.parse(json) as unknown;
    return normaliseState(raw);
  } catch {
    return null;
  }
}

function normaliseState(raw: unknown): SplitState | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Record<string, unknown>;
  if (input.version !== 1) return null;

  if (!Array.isArray(input.people)) return null;
  const people: Person[] = [];
  const seenIds = new Set<string>();
  for (const entry of input.people.slice(0, MAX_PEOPLE)) {
    if (!entry || typeof entry !== 'object') return null;
    const person = entry as Record<string, unknown>;
    if (typeof person.id !== 'string' || person.id.length === 0 || person.id.length > 40) return null;
    if (seenIds.has(person.id)) return null;
    seenIds.add(person.id);
    people.push({
      id: person.id,
      name: typeof person.name === 'string' ? person.name.slice(0, 80) : '',
    });
  }
  if (people.length < 2 || people.length > MAX_PEOPLE) return null;

  const mode: BillMode = input.mode === 'items' ? 'items' : 'total';
  const taxMode: TaxMode = input.taxMode === 'amount' ? 'amount' : 'percent';
  const split: SplitMethod =
    input.split === 'custom' || input.split === 'percent' || input.split === 'item'
      ? input.split
      : 'equal';

  const bill = typeof input.bill === 'string' ? sanitiseMoneyInput(input.bill.slice(0, 20)) : '';
  const tipPct = typeof input.tipPct === 'string' ? sanitisePercentInput(input.tipPct.slice(0, 10)) : '20';
  const tax =
    typeof input.tax === 'string'
      ? taxMode === 'amount'
        ? sanitiseMoneyInput(input.tax.slice(0, 20))
        : sanitisePercentInput(input.tax.slice(0, 10))
      : '';

  const items: Item[] = [];
  if (Array.isArray(input.items)) {
    for (const entry of input.items.slice(0, MAX_ITEMS)) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      if (typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 40) continue;
      if (items.some((existing) => existing.id === item.id)) continue;
      const assigned = Array.isArray(item.assigned)
        ? [...new Set(item.assigned.filter((id): id is string => typeof id === 'string' && seenIds.has(id)))]
        : [];
      items.push({
        id: item.id,
        name: typeof item.name === 'string' ? item.name.slice(0, 80) : '',
        price: typeof item.price === 'string' ? sanitiseMoneyInput(item.price.slice(0, 20)) : '',
        assigned,
      });
    }
  }

  const custom: Record<string, string> = {};
  if (input.custom && typeof input.custom === 'object') {
    for (const person of people) {
      const value = (input.custom as Record<string, unknown>)[person.id];
      if (typeof value === 'string') custom[person.id] = sanitiseMoneyInput(value.slice(0, 20));
    }
  }

  const percents: Record<string, string> = {};
  if (input.percents && typeof input.percents === 'object') {
    for (const person of people) {
      const value = (input.percents as Record<string, unknown>)[person.id];
      if (typeof value === 'string') percents[person.id] = sanitisePercentInput(value.slice(0, 10));
    }
  }

  const payer = typeof input.payer === 'string' && seenIds.has(input.payer) ? input.payer : null;

  return {
    version: 1,
    people,
    mode,
    bill,
    tipPct: tipPct === '' ? '0' : tipPct,
    tipCustom: input.tipCustom === true,
    tax,
    taxMode,
    items,
    split: mode === 'total' && split === 'item' ? 'equal' : split,
    custom,
    percents,
    payer,
  };
}

export function buildSummary(state: SplitState, url: string): string {
  const model = computeSplit(state);
  const transfers = computeTransfers(state, model.shares);
  const lines: string[] = [`DinnerSplit — ${formatMoney(model.totals.total)}`, ''];

  state.people.forEach((person, index) => {
    const paid = person.id === state.payer ? ' (paid)' : '';
    lines.push(`${personName(person, index)}${paid} — ${formatMoney(model.shares[person.id] ?? 0)}`);
  });

  lines.push('', `Tip ${formatMoney(model.totals.tip)} · Tax ${formatMoney(model.totals.tax)}`);

  if (transfers.length > 0) {
    lines.push('', 'Settle up:');
    for (const transfer of transfers) {
      lines.push(
        `${nameFor(state, transfer.from)} → ${nameFor(state, transfer.to)} ${formatMoney(transfer.amount)}`,
      );
    }
  } else if (state.payer) {
    lines.push('', 'No transfers needed.');
  }

  lines.push('', url);
  return lines.join('\n');
}
