import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IUserService, IUserServiceUpdateRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MASTER_KEYS } from "./master.query";

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
