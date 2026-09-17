import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMasterAcceptContractMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderGuid: string): Promise<void> =>
      axiosInstance.post(ENDPOINTS.CONTRACT.MASTER_ACCEPT(orderGuid)).then((r) => r.data),
    onSuccess: (_data, orderGuid) => {
      qc.invalidateQueries({ queryKey: ["contract", "detail", orderGuid] });
      qc.invalidateQueries({ queryKey: ["application", "order", "my-master-list"] });
      qc.invalidateQueries({ queryKey: ["chat"] });
    },
  });
};
