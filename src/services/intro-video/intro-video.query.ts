import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IIntroVideo, TIntroVideoOwnerKind } from "@/types";
import { useQuery } from "@tanstack/react-query";

// The only difference between the profile and organization intro-video APIs
// is the base path — endpoint shape, params, and response are identical — so
// every hook here takes a `kind` and looks up the right block instead of
// duplicating a parallel set of hooks per role.
const ENDPOINTS_BY_KIND = {
  profile: ENDPOINTS.PROFILE_INTRO_VIDEO,
  organization: ENDPOINTS.ORGANIZATION_INTRO_VIDEO,
} satisfies Record<TIntroVideoOwnerKind, unknown>;

export const INTRO_VIDEO_KEYS = {
  list: (kind: TIntroVideoOwnerKind, ownerGuid: string | null) => ["intro-video", kind, "list", ownerGuid],
};

// The backend may return either a bare array or a Django paginated envelope
// (same discrepancy already seen on documents/portfolio), so normalise both
// to a plain array — a profile can keep several intro videos side by side.
export const useIntroVideoListQuery = (kind: TIntroVideoOwnerKind, ownerGuid: string | null) =>
  useQuery({
    queryKey: INTRO_VIDEO_KEYS.list(kind, ownerGuid),
    queryFn: (): Promise<IIntroVideo[]> =>
      axiosInstance
        .get<IIntroVideo[] | IDjangoPaginated<IIntroVideo>>(ENDPOINTS_BY_KIND[kind].LIST(ownerGuid as string), {
          params: { page_size: 100 },
        })
        .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),
    enabled: !!ownerGuid,
  });
