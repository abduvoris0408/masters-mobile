import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IBalance, IBalanceTransaction, IDjangoPaginated, IEscrowDetail } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const PAYMENTS_KEYS = {
  balance: ["payments", "balance"],
  transactions: (page: number, pageSize: number) => ["payments", "transactions", page, pageSize],
  escrowDetail: (orderGuid: string | null) => ["payments", "escrow-detail", orderGuid],
};

export const useBalanceQuery = () =>
  useQuery({
    queryKey: PAYMENTS_KEYS.balance,
    queryFn: (): Promise<IBalance> => axiosInstance.get<IBalance>(ENDPOINTS.PAYMENTS.BALANCE_ME).then((r) => r.data),
  });

export const useBalanceTransactionsQuery = (page: number, pageSize = 20) =>
  useQuery({
    queryKey: PAYMENTS_KEYS.transactions(page, pageSize),
    queryFn: (): Promise<IDjangoPaginated<IBalanceTransaction>> =>
      axiosInstance
        .get<IDjangoPaginated<IBalanceTransaction>>(ENDPOINTS.PAYMENTS.BALANCE_TRANSACTIONS_MY_LIST, {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

// Read-only — surfaces the order's escrow state (has it been funded, does the
// current viewer owe the payment) on the order detail/orders-tab "Complete
// payment" flow. Actually funding escrow is a separate follow-up once the
// real payment provider redirect/deep-link is wired up.
export const useEscrowDetailQuery = (orderGuid: string | null) =>
  useQuery({
    queryKey: PAYMENTS_KEYS.escrowDetail(orderGuid),
    queryFn: (): Promise<IEscrowDetail> =>
      axiosInstance.get<IEscrowDetail>(ENDPOINTS.PAYMENTS.ESCROW_DETAIL(orderGuid as string)).then((r) => r.data),
    enabled: !!orderGuid,
  });
