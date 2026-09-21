import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import { MASTER_KEYS } from "@/services/master";
import { useAuthStore } from "@/stores";
import type { IUserProfileUpdateRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Client (non-master) profile edit screen's only editable fields —
// name/surname/middle_name. Keeps the auth store's user in sync (Header,
// etc. read first_name/last_name from there) and refetches the same
// me-profile query the edit screen itself renders from.
export const useUpdateUserProfileMutation = () => {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IUserProfileUpdateRequest) =>
      axiosInstance.patch(ENDPOINTS.USER.PROFILE_UPDATE, data).then((r) => r.data),
    onSuccess: (_, data) => {
      if (user) {
        setUser({ ...user, first_name: data.name, last_name: data.surname, middle_name: data.middle_name });
      }
      qc.invalidateQueries({ queryKey: MASTER_KEYS.profile });
    },
  });
};
