import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import {
  CategoryRegionFilterSheet,
  type CategoryRegionFilterValue,
} from "@/components/CategoryRegionFilterSheet";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useAllJobsCategoriesQuery } from "@/services/master";
import { useApplicationsQuery } from "@/services/application";
import type { IApplication } from "@/types";
import { formatPostedAt, formatPrice } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";

type SortMode = "most_offers" | undefined;

function toListingCard(item: IApplication): ListingCardData {
  const sameBudget = item.budget_from === item.budget_to;
  return {
    id: item.guid,
    categoryLabel: item.category.name,
    title: item.title,
    description: item.description,
    address: item.address || "Manzil ko'rsatilmagan",
    isUrgent: item.is_urgent,
    deadlineLabel: item.is_urgent
      ? "Shoshilinch"
      : item.date_from
        ? formatPostedAt(item.date_from, { today: () => "Bugun", yesterday: () => "Ertaga" })
        : "Muddat kelishiladi",
    price: sameBudget
      ? `${formatPrice(Number(item.budget_from))} gacha`
      : `${formatPrice(Number(item.budget_from))} – ${formatPrice(Number(item.budget_to))}`,
    paymentType: item.payment_type,
    offersCount: item.offers_count,
    postedAtLabel: formatPostedAt(item.created_at, {
      today: (time) => `Bugun, ${time}`,
      yesterday: (time) => `Kecha, ${time}`,
    }),
  };
}

const PAGE_SIZE = 12;
const ALL_CATEGORY = "all";

export default function HomeScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY);
  const [sort, setSort] = useState<SortMode>(undefined);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<CategoryRegionFilterValue>({ category: [], region: null });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IApplication[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("list");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQuery(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: categories } = useAllJobsCategoriesQuery();
  const categoryChips = [
    { value: ALL_CATEGORY, label: "Barchasi" },
    ...(categories ?? []).slice(0, 8).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [categoryFilter, filters, sort, query]);

  const { data, isLoading, isFetching, isError, refetch } = useApplicationsQuery(page, PAGE_SIZE, {
    category:
      categoryFilter !== ALL_CATEGORY ? [Number(categoryFilter)] : filters.category.length ? filters.category : undefined,
    region: filters.region,
    sort,
    q: query || undefined,
  });

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;
  const totalCount = data?.count ?? items.length;
  const activeFilterCount = filters.category.length + (filters.region ? 1 : 0);

  return (
    <View className="flex-1 bg-background">
      <Header title="Elonlar" onSearchPress={() => setSearchVisible((v) => !v)} />

      <View className="gap-3 pb-3" style={{ paddingTop: headerHeight }}>
        {searchVisible ? (
          <View className="px-4">
            <SearchBar
              placeholder="Ishlar bo'yicha qidirish..."
              value={searchInput}
              onChangeText={setSearchInput}
              autoFocus
            />
          </View>
        ) : null}

        <FilterChips options={categoryChips} value={categoryFilter} onChange={setCategoryFilter} />

        <View className="flex-row items-center justify-between px-4">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setFilterVisible(true)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-surface"
            >
              <Ionicons name="options-outline" size={17} color={colors.foreground} />
              {activeFilterCount > 0 ? (
                <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <Text className="text-[10px] text-white" style={{ fontWeight: "700" }}>
                    {activeFilterCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-accent" />
              <Text className="text-sm text-muted">{totalCount} ta faol elon</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setSort((s) => (s === "most_offers" ? undefined : "most_offers"))}
              className="flex-row items-center gap-1 rounded-xl bg-surface px-3 py-2"
            >
              <Text className="text-sm text-foreground" style={{ fontWeight: "600" }}>
                {sort === "most_offers" ? "Ko'p taklif" : "Saralash"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </Pressable>

            <View className="flex-row items-center rounded-xl bg-surface p-1">
              {(
                [
                  { mode: "list" as const, icon: "list-outline" as const },
                  { mode: "grid" as const, icon: "grid-outline" as const },
                  { mode: "map" as const, icon: "map-outline" as const },
                ]
              ).map(({ mode, icon }) => (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  className={`h-7 w-7 items-center justify-center rounded-lg ${viewMode === mode ? "bg-accent" : ""}`}
                >
                  <Ionicons name={icon} size={14} color={viewMode === mode ? "#FFFFFF" : colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.accent} />
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" title="Yuklashda xatolik" description="Qayta urinib ko'ring" actionLabel="Qayta urinish" onAction={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="search-outline" title="Hech narsa topilmadi" description="Boshqa so'z yoki filtr bilan urinib ko'ring" />
      ) : viewMode === "map" ? (
        <EmptyState icon="map-outline" title="Xaritada ko'rish" description="Bu ko'rinish tez orada qo'shiladi" />
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? { gap: 12 } : undefined}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => (
            <View style={viewMode === "grid" ? { flex: 1 } : undefined}>
              <ListingCard
                item={toListingCard(item)}
                onPress={() => router.push(`/listing/${item.guid}`)}
                onOfferPress={() => router.push(`/listing/${item.guid}`)}
              />
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}

      <CategoryRegionFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={filters}
        onApply={setFilters}
      />
    </View>
  );
}
