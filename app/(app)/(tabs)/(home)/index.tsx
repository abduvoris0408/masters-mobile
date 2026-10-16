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
import { NotificationBell } from "@/components/NotificationBell";
import { AppBrand } from "@/components/ui/AppLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { type TGeoStatus, useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
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
// Radius choices (km) for the "Yaqinimda" filter — same set as the web.
const NEARBY_RADII = [1, 3, 5, 10] as const;
const NEARBY_DEFAULT_RADIUS = 3;

// Strip under the toolbar while "Yaqinimda" is on: radius chips plus the
// location state (locating / denied / "N listings within R km").
function NearbyBar({
  radius,
  onRadiusChange,
  status,
  count,
  fetching,
  onLocate,
}: {
  radius: number;
  onRadiusChange: (radius: number) => void;
  status: TGeoStatus;
  count?: number;
  fetching: boolean;
  onLocate: () => void;
}) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const failed = status === "denied" || status === "unavailable";

  return (
    <View className="mx-4 gap-2.5 rounded-2xl bg-surface p-3">
      <View className="flex-row gap-1.5">
        {NEARBY_RADII.map((r) => {
          const active = r === radius;
          return (
            <Pressable
              key={r}
              onPress={() => onRadiusChange(r)}
              className={`flex-1 items-center rounded-xl py-1.5 ${active ? "bg-emerald-50 dark:bg-accent/15" : "bg-background"}`}
            >
              <Text
                className="text-[13px]"
                style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium, color: active ? colors.accent : colors.muted }}
              >
                {t("nearby_km", { value: r })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2">
        {status === "locating" || (status === "ready" && fetching) ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name={failed ? "warning-outline" : "navigate"} size={14} color={failed ? "#D97706" : colors.accent} />
        )}
        <Text className="flex-1 text-[13px]" style={{ color: failed ? "#D97706" : colors.foreground }}>
          {status === "locating"
            ? t("nearby_locating")
            : failed
              ? t(`nearby_${status}`)
              : t("nearby_found", { radius, count: count ?? 0 })}
        </Text>
        <Pressable
          onPress={onLocate}
          hitSlop={8}
          disabled={status === "locating"}
          className="flex-row items-center gap-1 rounded-full bg-background px-2.5 py-1.5"
        >
          <Ionicons name="locate" size={14} color={colors.foreground} />
          {failed ? (
            <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              {t("nearby_retry")}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

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
  // "Yaqinimda" radius in km; null = off.
  const [nearbyRadius, setNearbyRadius] = useState<number | null>(null);
  const { status: geoStatus, coords, locate } = useCurrentLocation();

  useEffect(() => {
    const id = setTimeout(() => setQuery(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const nearbyOn = nearbyRadius != null;
  const nearbyCoords = nearbyOn ? coords : null;
  // Filter is on but there's no position yet — hold the list back rather
  // than showing unfiltered results under a "near me" filter.
  const nearbyWaiting = nearbyOn && !nearbyCoords;

  const toggleNearby = () => {
    if (nearbyOn) {
      setNearbyRadius(null);
      return;
    }
    setNearbyRadius(NEARBY_DEFAULT_RADIUS);
    if (geoStatus !== "ready" && geoStatus !== "locating") locate();
  };

  const { data: categories } = useAllJobsCategoriesQuery();
  const categoryChips = [
    { value: ALL_CATEGORY, label: t("home_all_categories") },
    ...(categories ?? []).slice(0, 8).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [categoryFilter, filters, sort, query, nearbyRadius, nearbyCoords]);

  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } = useApplicationsQuery(
    page,
    PAGE_SIZE,
    {
      category:
        categoryFilter !== ALL_CATEGORY ? [Number(categoryFilter)] : filters.category.length ? filters.category : undefined,
      region: filters.region,
      sort,
      q: query || undefined,
      ...(nearbyCoords && nearbyRadius != null
        ? { lat: nearbyCoords.lat, long: nearbyCoords.lng, radius: nearbyRadius }
        : {}),
    },
    !nearbyWaiting,
  );

  useEffect(() => {
    // Placeholder data belongs to the previous filters/page — appending it
    // would flash unfiltered listings (e.g. under "Yaqinimda") until the
    // real response lands.
    if (!data || isPlaceholderData) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, isPlaceholderData, page]);

  const showSkeleton = isLoading || (isPlaceholderData && items.length === 0);

  const hasMore = !!data?.next;
  const totalCount = data?.count ?? items.length;
  const activeFilterCount = filters.category.length + (filters.region ? 1 : 0);

  // Search / categories / toolbar / "Yaqinimda" — rendered as the list's
  // header so it scrolls away with the cards, under the transparent iOS bar.
  const controls = (
    <View className="gap-3 pb-3 pt-2">
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
          <Pressable
            onPress={toggleNearby}
            accessibilityRole="button"
            accessibilityLabel={t("nearby_toggle")}
            accessibilityState={{ selected: nearbyOn }}
            className={`h-9 w-9 items-center justify-center rounded-xl ${nearbyOn ? "bg-accent" : "bg-surface"}`}
          >
            <Ionicons name={nearbyOn ? "navigate" : "navigate-outline"} size={16} color={nearbyOn ? "#FFFFFF" : colors.foreground} />
          </Pressable>
          {!nearbyWaiting ? (
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-accent" />
              <Text className="text-sm text-muted">{t("home_active_count", { count: totalCount })}</Text>
            </View>
          ) : null}
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

      {nearbyOn ? (
        <NearbyBar
          radius={nearbyRadius}
          onRadiusChange={setNearbyRadius}
          status={geoStatus}
          count={nearbyWaiting ? undefined : data?.count}
          fetching={isFetching}
          onLocate={locate}
        />
      ) : null}
    </View>
  );

  // What the list area shows when there are no cards to render yet.
  const emptyContent = nearbyWaiting ? null : showSkeleton ? (
    <View className={viewMode === "list" ? "px-4" : "gap-3 px-4"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} variant={viewMode === "list" ? "grid" : "list"} />
      ))}
    </View>
  ) : (
    <View style={{ paddingVertical: 48, minHeight: 360 }}>
      {isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title={t("common_load_error_title")}
          description={t("common_retry_description")}
          actionLabel={t("common_retry_action")}
          onAction={() => refetch()}
        />
      ) : (
        <EmptyState
          icon="search-outline"
          title={t("common_nothing_found_title")}
          description={nearbyOn ? t("nearby_empty", { radius: nearbyRadius }) : t("common_nothing_found_description")}
        />
      )}
    </View>
  );

  const showCards = !nearbyWaiting && !showSkeleton && !isError && items.length > 0;
  const showMap = viewMode === "map" && showCards;

  return (
    <View className="flex-1 bg-background">
      {/* No title — the brand on the left already says where you are. */}
      <Header
        left={<AppBrand />}
        right={
          <View className="flex-row items-center gap-1">
            <HeaderIconButton
              onPress={() => setSearchVisible((v) => !v)}
              accessibilityLabel={t("home_search_placeholder")}
              accessibilityState={{ selected: searchVisible }}
            >
              <Ionicons name={searchVisible ? "close" : "search-outline"} size={21} color={colors.foreground} />
            </HeaderIconButton>
            <NotificationBell />
          </View>
        }
      />

      {showMap ? (
        // The map doesn't scroll, so the controls sit fixed above it.
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          {controls}
          <View style={{ flex: 1 }}>
            <ApplicationsMapView
              items={items}
              onSelect={(item) => router.push(`/listing/${item.guid}`)}
              userLocation={nearbyCoords}
              radiusKm={nearbyRadius ?? undefined}
            />
          </View>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={showCards ? items : []}
          keyExtractor={(item) => item.guid}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={viewMode === "list" ? undefined : "gap-3"}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListHeaderComponent={controls}
          ListEmptyComponent={emptyContent}
          ItemSeparatorComponent={viewMode === "list" ? () => <View className="mx-4 border-b border-border" /> : undefined}
          renderItem={({ item }) => (
            <View className="px-4">
              <ListingCard
                item={toListingCard(item, t)}
                variant={viewMode === "list" ? "grid" : "list"}
                onPress={() => router.push(`/listing/${item.guid}`)}
                onOfferPress={() => router.push(`/listing/${item.guid}`)}
              />
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => showCards && hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1 && showCards} onRefresh={() => refetch()} />}
        />
      )}

      <CategoryRegionFilterSheet ref={filterSheetRef} value={filters} onApply={setFilters} />
    </View>
  );
}
