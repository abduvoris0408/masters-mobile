import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  IAddressItem,
  IDjangoPaginated,
  IExperienceLevelItem,
  IJobsBaseCategory,
  IJobsCategory,
  IJobsCategoryAdditionalWork,
  IMasterCatalogListFilters,
  IMeProfileResponse,
  IProfileStatistics,
  IUserService,
  IUserServiceCatalogDetail,
  IUserServiceCatalogSummary,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

export const MASTER_KEYS = {
  profile: ["master", "profile"],
  baseCategories: ["master", "base-categories"],
  categories: (baseCategoryGuid: string | null) => ["master", "categories", baseCategoryGuid],
  categoryAdditionalWorks: (categoryGuid: string | null) => ["master", "category-additional-works", categoryGuid],
  categoriesByBaseIds: (key: string) => ["master", "categories-by-base", key],
  allCategories: ["master", "all-categories"],
  experienceLevels: ["master", "experience-levels"],
  countries: ["master", "countries"],
  regions: ["master", "regions"],
  districts: (regionGuid: string | null) => ["master", "districts", regionGuid],
  districtsByRegionIds: (key: string) => ["master", "districts-by-region", key],
  allDistricts: ["master", "all-districts"],
  userServices: (profileGuid: string | null) => ["master", "user-services", profileGuid],
  catalog: (page: number, pageSize: number, filters?: IMasterCatalogListFilters) => [
    "master",
    "catalog",
    page,
    pageSize,
    filters,
  ],
  catalogDetail: (guid: string | null) => ["master", "catalog-detail", guid],
  statistics: (guid: string | null) => ["master", "statistics", guid],
};

export const useMasterProfileQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.profile,
    queryFn: (): Promise<IMeProfileResponse> =>
      axiosInstance.get(ENDPOINTS.MASTER_PROFILE.ME).then((r) => r.data),
    enabled,
    retry: false,
  });

export const useJobsBaseCategoriesQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.baseCategories,
    queryFn: (): Promise<IJobsBaseCategory[]> =>
      axiosInstance
        .get<IDjangoPaginated<IJobsBaseCategory>>(ENDPOINTS.JOBS.BASE_CATEGORY_LIST, {
          params: { page_size: 100 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

export const useJobsCategoriesQuery = (baseCategoryGuid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.categories(baseCategoryGuid),
    queryFn: (): Promise<IJobsCategory[]> =>
      axiosInstance
        .get<IDjangoPaginated<IJobsCategory>>(ENDPOINTS.JOBS.CATEGORY_LIST, {
          params: { page_size: 100, base_category: baseCategoryGuid },
        })
        .then((r) => r.data.results),
    enabled: !!baseCategoryGuid,
    staleTime: 10 * 60 * 1000,
  });

// Optional extra work items scoped to one leaf category, shown as a
// checklist step in the listing wizard right after the category is picked.
export const useJobsCategoryAdditionalWorksQuery = (categoryGuid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.categoryAdditionalWorks(categoryGuid),
    queryFn: (): Promise<IJobsCategoryAdditionalWork[]> =>
      axiosInstance
        .get<IDjangoPaginated<IJobsCategoryAdditionalWork>>(ENDPOINTS.JOBS.BASE_CATEGORY_ADDITIONAL_WORK_LIST, {
          params: { page_size: 100, category: categoryGuid },
        })
        .then((r) => r.data.results),
    enabled: !!categoryGuid,
    staleTime: 10 * 60 * 1000,
  });

// Multi-parent variant of useJobsCategoriesQuery: returns the union of
// categories under any of the given base-category ids (?base_category=1,2,3).
// Backs the org/master pickers where several directions can be chosen at once;
// the single-guid hook above still serves the single-select callers.
export const useJobsCategoriesByBaseIdsQuery = (baseCategoryIds: number[]) => {
  const key = [...baseCategoryIds].sort((a, b) => a - b).join(",");
  return useQuery({
    queryKey: MASTER_KEYS.categoriesByBaseIds(key),
    queryFn: (): Promise<IJobsCategory[]> =>
      axiosInstance
        .get<IDjangoPaginated<IJobsCategory>>(ENDPOINTS.JOBS.CATEGORY_LIST, {
          params: { page_size: 200, base_category: key },
        })
        .then((r) => r.data.results),
    enabled: baseCategoryIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
};

export const useAllJobsCategoriesQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.allCategories,
    queryFn: (): Promise<IJobsCategory[]> =>
      axiosInstance
        .get<IDjangoPaginated<IJobsCategory>>(ENDPOINTS.JOBS.CATEGORY_LIST, {
          params: { page_size: 200 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

export const useExperienceLevelsQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.experienceLevels,
    queryFn: (): Promise<IExperienceLevelItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IExperienceLevelItem>>(ENDPOINTS.EXPERIENCE_LEVEL.LIST, {
          params: { page_size: 100 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 10 * 60 * 1000,
  });

export const useCountriesQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.countries,
    queryFn: (): Promise<IAddressItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IAddressItem>>(ENDPOINTS.ADDRESS.COUNTRY_LIST, {
          params: { page_size: 100 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

export const useRegionsQuery = (enabled = true) =>
  useQuery({
    queryKey: MASTER_KEYS.regions,
    queryFn: (): Promise<IAddressItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IAddressItem>>(ENDPOINTS.ADDRESS.REGION_LIST, {
          params: { page_size: 200 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

export const useDistrictsQuery = (regionGuid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.districts(regionGuid),
    queryFn: (): Promise<IAddressItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IAddressItem>>(ENDPOINTS.ADDRESS.DISTRICT_LIST, {
          params: { page_size: 250, region: regionGuid },
        })
        .then((r) => r.data.results),
    enabled: !!regionGuid,
    staleTime: 30 * 60 * 1000,
  });

// Multi-region variant of useDistrictsQuery: returns every district across the
// given region ids (?region=1,2,3). Used by the org form, whose region picker
// is multi-select, so the district list narrows to only the chosen regions.
export const useDistrictsByRegionIdsQuery = (regionIds: number[]) => {
  const key = [...regionIds].sort((a, b) => a - b).join(",");
  return useQuery({
    queryKey: MASTER_KEYS.districtsByRegionIds(key),
    queryFn: (): Promise<IAddressItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IAddressItem>>(ENDPOINTS.ADDRESS.DISTRICT_LIST, {
          params: { page_size: 500, region: key },
        })
        .then((r) => r.data.results),
    enabled: regionIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });
};

// Nationwide district list (no region filter) — used where districts are
// picked as a flat list independent of a single region, e.g. an
// organization's specific-districts selector.
export const useAllDistrictsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: MASTER_KEYS.allDistricts,
    queryFn: (): Promise<IAddressItem[]> =>
      axiosInstance
        .get<IDjangoPaginated<IAddressItem>>(ENDPOINTS.ADDRESS.DISTRICT_LIST, {
          params: { page_size: 500 },
        })
        .then((r) => r.data.results),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

export const useUserServicesQuery = (profileGuid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.userServices(profileGuid),
    queryFn: (): Promise<IUserService[]> =>
      axiosInstance
        .get<IDjangoPaginated<IUserService>>(ENDPOINTS.JOBS.USER_SERVICE_LIST(profileGuid as string), {
          params: { page_size: 100 },
        })
        .then((r) => r.data.results),
    enabled: !!profileGuid,
  });

// Catalog of masters and their priced services — shown to both client and
// worker accounts (route-gated to signed-in users), so it must not depend on
// role, only on auth state.
export const useMastersCatalogQuery = (
  page: number,
  pageSize = 12,
  filters?: IMasterCatalogListFilters,
  enabled = true
) =>
  useQuery({
    queryKey: MASTER_KEYS.catalog(page, pageSize, filters),
    queryFn: (): Promise<IDjangoPaginated<IUserServiceCatalogSummary>> =>
      axiosInstance
        .get<IDjangoPaginated<IUserServiceCatalogSummary>>(ENDPOINTS.JOBS.USER_SERVICE_CATALOG_LIST, {
          params: {
            page,
            page_size: pageSize,
            category: filters?.category?.length ? filters.category.join(",") : undefined,
            region: filters?.region ?? undefined,
            district: filters?.district ?? undefined,
            price_min: filters?.price_min ?? undefined,
            price_max: filters?.price_max ?? undefined,
            min_rating: filters?.min_rating ?? undefined,
            q: filters?.q || undefined,
            organization: filters?.organization ?? undefined,
            sort: filters?.sort ?? undefined,
          },
        })
        .then((r) => r.data),
    enabled,
    placeholderData: (prev) => prev,
  });

export const useMasterCatalogDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.catalogDetail(guid),
    queryFn: (): Promise<IUserServiceCatalogDetail> =>
      axiosInstance
        .get<IUserServiceCatalogDetail>(ENDPOINTS.JOBS.USER_SERVICE_CATALOG_DETAIL(guid as string))
        .then((r) => r.data),
    enabled: !!guid,
  });

export const useProfileStatisticsQuery = (guid: string | null) =>
  useQuery({
    queryKey: MASTER_KEYS.statistics(guid),
    queryFn: (): Promise<IProfileStatistics> =>
      axiosInstance.get<IProfileStatistics>(ENDPOINTS.MASTER_PROFILE.STATISTICS(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });
