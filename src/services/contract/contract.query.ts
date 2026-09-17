import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IContractDetail, IUserServicePreview } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const CONTRACT_KEYS = {
  detail: (orderGuid: string | null) => ["contract", "detail", orderGuid],
  userServicePreview: (serviceGuid: string | null) => ["contract", "user-service-preview", serviceGuid],
};

// Fetched on-demand when the master opens the contract agreement for a
// direct order, before they accept it.
export const useContractDetailQuery = (orderGuid: string | null) =>
  useQuery({
    queryKey: CONTRACT_KEYS.detail(orderGuid),
    queryFn: (): Promise<IContractDetail> =>
      axiosInstance.get<IContractDetail>(ENDPOINTS.CONTRACT.DETAIL(orderGuid as string)).then((r) => r.data),
    enabled: !!orderGuid,
  });

// Fetched on-demand when a customer opens the "order this service" sheet on
// a master's detail screen — shows the contract they're about to enter into
// before they confirm and the order (and its own contract) actually gets
// created.
export const useUserServicePreviewQuery = (serviceGuid: string | null) =>
  useQuery({
    queryKey: CONTRACT_KEYS.userServicePreview(serviceGuid),
    queryFn: (): Promise<IUserServicePreview> =>
      axiosInstance
        .get<IUserServicePreview>(ENDPOINTS.CONTRACT.USER_SERVICE_PREVIEW(serviceGuid as string))
        .then((r) => r.data),
    enabled: !!serviceGuid,
  });
