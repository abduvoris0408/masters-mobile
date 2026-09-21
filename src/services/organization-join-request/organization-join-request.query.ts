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
  orgList: (page: number, pageSize: number, status?: string) => [
    "organization-join-request",
    "org-list",
    page,
    pageSize,
    status,
  ],
};

const statusParam = (status?: string) => (status && status !== "all" ? status : undefined);

// Usta side — every request/invite tied to their own profile, both
// directions at once (requests they created + invites they received);
// `initiated_by` on each row tells them apart. `enabled` lets a screen that
// branches by account kind call both this and useOrgJoinRequestsQuery
// unconditionally (React hooks can't be called conditionally) and gate which
// one actually fetches.
export const useMyJoinRequestsQuery = (page: number, pageSize = 10, status?: string, enabled = true) =>
  useQuery({
    queryKey: JOIN_REQUEST_KEYS.myList(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IJoinRequest>> =>
      axiosInstance
        .get<IDjangoPaginated<IJoinRequest>>(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.MY_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    enabled,
    placeholderData: (prev) => prev,
  });

// Org owner side — incoming requests from masters + invites the org sent,
// both directions at once; `initiated_by` tells them apart, same convention
// as the usta-side list above.
export const useOrgJoinRequestsQuery = (page: number, pageSize = 10, status?: string, enabled = true) =>
  useQuery({
    queryKey: JOIN_REQUEST_KEYS.orgList(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IJoinRequest>> =>
      axiosInstance
        .get<IDjangoPaginated<IJoinRequest>>(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.ORG_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    enabled,
    placeholderData: (prev) => prev,
  });
