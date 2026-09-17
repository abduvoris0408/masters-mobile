import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IProfileReviewsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const REVIEW_KEYS = {
  profileReviews: (profileGuid: string | null, page: number, pageSize: number) => [
    "review",
    "profile-list",
    profileGuid,
    page,
    pageSize,
  ],
};

export const useProfileReviewsQuery = (profileGuid: string | null, page: number, pageSize = 5) =>
  useQuery({
    queryKey: REVIEW_KEYS.profileReviews(profileGuid, page, pageSize),
    queryFn: (): Promise<IProfileReviewsResponse> =>
      axiosInstance
        .get<IProfileReviewsResponse>(ENDPOINTS.REVIEW.LIST(profileGuid as string), {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    enabled: !!profileGuid,
    placeholderData: (prev) => prev,
  });
