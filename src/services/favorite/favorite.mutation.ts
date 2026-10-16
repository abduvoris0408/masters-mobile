import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { ICreateFavoriteRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FAVORITE_KEYS } from "./favorite.query";

export const useCreateFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateFavoriteRequest) =>
      axiosInstance.post(ENDPOINTS.FAVORITE.CREATE, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FAVORITE_KEYS.all }),
  });
};

export const useDeleteFavoriteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (favoriteGuid: string) => axiosInstance.delete(ENDPOINTS.FAVORITE.DELETE(favoriteGuid)),
    onSuccess: () => qc.invalidateQueries({ queryKey: FAVORITE_KEYS.all }),
  });
};
