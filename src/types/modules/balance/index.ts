export interface IBalance {
  id: number;
  guid: string;
  // Decimal serialized as a string by DRF (e.g. "0.00") — parse before use.
  amount: string;
  created_at: string;
}

// GET /payments/balance-transaction/my-list/ item — `type` values seen so far
// are "top_up"/"withdrawal", but the backend may add more, so it's kept as a
// plain string and translated with a fallback (see BalanceHistoryModal).
export interface IBalanceTransaction {
  id: number;
  guid: string;
  type: string;
  amount: string;
  balance_after: string;
  created_at: string;
}
