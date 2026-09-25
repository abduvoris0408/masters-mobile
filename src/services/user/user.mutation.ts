import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import { MASTER_KEYS } from "@/services/master";
import { useAuthStore } from "@/stores";
import type { IMeProfileResponse, IUserPhotoUpdateRequest, IUserProfileUpdateRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const PHOTO_FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

// Mirrors the web project's usePhotoUpdateMutation (src/services/user in
// ustabor-front): same endpoint/field name, and the response isn't trusted
// either — refetch me-profile and pull the stored photo URL from there
// instead of whatever photo-update itself returns.
export const usePhotoUpdateMutation = () => {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IUserPhotoUpdateRequest) => {
      const formData = new FormData();
      if (data.photo) {
        formData.append("photo", {
          uri: data.photo.uri,
          type: data.photo.type || "image/jpeg",
          name: data.photo.name || "avatar.jpg",
        } as unknown as Blob);
      }
      if (data.remove_photo) formData.append("remove_photo", "true");
      return axiosInstance.put(ENDPOINTS.USER.PHOTO_UPDATE, formData, PHOTO_FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: async () => {
      if (!user) return;
      const profile = await axiosInstance.get<IMeProfileResponse>(ENDPOINTS.MASTER_PROFILE.ME).then((r) => r.data);
      const u = profile.master_profile ? profile.user : profile;
      setUser({ ...user, avatar: u.photo ?? undefined });
      qc.invalidateQueries({ queryKey: MASTER_KEYS.profile });
    },
  });
};

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
