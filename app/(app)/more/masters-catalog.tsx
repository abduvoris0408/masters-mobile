import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";

import {
  CategoryRegionFilterSheet,
  type CategoryRegionFilterSheetHandle,
  type CategoryRegionFilterValue,
} from "@/components/CategoryRegionFilterSheet";
import { MasterCard, type MasterCardData } from "@/components/MasterCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterFab } from "@/components/ui/FilterFab";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useMastersCatalogQuery } from "@/services/master";
import type { IUserServiceCatalogSummary } from "@/types";
import { appendUniquePage } from "@/utils/pagination";

function toMasterCard(item: IUserServiceCatalogSummary, t: (key: string, options?: Record<string, unknown>) => string): MasterCardData {
  const firstService = item.services[0];
  return {
    id: item.guid,
    name: `${item.name} ${item.surname}`.trim(),
    photo: item.photo,
    category: firstService?.service_name ?? t("masters_catalog_fallback_category"),
    rating: item.rating,
    fromPrice: firstService ? t("masters_catalog_price_from", { price: firstService.price }) : t("masters_catalog_price_negotiable"),
  };
}

const PAGE_SIZE = 12;

export default function MastersCatalogScreen() {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const filterSheetRef = useRef<CategoryRegionFilterSheetHandle>(null);
  const [filters, setFilters] = useState<CategoryRegionFilterValue>({ category: [], region: null });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IUserServiceCatalogSummary[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [query, filters]);

  const { data, isLoading, isFetching, isError, refetch } = useMastersCatalogQuery(page, PAGE_SIZE, {
    category: filters.category,
    region: filters.region,
    q: query || undefined,
  });

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;
  const activeFilterCount = filters.category.length + (filters.region ? 1 : 0);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("masters_catalog_title")} onBackPress={() => router.back()} />
      <View className="px-4 pb-2" style={{ paddingTop: headerHeight }}>
        <SearchBar placeholder={t("masters_catalog_search_placeholder")} value={searchInput} onChangeText={setSearchInput} />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.accent} />
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" title={t("common_load_error_title")} description={t("common_retry_description")} actionLabel={t("common_retry_action")} onAction={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="search-outline" title={t("common_nothing_found_title")} description={t("common_nothing_found_description")} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          renderItem={({ item }) => (
            <MasterCard item={toMasterCard(item, t)} onPress={() => router.push(`/master/${item.guid}`)} />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}

      <FilterFab
        label={activeFilterCount > 0 ? t("masters_catalog_filter_count", { count: activeFilterCount }) : t("masters_catalog_filter")}
        onPress={() => filterSheetRef.current?.present()}
      />

      <CategoryRegionFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />
    </View>
  );
}
