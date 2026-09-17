import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IBalance, IEscrowCreateResult, IEscrowDetail } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PAYMENTS_KEYS } from "./payments.query";

// `order` is the numeric order id (not its guid) returned by offer-accept.
export const useCreateEscrowMutation = () =>
  useMutation({
    mutationFn: (order: number): Promise<IEscrowCreateResult> =>
      axiosInstance.post<IEscrowCreateResult>(ENDPOINTS.PAYMENTS.ESCROW_CREATE, { order }).then((r) => r.data),
  });

// Backend only takes `amount` — there's no real payment-provider field yet
// (mirrors the web project's deposit modal, where picking Payme/Click/Visa is
// purely a visual choice with nothing behind it).
export const useDepositBalanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number): Promise<IBalance> =>
      axiosInstance.post<IBalance>(ENDPOINTS.PAYMENTS.BALANCE_DEPOSIT, { amount }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ["payments", "transactions"] });
    },
  });
};

// Pays a pending escrow straight out of the customer's platform balance — an
// alternative to a Payme/Click/Visa provider redirect. `escrow` is the escrow
// record's own id (IEscrowDetail.id), not the order's id.
export const usePayEscrowFromBalanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (escrow: number): Promise<IEscrowDetail> =>
      axiosInstance.post<IEscrowDetail>(ENDPOINTS.PAYMENTS.PLATFORM_BALANCE_DEPOSIT, { escrow }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: ["payments", "escrow-detail"] });
    },
  });
};
