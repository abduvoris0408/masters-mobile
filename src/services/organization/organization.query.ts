import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IOrganizationCatalogDetail, IOrganizationCatalogSummary } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const ORGANIZATION_KEYS = {
  catalog: (page: number, pageSize: number) => ["organization", "catalog", page, pageSize],
  catalogDetail: (guid: string | null) => ["organization", "catalog-detail", guid],
};

// Public catalog — mirrors useMastersCatalogQuery's shape/pagination, backing
// the "Tashkilotlar katalogi" list opened from the More sheet.
export const useOrganizationsCatalogQuery = (page: number, pageSize = 12) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.catalog(page, pageSize),
    queryFn: (): Promise<IDjangoPaginated<IOrganizationCatalogSummary>> =>
      axiosInstance
        .get<IDjangoPaginated<IOrganizationCatalogSummary>>(ENDPOINTS.ORGANIZATION.CATALOG_LIST, {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useOrganizationCatalogDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.catalogDetail(guid),
    queryFn: (): Promise<IOrganizationCatalogDetail> =>
      axiosInstance
        .get<IOrganizationCatalogDetail>(ENDPOINTS.ORGANIZATION.CATALOG_DETAIL(guid as string))
        .then((r) => r.data),
    enabled: !!guid,
  });
