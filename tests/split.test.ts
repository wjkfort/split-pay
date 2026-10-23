import { describe, expect, it } from 'vitest';
import { allocateEvenly, allocateProportionally, formatMoney, parseMoney, parsePercent } from '../src/lib/money';
import { computeSplit, computeTransfers, minimiseTransfers } from '../src/lib/split';
import {
  buildSummary,
  createInitialState,
  decodeState,
  encodeState,
  seedCustom,
  seedPercents,
  switchMode,
} from '../src/lib/state';
import type { SplitState } from '../src/lib/types';

function makeState(names: string[], overrides: Partial<SplitState> = {}): SplitState {
  const people = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  return {
    ...createInitialState(),
    people,
    payer: people[0].id,
    ...overrides,
  };
}

describe('money', () => {
  it('parses dollars to cents with two decimals', () => {
    expect(parseMoney('12.34')).toBe(1234);
    expect(parseMoney('12.3')).toBe(1230);
    expect(parseMoney('$1,002.10')).toBe(100210);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('-4')).toBe(0);
  });

  it('parses percentages to basis points', () => {
    expect(parsePercent('20')).toBe(2000);
    expect(parsePercent('8.25')).toBe(825);
    expect(parsePercent('101')).toBe(10100);
  });

  it('allocates evenly without losing cents', () => {
    expect(allocateEvenly(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(allocateEvenly(10001, 7).reduce((a, b) => a + b, 0)).toBe(10001);
  });

  it('allocates proportionally without losing cents', () => {
    expect(allocateProportionally(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateProportionally(0, [1, 2])).toEqual([0, 0]);
  });

  it('formats cents as USD', () => {
    expect(formatMoney(1234)).toBe('$12.34');
  });
});

describe('equal and totals', () => {
  it('asks for the bill first in the fast-start flow', () => {
    const state = makeState(['', ''], { bill: '', tipPct: '0' });
    expect(computeSplit(state).issues[0]?.target).toBe('bill');
  });

  it('splits a check equally', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], { bill: '100.00', tipPct: '0' });
    const model = computeSplit(state);
    expect(model.issues).toEqual([]);
    expect(model.totals.total).toBe(10000);
    expect(Object.values(model.shares)).toEqual([3334, 3333, 3333]);
    expect(Object.values(model.shares).reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it('applies tip and tax on the subtotal', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      bill: '100',
      tipPct: '20',
      tax: '8.25',
      taxMode: 'percent',
    });
    const model = computeSplit(state);
    expect(model.totals).toEqual({ subtotal: 10000, tip: 2000, tax: 825, total: 12825 });
    expect(Object.values(model.shares).reduce((a, b) => a + b, 0)).toBe(12825);
  });

  it('never loses a cent on awkward divisions', () => {
    const state = makeState(['A', 'B', 'C', 'D', 'E', 'F', 'G'], { bill: '100.01', tipPct: '0' });
    const model = computeSplit(state);
    expect(Object.values(model.shares).reduce((a, b) => a + b, 0)).toBe(10001);
  });
});

describe('itemized split', () => {
  it('uses by-item when entering item mode from an equal split', () => {
    const state = makeState(['Alex', 'Sam'], { split: 'equal', mode: 'total' });
    expect(switchMode(state, 'items').split).toBe('item');
    expect(switchMode({ ...state, split: 'percent' }, 'items').split).toBe('item');
    expect(switchMode({ ...state, mode: 'items', split: 'item' }, 'total').split).toBe('equal');
  });

  it('splits a shared item and adds tip proportionally', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      mode: 'items',
      split: 'item',
      tipPct: '20',
      items: [
        { id: 'i1', name: 'Fries', price: '10.00', assigned: ['p1', 'p2', 'p3'] },
        { id: 'i2', name: 'Steak', price: '20.00', assigned: ['p1'] },
      ],
    });
    const model = computeSplit(state);
    expect(model.issues).toEqual([]);
    expect(model.totals.subtotal).toBe(3000);
    expect(model.shares).toEqual({ p1: 2801, p2: 400, p3: 399 });
    expect(Object.values(model.shares).reduce((a, b) => a + b, 0)).toBe(3600);
  });

  it('flags unassigned items', () => {
    const state = makeState(['Alex', 'Sam'], {
      mode: 'items',
      split: 'item',
      items: [{ id: 'i1', name: 'Wine', price: '40.00', assigned: [] }],
    });
    const model = computeSplit(state);
    expect(model.unassigned).toBe(4000);
    expect(model.issues.some((issue) => issue.target === 'items')).toBe(true);
  });

  it('keeps the item split unavailable when the bill is a single total', () => {
    const state = makeState(['Alex', 'Sam'], { bill: '20', tipPct: '0', split: 'item' });
    const model = computeSplit(state);
    expect(model.effectiveSplit).toBe('equal');
    expect(model.shares).toEqual({ p1: 1000, p2: 1000 });
  });
});

describe('custom and percentage splits', () => {
  it('accepts custom amounts that match the total', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      bill: '100',
      tipPct: '0',
      split: 'custom',
      custom: { p1: '50', p2: '30', p3: '20' },
    });
    const model = computeSplit(state);
    expect(model.issues).toEqual([]);
    expect(model.shares).toEqual({ p1: 5000, p2: 3000, p3: 2000 });
  });

  it('names the unassigned remainder', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      bill: '100',
      tipPct: '0',
      split: 'custom',
      custom: { p1: '50', p2: '30', p3: '10' },
    });
    const model = computeSplit(state);
    expect(model.customRemaining).toBe(1000);
    expect(model.issues[0].message).toContain('$10.00');
  });

  it('requires percentages to reach 100%', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      bill: '100',
      tipPct: '0',
      split: 'percent',
      percents: { p1: '33.33', p2: '33.33', p3: '33.33' },
    });
    const model = computeSplit(state);
    expect(model.issues.some((issue) => issue.target === 'allocation')).toBe(true);
    expect(model.percentRemainingBps).toBe(1);
  });

  it('allocates percentages exactly', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], {
      bill: '100',
      tipPct: '0',
      split: 'percent',
      percents: { p1: '33.33', p2: '33.33', p3: '33.34' },
    });
    const model = computeSplit(state);
    expect(model.issues).toEqual([]);
    expect(Object.values(model.shares)).toEqual([3333, 3333, 3334]);
  });

  it('seeds even allocations', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], { bill: '100', tipPct: '0' });
    expect(seedCustom(state)).toEqual({ p1: '33.34', p2: '33.33', p3: '33.33' });
    expect(seedPercents(state)).toEqual({ p1: '33.34', p2: '33.33', p3: '33.33' });
  });
});

describe('settlement', () => {
  it('settles a table through the payer with the fewest transfers', () => {
    const state = makeState(['Alex', 'Sam', 'Jo'], { bill: '90', tipPct: '0', payer: 'p1' });
    const model = computeSplit(state);
    const transfers = computeTransfers(state, model.shares);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((transfer) => transfer.to === 'p1')).toBe(true);
    expect(transfers.reduce((sum, transfer) => sum + transfer.amount, 0)).toBe(6000);
  });

  it('finds a zero-sum partition rather than a chain', () => {
    const transfers = minimiseTransfers([
      { id: 'a', balance: 1000 },
      { id: 'b', balance: 1000 },
      { id: 'c', balance: -1000 },
      { id: 'd', balance: -1000 },
    ]);
    expect(transfers).toHaveLength(2);
  });

  it('falls back to the payer when balances do not net out', () => {
    expect(minimiseTransfers([{ id: 'a', balance: 4 }])).toEqual([]);
  });
});

describe('state encoding', () => {
  it('round-trips a full check through the URL', () => {
    const state = makeState(['Alex', 'Sam'], {
      mode: 'items',
      split: 'item',
      tipPct: '18.5',
      items: [{ id: 'i1', name: 'Pasta', price: '24.50', assigned: ['p1'] }],
      payer: 'p2',
    });
    const decoded = decodeState(encodeState(state));
    expect(decoded).toEqual(state);
  });

  it('rejects junk links', () => {
    expect(decodeState('not-a-check')).toBeNull();
    expect(decodeState('')).toBeNull();
  });

  it('builds a copyable summary', () => {
    const state = makeState(['Alex', 'Sam'], { bill: '90', tipPct: '0', payer: 'p1' });
    const summary = buildSummary(state, 'https://example.pages.dev/s/abc');
    expect(summary).toContain('DinnerSplit — $90.00');
    expect(summary).toContain('Sam → Alex $45.00');
    expect(summary).toContain('https://example.pages.dev/s/abc');
  });
});
