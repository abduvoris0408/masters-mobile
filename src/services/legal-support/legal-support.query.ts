import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  ICreateLegalSupportRequestByOrderNumberDto,
  ICreateLegalSupportRequestDto,
  ILegalSupportCategoriesResponse,
  ILegalSupportRequest,
  ILegalSupportRequestByOrderNumber,
  ILegalSupportRequestListResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const LEGAL_SUPPORT_KEYS = {
  categories: ["legal-support", "categories"],
  myList: (page: number, pageSize: number) => ["legal-support", "my-list", page, pageSize],
};

export const useLegalSupportCategoriesQuery = (enabled = true) =>
  useQuery({
    queryKey: LEGAL_SUPPORT_KEYS.categories,
    queryFn: (): Promise<ILegalSupportCategoriesResponse> =>
      axiosInstance
        .get<ILegalSupportCategoriesResponse>(ENDPOINTS.LEGAL_SUPPORT.CATEGORY_LIST, { params: { page_size: 100 } })
        .then((r) => r.data),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

export const useLegalSupportRequestsQuery = (page: number, pageSize = 12) =>
  useQuery({
    queryKey: LEGAL_SUPPORT_KEYS.myList(page, pageSize),
    queryFn: (): Promise<ILegalSupportRequestListResponse> =>
      axiosInstance
        .get<ILegalSupportRequestListResponse>(ENDPOINTS.LEGAL_SUPPORT.REQUEST_MY_LIST, {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useCreateLegalSupportRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateLegalSupportRequestDto): Promise<ILegalSupportRequest> =>
      axiosInstance.post(ENDPOINTS.LEGAL_SUPPORT.REQUEST_CREATE, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-support", "my-list"] });
    },
  });
};

export const useCreateLegalSupportRequestByOrderNumberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateLegalSupportRequestByOrderNumberDto): Promise<ILegalSupportRequestByOrderNumber> =>
      axiosInstance.post(ENDPOINTS.LEGAL_SUPPORT.REQUEST_CREATE_BY_ORDER_NUMBER, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-support", "my-list"] });
    },
  });
};
