import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IFavorite, TFavoriteType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Big enough to cover any realistic favorites list in one request — the
// lookup below needs every favorite to tell whether a card's heart is filled.
const LOOKUP_PAGE_SIZE = 200;

export const FAVORITE_KEYS = {
  all: ["favorite"],
  list: (type: TFavoriteType, page: number, pageSize: number) => ["favorite", "list", type, page, pageSize],
};

const fetchFavorites = (type: TFavoriteType, page: number, pageSize: number) =>
  axiosInstance
    .get<IDjangoPaginated<IFavorite>>(ENDPOINTS.FAVORITE.LIST, { params: { type, page, page_size: pageSize } })
    .then((r) => r.data);

export const useFavoritesQuery = (type: TFavoriteType, page: number, pageSize: number) =>
  useQuery({
    queryKey: FAVORITE_KEYS.list(type, page, pageSize),
    queryFn: () => fetchFavorites(type, page, pageSize),
    placeholderData: (prev) => prev,
  });

// target (profile/organization) guid -> favorite record guid. The list
// endpoint is the only source of "is this favorited?", and deleting needs the
// favorite's own guid, so cards resolve both from this one cached map.
// Every heart on a screen shares the same query, so it's fetched once.
export const useFavoriteLookup = (type: TFavoriteType) => {
  const { data } = useQuery({
    queryKey: FAVORITE_KEYS.list(type, 1, LOOKUP_PAGE_SIZE),
    queryFn: () => fetchFavorites(type, 1, LOOKUP_PAGE_SIZE),
    staleTime: 60_000,
  });

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const fav of data?.results ?? []) {
      const target = type === "profile" ? fav.profile?.guid : fav.organization?.guid;
      if (target) map.set(target, fav.guid);
    }
    return map;
  }, [data, type]);
};
