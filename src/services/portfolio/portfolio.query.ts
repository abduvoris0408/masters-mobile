import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IPortfolioWork } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const PORTFOLIO_KEYS = {
  list: (profileGuid: string | null) => ["portfolio", "list", profileGuid],
};

export const usePortfolioListQuery = (profileGuid: string | null) =>
  useQuery({
    queryKey: PORTFOLIO_KEYS.list(profileGuid),
    queryFn: (): Promise<IPortfolioWork[]> =>
      axiosInstance
        .get<IDjangoPaginated<IPortfolioWork> | IPortfolioWork[]>(ENDPOINTS.PORTFOLIO.LIST(profileGuid as string), {
          params: { page_size: 100 },
        })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data.results)),
    enabled: !!profileGuid,
  });
