export type BillMode = 'total' | 'items';
export type TaxMode = 'percent' | 'amount';
export type SplitMethod = 'equal' | 'custom' | 'percent' | 'item';

export interface Person {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  price: string;
  assigned: string[];
}

export interface SplitState {
  version: 1;
  people: Person[];
  mode: BillMode;
  bill: string;
  tipPct: string;
  tipCustom: boolean;
  tax: string;
  taxMode: TaxMode;
  items: Item[];
  split: SplitMethod;
  custom: Record<string, string>;
  percents: Record<string, string>;
  payer: string | null;
}

export interface Issue {
  target: 'people' | 'bill' | 'items' | 'allocation';
  message: string;
}

export interface BillTotals {
  subtotal: number;
  tip: number;
  tax: number;
  total: number;
}

export interface SplitResult {
  totals: BillTotals;
  shares: Record<string, number>;
  unassigned: number;
  customRemaining: number;
  percentRemainingBps: number;
  effectiveSplit: SplitMethod;
  issues: Issue[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}
