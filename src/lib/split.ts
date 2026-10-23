import { allocateEvenly, allocateProportionally, formatMoney, parseMoney, parsePercent, percentToLabel } from './money';
import type { Issue, SplitResult, SplitState, Transfer } from './types';

export function computeTotals(state: SplitState) {
  const subtotal =
    state.mode === 'items'
      ? state.items.reduce((sum, item) => sum + parseMoney(item.price), 0)
      : parseMoney(state.bill);
  const tipBps = parsePercent(state.tipPct);
  const tip = Math.round((subtotal * tipBps) / 10000);
  const taxBps = state.taxMode === 'percent' ? parsePercent(state.tax) : 0;
  const tax = state.taxMode === 'percent' ? Math.round((subtotal * taxBps) / 10000) : parseMoney(state.tax);
  return { subtotal, tip, tax, total: subtotal + tip + tax };
}

export function computeBaseShares(state: SplitState): { shares: Record<string, number>; unassigned: number } {
  const shares: Record<string, number> = {};
  for (const person of state.people) shares[person.id] = 0;

  let unassigned = 0;
  for (const item of state.items) {
    const cents = parseMoney(item.price);
    if (cents <= 0) continue;
    const recipients = [...new Set(item.assigned)].filter((id) => id in shares);
    if (recipients.length === 0) {
      unassigned += cents;
      continue;
    }
    const parts = allocateEvenly(cents, recipients.length);
    recipients.forEach((id, index) => {
      shares[id] += parts[index];
    });
  }
  return { shares, unassigned };
}

export function computeSplit(state: SplitState): SplitResult {
  const totals = computeTotals(state);
  const issues: Issue[] = [];
  const shares: Record<string, number> = {};
  for (const person of state.people) shares[person.id] = 0;

  if (state.people.length < 2) {
    issues.push({ target: 'people', message: 'Add at least two people to split the check.' });
  }
  if (state.people.some((person) => person.name.trim() === '')) {
    issues.push({ target: 'people', message: 'Give everyone at the table a name.' });
  }
  if (totals.subtotal <= 0) {
    issues.push({
      target: 'bill',
      message: state.mode === 'items' ? 'Add the first item to start the check.' : 'Add the bill total to see each share.',
    });
  }

  let unassigned = 0;
  let customRemaining = 0;
  let percentRemainingBps = 0;
  let effectiveSplit: SplitState['split'] = state.split;

  if (effectiveSplit === 'item' && state.mode !== 'items') effectiveSplit = 'equal';

  if (effectiveSplit === 'item') {
    const base = computeBaseShares(state);
    unassigned = base.unassigned;
    Object.assign(shares, base.shares);

    if (unassigned > 0) {
      issues.push({
        target: 'items',
        message: `${formatMoney(unassigned)} of items has no one assigned. Assign every item to at least one person.`,
      });
    }

    const extra = totals.tip + totals.tax;
    const extraShares = allocateProportionally(
      extra,
      state.people.map((person) => base.shares[person.id]),
    );
    state.people.forEach((person, index) => {
      shares[person.id] += extraShares[index];
    });
  } else if (effectiveSplit === 'custom') {
    const values = state.people.map((person) => parseMoney(state.custom[person.id] ?? ''));
    state.people.forEach((person, index) => {
      shares[person.id] = values[index];
    });
    customRemaining = totals.total - values.reduce((sum, value) => sum + value, 0);
    if (customRemaining !== 0 && totals.total > 0) {
      issues.push({
        target: 'allocation',
        message:
          customRemaining > 0
            ? `${formatMoney(customRemaining)} is still unassigned. The custom amounts must add up to ${formatMoney(totals.total)}.`
            : `Custom amounts are ${formatMoney(-customRemaining)} over the ${formatMoney(totals.total)} total.`,
      });
    }
  } else if (effectiveSplit === 'percent') {
    const bps = state.people.map((person) => parsePercent(state.percents[person.id] ?? ''));
    percentRemainingBps = 10000 - bps.reduce((sum, value) => sum + value, 0);
    const parts = allocateProportionally(totals.total, bps);
    state.people.forEach((person, index) => {
      shares[person.id] = parts[index];
    });
    if (percentRemainingBps !== 0 && totals.total > 0) {
      issues.push({
        target: 'allocation',
        message:
          percentRemainingBps > 0
            ? `Percentages add up to ${percentToLabel(10000 - percentRemainingBps)}%. Add ${percentToLabel(percentRemainingBps)}% to reach 100%.`
            : `Percentages add up to ${percentToLabel(10000 - percentRemainingBps)}%. Remove ${percentToLabel(-percentRemainingBps)}% to reach 100%.`,
      });
    }
  } else {
    const parts = allocateEvenly(totals.total, state.people.length);
    state.people.forEach((person, index) => {
      shares[person.id] = parts[index];
    });
  }

  return {
    totals,
    shares,
    unassigned,
    customRemaining,
    percentRemainingBps,
    effectiveSplit,
    issues,
  };
}

export function computeTransfers(state: SplitState, shares: Record<string, number>): Transfer[] {
  if (!state.payer || !(state.payer in shares)) return [];
  const paid = Object.values(shares).reduce((sum, value) => sum + value, 0);
  const balances = state.people.map((person) => ({
    id: person.id,
    balance: (person.id === state.payer ? paid : 0) - shares[person.id],
  }));
  return minimiseTransfers(balances);
}

/**
 * Exact minimum-transfer settlement: partition balances into as many zero-sum
 * groups as possible, then settle each group with at most (size - 1) transfers.
 * 2^12 states keeps this instant for a table of twelve.
 */
export function minimiseTransfers(balances: { id: string; balance: number }[]): Transfer[] {
  const entries = balances.filter((entry) => entry.balance !== 0);
  if (entries.length === 0) return [];
  if (entries.reduce((sum, entry) => sum + entry.balance, 0) !== 0) return [];

  if (entries.length > 14) {
    return settleGroup(entries);
  }

  const count = entries.length;
  const size = 1 << count;
  const sums = new Float64Array(size);
  for (let mask = 1; mask < size; mask += 1) {
    const low = mask & -mask;
    const index = 31 - Math.clz32(low);
    sums[mask] = sums[mask ^ low] + entries[index].balance;
  }

  const full = size - 1;
  if (sums[full] !== 0) return [];

  const memo = new Map<number, number>();
  const pick = new Map<number, number>();

  const solve = (mask: number): number => {
    if (mask === 0) return 0;
    const cached = memo.get(mask);
    if (cached !== undefined) return cached;

    const low = mask & -mask;
    const rest = mask ^ low;
    let best = -1;
    let bestSub = 0;

    for (let sub = rest; ; sub = (sub - 1) & rest) {
      const candidate = sub | low;
      if (sums[candidate] === 0) {
        const value = 1 + solve(mask ^ candidate);
        if (value > best) {
          best = value;
          bestSub = candidate;
        }
      }
      if (sub === 0) break;
    }

    memo.set(mask, best);
    pick.set(mask, bestSub);
    return best;
  };

  solve(full);

  const groups: { id: string; balance: number }[][] = [];
  let mask = full;
  while (mask !== 0) {
    const sub = pick.get(mask);
    if (!sub) break;
    const group: { id: string; balance: number }[] = [];
    for (let index = 0; index < count; index += 1) {
      if (sub & (1 << index)) group.push(entries[index]);
    }
    groups.push(group);
    mask ^= sub;
  }

  return groups.flatMap((group) => settleGroup(group));
}

function settleGroup(group: { id: string; balance: number }[]): Transfer[] {
  const debtors = group
    .filter((entry) => entry.balance < 0)
    .map((entry) => ({ id: entry.id, amount: -entry.balance }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  const creditors = group
    .filter((entry) => entry.balance > 0)
    .map((entry) => ({ id: entry.id, amount: entry.balance }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > 0) {
      transfers.push({ from: debtor.id, to: creditor.id, amount });
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return transfers;
}
