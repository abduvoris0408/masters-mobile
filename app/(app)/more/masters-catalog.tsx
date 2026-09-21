import { useEffect, useRef, useState } from "react";
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

function toMasterCard(item: IUserServiceCatalogSummary): MasterCardData {
  const firstService = item.services[0];
  return {
    id: item.guid,
    name: `${item.name} ${item.surname}`.trim(),
    photo: item.photo,
    category: firstService?.service_name ?? "Mutaxassis",
    rating: item.rating,
    fromPrice: firstService ? `${firstService.price} so'mdan` : "Narx kelishiladi",
  };
}

const PAGE_SIZE = 12;

export default function MastersCatalogScreen() {
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
      <Header title="Mutaxassislar" onBackPress={() => router.back()} />
      <View className="px-4 pb-2" style={{ paddingTop: headerHeight }}>
        <SearchBar placeholder="Mutaxassis yoki xizmat qidirish..." value={searchInput} onChangeText={setSearchInput} />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.accent} />
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" title="Yuklashda xatolik" description="Qayta urinib ko'ring" actionLabel="Qayta urinish" onAction={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="search-outline" title="Hech narsa topilmadi" description="Boshqa so'z yoki filtr bilan urinib ko'ring" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          renderItem={({ item }) => (
            <MasterCard item={toMasterCard(item)} onPress={() => router.push(`/master/${item.guid}`)} />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}

      <FilterFab
        label={activeFilterCount > 0 ? `Filtr (${activeFilterCount})` : "Filtr"}
        onPress={() => filterSheetRef.current?.present()}
      />

      <CategoryRegionFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />
    </View>
  );
}
