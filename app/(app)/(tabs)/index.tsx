import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";

import {
  CategoryRegionFilterSheet,
  type CategoryRegionFilterValue,
} from "@/components/CategoryRegionFilterSheet";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterFab } from "@/components/ui/FilterFab";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { toneFromString } from "@/components/ui/IconBadge";
import { useAppDrawer } from "@/providers/DrawerProvider";
import { useApplicationsQuery } from "@/services/application";
import type { IApplication } from "@/types";
import { formatPrice } from "@/utils/format";

type FeedFilter = "all" | "recommended";

function toListingCard(item: IApplication): ListingCardData {
  const sameBudget = item.budget_from === item.budget_to;
  return {
    id: item.guid,
    imageUri: item.category.icon,
    tone: toneFromString(String(item.category.id)),
    title: item.title,
    subtitleLines: [
      item.address || "Manzil ko'rsatilmagan",
      item.is_urgent ? "Tezkor ish" : "Muddat kelishiladi",
    ],
    price: sameBudget
      ? `${formatPrice(Number(item.budget_from))} gacha`
      : `${formatPrice(Number(item.budget_from))} – ${formatPrice(Number(item.budget_to))}`,
    statusLabel: item.offers_count > 0 ? `${item.offers_count} ta taklif` : "Takliflar yo'q",
    statusTone: item.offers_count > 0 ? "info" : "success",
  };
}

const PAGE_SIZE = 12;

export default function HomeScreen() {
  const { open } = useAppDrawer();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<CategoryRegionFilterValue>({ category: [], region: null });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IApplication[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [query, filters, feedFilter]);

  const { data, isLoading, isFetching, isError, refetch } = useApplicationsQuery(page, PAGE_SIZE, {
    category: filters.category,
    region: filters.region,
    q: query || undefined,
    sort: feedFilter === "recommended" ? "most_offers" : undefined,
  });

  useEffect(() => {
    if (!data) return;
    // Defensive: a misconfigured/unreachable EXPO_PUBLIC_API_URL can return a
    // response that isn't actually IDjangoPaginated (e.g. a dev server's HTML
    // fallback page parsed as JSON-ish) — `results` being missing shouldn't
    // hard-crash the screen.
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => (page === 1 ? results : [...prev, ...results]));
  }, [data, page]);

  const hasMore = !!data?.next;
  const activeFilterCount = filters.category.length + (filters.region ? 1 : 0);

  return (
    <View className="flex-1 bg-background">
      <Header onMenuPress={open} />
      <View className="gap-4 px-4">
        <SearchBar
          placeholder="Ishlar bo'yicha qidirish..."
          rightIcon="map-outline"
          value={searchInput}
          onChangeText={setSearchInput}
        />
        <SegmentedTabs
          value={feedFilter}
          onChange={setFeedFilter}
          options={[
            { value: "all", label: "Barchasi" },
            { value: "recommended", label: "Tavsiya etilgan" },
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
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
            <ListingCard item={toListingCard(item)} onPress={() => router.push(`/listing/${item.guid}`)} />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}

      <FilterFab label={activeFilterCount > 0 ? `Filtr (${activeFilterCount})` : "Filtr"} onPress={() => setFilterVisible(true)} />

      <CategoryRegionFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={filters}
        onApply={setFilters}
      />
    </View>
  );
}
