import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IIntroVideo, TIntroVideoOwnerKind } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { INTRO_VIDEO_KEYS } from "./intro-video.query";

const ENDPOINTS_BY_KIND = {
  profile: ENDPOINTS.PROFILE_INTRO_VIDEO,
  organization: ENDPOINTS.ORGANIZATION_INTRO_VIDEO,
} satisfies Record<TIntroVideoOwnerKind, unknown>;

// The FK field name in the create body differs by kind ("profile" vs
// "organization") — unlike documents, this API requires the owner's numeric
// id explicitly rather than inferring it from the authenticated user.
const OWNER_FIELD_BY_KIND: Record<TIntroVideoOwnerKind, string> = {
  profile: "profile",
  organization: "organization",
};

const FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

// RN has no File/Blob-backed <input type=file> — a picked video comes back
// from expo-image-picker as a local `{ uri, type, name }` triple, same shape
// used by application.mutation.ts's image upload.
export interface IPickedVideoAsset {
  uri: string;
  type?: string | null;
  name?: string | null;
}

export const useCreateIntroVideoMutation = (kind: TIntroVideoOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, video }: { ownerId: number; video: IPickedVideoAsset }): Promise<IIntroVideo> => {
      const formData = new FormData();
      formData.append(OWNER_FIELD_BY_KIND[kind], String(ownerId));
      formData.append("video", {
        uri: video.uri,
        type: video.type || "video/mp4",
        name: video.name || "intro.mp4",
      } as unknown as Blob);
      return axiosInstance.post(ENDPOINTS_BY_KIND[kind].CREATE, formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INTRO_VIDEO_KEYS.list(kind, ownerGuid) }),
  });
};

export const useUpdateIntroVideoMutation = (kind: TIntroVideoOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, video }: { guid: string; video: IPickedVideoAsset }): Promise<IIntroVideo> => {
      const formData = new FormData();
      formData.append("video", {
        uri: video.uri,
        type: video.type || "video/mp4",
        name: video.name || "intro.mp4",
      } as unknown as Blob);
      return axiosInstance.patch(ENDPOINTS_BY_KIND[kind].UPDATE(guid), formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INTRO_VIDEO_KEYS.list(kind, ownerGuid) }),
  });
};

export const useDeleteIntroVideoMutation = (kind: TIntroVideoOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> =>
      axiosInstance.delete(ENDPOINTS_BY_KIND[kind].DELETE(guid)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTRO_VIDEO_KEYS.list(kind, ownerGuid) }),
  });
};
