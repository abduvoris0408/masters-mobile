import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";

import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useMyApplicationsQuery } from "@/services/application";
import type { IApplication } from "@/types";
import { formatPostedAt, formatPrice } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";

function toListingCard(item: IApplication): ListingCardData {
  const sameBudget = item.budget_from === item.budget_to;
  return {
    id: item.guid,
    categoryLabel: item.category.name,
    title: item.title,
    description: item.description,
    address: item.address || "Manzil ko'rsatilmagan",
    isUrgent: item.is_urgent,
    deadlineLabel: item.is_urgent ? "Shoshilinch" : "Muddat kelishiladi",
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

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "open", label: "Ochiq" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "closed", label: "Yopilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export default function MyApplicationsScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IApplication[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useMyApplicationsQuery(
    page,
    PAGE_SIZE,
    status === "all" ? undefined : status,
  );

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [status]);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  return (
    <View className="flex-1 bg-background">
      <Header title="Mening elonlarim" onBackPress={() => router.back()} />

      <View className="pb-2" style={{ paddingTop: headerHeight }}>
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Yuklashda xatolik"
          description="Qayta urinib ko'ring"
          actionLabel="Qayta urinish"
          onAction={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState icon="document-text-outline" title="Siz hali birorta elon joylashtirmagansiz" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          renderItem={({ item }) => (
            <ListingCard
              item={toListingCard(item)}
              ctaVariant="manage"
              onPress={() => router.push(`/applications/${item.guid}`)}
              onOfferPress={() => router.push(`/applications/${item.guid}`)}
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}
    </View>
  );
}
