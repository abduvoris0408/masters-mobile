import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { ICreateReviewRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Customer rates a master after the order is completed — a 4-axis rating
// (quality/timeliness/communication/price-transparency) plus a free-text
// comment, shown on the master's public profile as a single review.
export const useCreateReviewMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateReviewRequest): Promise<unknown> =>
      axiosInstance.post(ENDPOINTS.REVIEW.CREATE, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review", "profile-list"] });
      qc.invalidateQueries({ queryKey: ["application", "order"], exact: false });
    },
  });
};
