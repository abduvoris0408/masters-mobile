import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IJoinRequest } from "@/types";
import { useQuery } from "@tanstack/react-query";

// `status` (optional) maps to the backend `?status=` filter; "all"/undefined
// means no filter — same convention as APPLICATION_KEYS.myList.
export const JOIN_REQUEST_KEYS = {
  myList: (page: number, pageSize: number, status?: string) => [
    "organization-join-request",
    "my-list",
    page,
    pageSize,
    status,
  ],
};

const statusParam = (status?: string) => (status && status !== "all" ? status : undefined);

// Usta side — every request/invite tied to their own profile, both
// directions at once (requests they created + invites they received);
// `initiated_by` on each row tells them apart.
export const useMyJoinRequestsQuery = (page: number, pageSize = 10, status?: string) =>
  useQuery({
    queryKey: JOIN_REQUEST_KEYS.myList(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IJoinRequest>> =>
      axiosInstance
        .get<IDjangoPaginated<IJoinRequest>>(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.MY_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });
