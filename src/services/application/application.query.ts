import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  IAgreementPreview,
  IApplication,
  IApplicationDetail,
  IApplicationMapListItem,
  IApplicationPublicDetail,
  IApplicationsListFilters,
  IApplicationTitleSuggestion,
  IDjangoPaginated,
  IMasterOrder,
  IMyOffer,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

// `status` (optional) maps to the backend `?status=` filter; "all"/undefined
// means no filter. It's part of the query key so each tab caches separately.
export const APPLICATION_KEYS = {
  list: (page: number, pageSize: number, filters?: IApplicationsListFilters) => [
    "application",
    "list",
    page,
    pageSize,
    filters,
  ],
  myList: (page: number, pageSize: number, status?: string) => ["application", "my-list", page, pageSize, status],
  detail: (guid: string | null) => ["application", "detail", guid],
  publicDetail: (guid: string | null) => ["application", "detail-public", guid],
  mapList: ["application", "map-list"],
  myOrders: (page: number, pageSize: number, status?: string) => [
    "application",
    "order",
    "my-list",
    page,
    pageSize,
    status,
  ],
  myMasterOrders: (page: number, pageSize: number, status?: string) => [
    "application",
    "order",
    "my-master-list",
    page,
    pageSize,
    status,
  ],
  myOffers: (page: number, pageSize: number, status?: string) => [
    "application",
    "offer",
    "my-list",
    page,
    pageSize,
    status,
  ],
  agreementPreview: (offerGuid: string | null) => ["application", "offer", "agreement-preview", offerGuid],
  titleSuggestions: (q: string) => ["application", "title-list", q],
};

// The status tabs use "all" for the unfiltered view — normalise that (and any
// empty value) to `undefined` so it's simply omitted from the request params.
const statusParam = (status?: string) => (status && status !== "all" ? status : undefined);

export const useApplicationsQuery = (page: number, pageSize = 12, filters?: IApplicationsListFilters) =>
  useQuery({
    queryKey: APPLICATION_KEYS.list(page, pageSize, filters),
    queryFn: (): Promise<IDjangoPaginated<IApplication>> =>
      axiosInstance
        .get<IDjangoPaginated<IApplication>>(ENDPOINTS.APPLICATION.LIST, {
          params: {
            page,
            page_size: pageSize,
            category: filters?.category?.length ? filters.category.join(",") : undefined,
            region: filters?.region ?? undefined,
            district: filters?.district ?? undefined,
            price_min: filters?.price_min ?? undefined,
            price_max: filters?.price_max ?? undefined,
            date_from: filters?.date_from ?? undefined,
            date_to: filters?.date_to ?? undefined,
            q: filters?.q || undefined,
            guid: filters?.guid || undefined,
            sort: filters?.sort ?? undefined,
          },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useMyApplicationsQuery = (page: number, pageSize = 12, status?: string) =>
  useQuery({
    queryKey: APPLICATION_KEYS.myList(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IApplication>> =>
      axiosInstance
        .get<IDjangoPaginated<IApplication>>(ENDPOINTS.APPLICATION.MY_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useApplicationDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: APPLICATION_KEYS.detail(guid),
    queryFn: (): Promise<IApplicationDetail> =>
      axiosInstance.get<IApplicationDetail>(ENDPOINTS.APPLICATION.DETAIL(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });

// Powers the offer-detail page — any master can view an open listing (not
// just its owner) to decide whether to make an offer.
export const useApplicationPublicDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: APPLICATION_KEYS.publicDetail(guid),
    queryFn: (): Promise<IApplicationPublicDetail> =>
      axiosInstance
        .get<IApplicationPublicDetail>(ENDPOINTS.APPLICATION.DETAIL_PUBLIC(guid as string))
        .then((r) => r.data),
    enabled: !!guid,
  });

// Feeds the catalog's map view — a fast, unpaginated guid+coords list (no
// offer/category/budget data), separate from the paginated list above.
export const useApplicationsMapListQuery = (enabled = true) =>
  useQuery({
    queryKey: APPLICATION_KEYS.mapList,
    queryFn: (): Promise<IApplicationMapListItem[]> =>
      axiosInstance.get<IApplicationMapListItem[]>(ENDPOINTS.APPLICATION.MAP_LIST).then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
  });

export const useMyOrdersQuery = (page: number, pageSize = 12, status?: string) =>
  useQuery({
    queryKey: APPLICATION_KEYS.myOrders(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IMasterOrder>> =>
      axiosInstance
        .get<IDjangoPaginated<IMasterOrder>>(ENDPOINTS.APPLICATION.ORDER_MY_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useMyMasterOrdersQuery = (page: number, pageSize = 12, status?: string) =>
  useQuery({
    queryKey: APPLICATION_KEYS.myMasterOrders(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IMasterOrder>> =>
      axiosInstance
        .get<IDjangoPaginated<IMasterOrder>>(ENDPOINTS.APPLICATION.ORDER_MY_MASTER_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useMyOffersQuery = (page: number, pageSize = 12, status?: string) =>
  useQuery({
    queryKey: APPLICATION_KEYS.myOffers(page, pageSize, status),
    queryFn: (): Promise<IDjangoPaginated<IMyOffer>> =>
      axiosInstance
        .get<IDjangoPaginated<IMyOffer>>(ENDPOINTS.APPLICATION.OFFER_MY_LIST, {
          params: { page, page_size: pageSize, status: statusParam(status) },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

// Powers the title-search autocomplete on the create/quick-apply wizard —
// suggests pre-defined listing titles (each with its category attached) as
// the client types, so a match skips the manual base-category → category
// selection entirely. Empty query is disabled — the backend returns its full
// 280+ row list otherwise, which isn't useful before the user types anything.
export const useApplicationTitleSuggestionsQuery = (q: string) =>
  useQuery({
    queryKey: APPLICATION_KEYS.titleSuggestions(q),
    queryFn: (): Promise<IDjangoPaginated<IApplicationTitleSuggestion>> =>
      axiosInstance
        .get<IDjangoPaginated<IApplicationTitleSuggestion>>(ENDPOINTS.APPLICATION.TITLE_LIST, {
          params: { q, page_size: 8 },
        })
        .then((r) => r.data),
    enabled: q.trim().length > 0,
    placeholderData: (prev) => prev,
  });

// Fetched on-demand when the customer opens the agreement preview for a
// pending offer, before they accept it.
export const useAgreementPreviewQuery = (offerGuid: string | null) =>
  useQuery({
    queryKey: APPLICATION_KEYS.agreementPreview(offerGuid),
    queryFn: (): Promise<IAgreementPreview> =>
      axiosInstance
        .get<IAgreementPreview>(ENDPOINTS.APPLICATION.OFFER_AGREEMENT_PREVIEW(offerGuid as string))
        .then((r) => r.data),
    enabled: !!offerGuid,
  });
