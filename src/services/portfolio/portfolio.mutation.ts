import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IPortfolioWork } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PORTFOLIO_KEYS } from "./portfolio.query";

// RN has no File/Blob-backed <input type=file> — a picked image comes back
// from expo-image-picker as a local `{ uri, type, name }` triple, same shape
// used by application.mutation.ts's image upload.
export interface IPickedPortfolioImage {
  uri: string;
  type?: string | null;
  name?: string | null;
}

const FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

export const useCreatePortfolioMutation = (profileGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { description: string; images: IPickedPortfolioImage[] }): Promise<IPortfolioWork> => {
      const formData = new FormData();
      formData.append("description", data.description);
      data.images.forEach((image, i) => {
        formData.append("images", {
          uri: image.uri,
          type: image.type || "image/jpeg",
          name: image.name || `portfolio-${i}.jpg`,
        } as unknown as Blob);
      });
      return axiosInstance.post(ENDPOINTS.PORTFOLIO.CREATE, formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PORTFOLIO_KEYS.list(profileGuid) }),
  });
};

export const useUpdatePortfolioMutation = (profileGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      guid,
      description,
      newImages,
      removeImageIds,
    }: {
      guid: string;
      description?: string;
      newImages?: IPickedPortfolioImage[];
      removeImageIds?: number[];
    }): Promise<IPortfolioWork> => {
      const formData = new FormData();
      if (description !== undefined) formData.append("description", description);
      newImages?.forEach((image, i) => {
        formData.append("new_images", {
          uri: image.uri,
          type: image.type || "image/jpeg",
          name: image.name || `portfolio-${i}.jpg`,
        } as unknown as Blob);
      });
      removeImageIds?.forEach((id) => formData.append("remove_image_ids", String(id)));
      return axiosInstance.patch(ENDPOINTS.PORTFOLIO.UPDATE(guid), formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PORTFOLIO_KEYS.list(profileGuid) }),
  });
};

export const useDeletePortfolioMutation = (profileGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> => axiosInstance.delete(ENDPOINTS.PORTFOLIO.DELETE(guid)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PORTFOLIO_KEYS.list(profileGuid) }),
  });
};
