export type TEscrowStatus = "pending" | "held" | "awaiting_confirm" | "disputed" | "released" | "refunded";

// POST /payments/escrow/create/ response — slimmer than the detail
// projection; `commission_warning` surfaces provider-fee caveats inline.
export interface IEscrowCreateResult {
  id: number;
  guid: string;
  order: number;
  status: TEscrowStatus;
  amount: string;
  commission_warning: string;
}

export interface IEscrowDetailOrder {
  id: number;
  guid: string;
  order_number: string;
}

// GET /payments/escrow/detail/{order_guid}/ — only the order's customer or
// master can read it.
export interface IEscrowDetail {
  id: number;
  guid: string;
  order: IEscrowDetailOrder;
  status: TEscrowStatus;
  amount: string;
  commission_amount: string;
  provider: string;
  provider_transaction_id: string;
  held_at: string | null;
  confirm_deadline: string | null;
  released_at: string | null;
  refunded_at: string | null;
  created_at: string;
  // Whether the escrow has already been funded, and whether the current
  // viewer is the one who owes the payment — together they decide whether
  // the "pay from balance" button should show at all.
  is_paid: boolean;
  is_payer: boolean;
}

export type TStatisticsPeriod = "week" | "month" | "year";

// GET /payments/balance/master-statistics/ — the signed-in master's
// dashboard numbers. Rates/averages/change percents come back as null when
// there's nothing to compute them from (e.g. no orders in either period),
// so they're rendered as "—" rather than 0.
export interface IMasterStatistics {
  period: {
    type: TStatisticsPeriod;
    date_from: string;
    date_to: string;
  };
  orders: {
    total: number;
    previous_total: number;
    change_percent: number | null;
    new: number;
    active: number;
    completed: number;
    cancelled: number;
    completion_rate: number | null;
    completed_value: number;
  };
  income: {
    earned: number;
    previous_earned: number;
    change_percent: number | null;
    commission: number;
    pending: number;
    total_earned: number;
    balance: number;
  };
  rating: {
    average: number | null;
    reviews_count: number;
    period_average: number | null;
    period_reviews_count: number;
    previous_average: number | null;
    // Keyed by criterion slug (quality, timeliness, ...); the backend may add
    // more, so labels are translated with the slug as fallback.
    criteria: Record<string, number | null>;
  };
  offers: {
    sent: number;
    accepted: number;
    acceptance_rate: number | null;
  };
  // Trailing months, oldest first; `month` is "YYYY-MM".
  monthly: {
    month: string;
    orders: number;
    earned: number;
    rating: number | null;
    reviews_count: number;
  }[];
}
