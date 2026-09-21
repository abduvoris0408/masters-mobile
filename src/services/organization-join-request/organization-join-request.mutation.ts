import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IJoinRequest, IJoinRequestCreateRequest, IJoinRequestInviteRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Both lists mix requests and invites together, so any action has to refresh
// the whole family rather than just the one the actor is on.
const invalidateJoinRequests = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["organization-join-request"], exact: false });
};

// Usta sends a request to join an organization.
export const useCreateJoinRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IJoinRequestCreateRequest): Promise<IJoinRequest> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.CREATE, data).then((r) => r.data),
    onSuccess: () => invalidateJoinRequests(qc),
  });
};

// Organization owner invites an existing master to join.
export const useInviteJoinRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IJoinRequestInviteRequest): Promise<IJoinRequest> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.INVITE, data).then((r) => r.data),
    onSuccess: () => invalidateJoinRequests(qc),
  });
};

// Cancelled by whichever side initiated it — only while still pending.
export const useCancelJoinRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<IJoinRequest> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.CANCEL(guid)).then((r) => r.data),
    onSuccess: () => invalidateJoinRequests(qc),
  });
};

// Accepted/rejected by the usta when the row is an incoming invite from an
// organization (initiated_by: "organization").
export const useAcceptJoinRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<IJoinRequest> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.ACCEPT(guid)).then((r) => r.data),
    onSuccess: () => invalidateJoinRequests(qc),
  });
};

export const useRejectJoinRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<IJoinRequest> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION_JOIN_REQUEST.REJECT(guid)).then((r) => r.data),
    onSuccess: () => invalidateJoinRequests(qc),
  });
};
