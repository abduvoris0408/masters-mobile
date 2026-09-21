import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  IDjangoPaginated,
  IOrganization,
  IOrganizationCatalogDetail,
  IOrganizationCatalogSummary,
  IOrganizationMemberDetail,
  IOrganizationMemberSummary,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

export const ORGANIZATION_KEYS = {
  catalog: (page: number, pageSize: number) => ["organization", "catalog", page, pageSize],
  catalogDetail: (guid: string | null) => ["organization", "catalog-detail", guid],
  me: ["organization", "me"],
  detail: (guid: string | null) => ["organization", "detail", guid],
  members: ["organization", "members"],
  memberDetail: (guid: string | null) => ["organization", "member-detail", guid],
};

// Org owner's own organization record — the counterpart to
// useMasterProfileQuery for organization accounts. 404s for anyone without
// one, so it's only meaningfully enabled once we know the account is an org.
export const useMyOrganizationQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.me,
    queryFn: (): Promise<IOrganization> => axiosInstance.get(ENDPOINTS.ORGANIZATION.ME).then((r) => r.data),
    enabled,
    retry: false,
  });

export const useOrganizationDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.detail(guid),
    queryFn: (): Promise<IOrganization> =>
      axiosInstance.get(ENDPOINTS.ORGANIZATION.DETAIL(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });

// Org owner's full team roster (published + unpublished) — backs the
// "Mutaxasislar" tab, distinct from the public masters catalog.
export const useOrganizationMembersQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.members,
    queryFn: (): Promise<IOrganizationMemberSummary[]> =>
      axiosInstance
        .get<IDjangoPaginated<IOrganizationMemberSummary> | IOrganizationMemberSummary[]>(ENDPOINTS.ORGANIZATION.MEMBER_LIST, {
          params: { page_size: 100 },
        })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data.results)),
    enabled,
  });

// Full member record + every service regardless of publish state — backs the
// specialist detail/edit sheet opened from the roster.
export const useOrganizationMemberDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: ORGANIZATION_KEYS.memberDetail(guid),
    queryFn: (): Promise<IOrganizationMemberDetail> =>
      axiosInstance.get(ENDPOINTS.ORGANIZATION.MEMBER_DETAIL(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });

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
