import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IMasterProfileCreateRequest, IUserService, IUserServiceUpdateRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MASTER_KEYS } from "./master.query";

// Creates the master_profile record itself — the step that's been missing
// from mobile's onboarding: role-update alone (useRoleUpdateMutation) only
// flips the backend role flag, it never creates this record. Used by both
// the individual master-onboarding wizard (type: INDIVIDUAL) and the
// organization-onboarding screen (type: ORGANIZATION, categories: []).
export const useCreateMasterProfileMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IMasterProfileCreateRequest) =>
      axiosInstance.post(ENDPOINTS.MASTER_PROFILE.CREATE, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MASTER_KEYS.profile }),
  });
};

// Master edits their own profile fields (services, experience, address,
// description) — the "Profilni tahrirlash" screen's save action.
export const useUpdateMasterProfileMutation = (guid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IMasterProfileCreateRequest) =>
      axiosInstance.put(ENDPOINTS.MASTER_PROFILE.UPDATE(guid), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MASTER_KEYS.profile }),
  });
};

// Master edits a service's price / publish state / pricing unit — the "Xizmatlar
// narxini tahrirlash" row on the profile screen. PUT (not PATCH) mirrors the
// web project's call, which always sends the full { price, is_published,
// pricing_unit } body.
export const useUpdateUserServiceMutation = (profileGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: IUserServiceUpdateRequest }): Promise<IUserService> =>
      axiosInstance.put(ENDPOINTS.JOBS.USER_SERVICE_UPDATE(guid), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MASTER_KEYS.userServices(profileGuid) }),
  });
};
