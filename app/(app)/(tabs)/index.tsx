import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { ApplicationsMapView } from "@/components/ApplicationsMapView";
import {
  CategoryRegionFilterSheet,
  type CategoryRegionFilterSheetHandle,
  type CategoryRegionFilterValue,
} from "@/components/CategoryRegionFilterSheet";
import { ListingCard, ListingCardSkeleton, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useAllJobsCategoriesQuery } from "@/services/master";
import { useApplicationsQuery } from "@/services/application";
import type { IApplication } from "@/types";
import { formatAddress, formatPostedAt, formatPrice } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";

type SortMode = "most_offers" | undefined;

function toListingCard(item: IApplication, t: (key: string, options?: Record<string, unknown>) => string): ListingCardData {
  const sameBudget = item.budget_from === item.budget_to;
  return {
    id: item.guid,
    categoryGuid: item.category.guid,
    categoryIcon: item.category.icon,
    categoryLabel: item.category.name,
    title: item.title,
    description: item.description,
    address: formatAddress(item.address) || t("home_address_not_specified"),
    isUrgent: item.is_urgent,
    deadlineLabel: item.is_urgent
      ? t("home_urgent")
      : item.date_from
        ? formatPostedAt(item.date_from, { today: () => t("home_today"), yesterday: () => t("home_tomorrow") })
        : t("home_deadline_negotiable"),
    price: sameBudget
      ? t("home_price_up_to", { price: formatPrice(Number(item.budget_from)) })
      : t("home_price_range", { from: formatPrice(Number(item.budget_from)), to: formatPrice(Number(item.budget_to)) }),
    paymentType: item.payment_type,
    offersCount: item.offers_count,
    postedAtLabel: formatPostedAt(item.created_at, {
      today: (time) => t("home_posted_today", { time }),
      yesterday: (time) => t("home_posted_yesterday", { time }),
    }),
  };
}

const PAGE_SIZE = 12;
const ALL_CATEGORY = "all";

export default function HomeScreen() {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY);
  const [sort, setSort] = useState<SortMode>(undefined);
  const filterSheetRef = useRef<CategoryRegionFilterSheetHandle>(null);
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
    { value: ALL_CATEGORY, label: t("home_all_categories") },
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
      <Header title={t("home_title")} onSearchPress={() => setSearchVisible((v) => !v)} />

      <View className="gap-3 pb-3" style={{ paddingTop: headerHeight }}>
        {searchVisible ? (
          <View className="px-4">
            <SearchBar
              placeholder={t("home_search_placeholder")}
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
              onPress={() => filterSheetRef.current?.present()}
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
              <Text className="text-sm text-muted">{t("home_active_count", { count: totalCount })}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setSort((s) => (s === "most_offers" ? undefined : "most_offers"))}
              className="flex-row items-center gap-1 rounded-xl bg-surface px-3 py-2"
            >
              <Text className="text-sm text-foreground" style={{ fontWeight: "600" }}>
                {sort === "most_offers" ? t("home_sort_most_offers") : t("home_sort_default")}
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
        <View className={viewMode === "list" ? "px-4" : "gap-3 px-4"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} variant={viewMode === "list" ? "grid" : "list"} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState icon="alert-circle-outline" title={t("common_load_error_title")} description={t("common_retry_description")} actionLabel={t("common_retry_action")} onAction={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="search-outline" title={t("common_nothing_found_title")} description={t("common_nothing_found_description")} />
      ) : viewMode === "map" ? (
        <View style={{ flex: 1 }}>
          <ApplicationsMapView items={items} onSelect={(item) => router.push(`/listing/${item.guid}`)} />
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName={viewMode === "list" ? "px-4" : "gap-3 px-4"}
          contentContainerStyle={{ paddingBottom: 140 }}
          ItemSeparatorComponent={viewMode === "list" ? () => <View className="border-b border-border" /> : undefined}
          renderItem={({ item }) => (
            <View>
              <ListingCard
                item={toListingCard(item, t)}
                variant={viewMode === "list" ? "grid" : "list"}
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

      <CategoryRegionFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />
    </View>
  );
}
