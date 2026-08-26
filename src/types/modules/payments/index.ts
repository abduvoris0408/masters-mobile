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
