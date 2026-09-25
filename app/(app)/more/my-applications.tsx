import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { formatAddress, formatPostedAt, formatPrice } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";

function useListingCardMapper() {
  const { t } = useTranslation("orders");
  return (item: IApplication): ListingCardData => {
    const sameBudget = item.budget_from === item.budget_to;
    return {
      id: item.guid,
      categoryGuid: item.category.guid,
      categoryIcon: item.category.icon,
      categoryLabel: item.category.name,
      title: item.title,
      description: item.description,
      address: formatAddress(item.address) || t("address_not_specified"),
      isUrgent: item.is_urgent,
      deadlineLabel: item.is_urgent ? t("field_urgent") : t("deadline_negotiable"),
      price: sameBudget
        ? t("price_up_to", { price: formatPrice(Number(item.budget_from)) })
        : `${formatPrice(Number(item.budget_from))} – ${formatPrice(Number(item.budget_to))}`,
      paymentType: item.payment_type,
      offersCount: item.offers_count,
      postedAtLabel: formatPostedAt(item.created_at, {
        today: (time) => t("posted_today", { time }),
        yesterday: (time) => t("posted_yesterday", { time }),
      }),
    };
  };
}

const PAGE_SIZE = 12;

export default function MyApplicationsScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const toListingCard = useListingCardMapper();

  const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: "all", label: t("common_all") },
    { value: "open", label: t("status_open") },
    { value: "in_progress", label: t("status_in_progress") },
    { value: "closed", label: t("status_closed") },
    { value: "cancelled", label: t("status_cancelled") },
  ];
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
      <Header title={t("my_applications_header")} onBackPress={() => router.back()} />

      <View className="pb-2" style={{ paddingTop: headerHeight }}>
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title={t("common_load_error")}
          description={t("common_try_again_description")}
          actionLabel={t("common_try_again")}
          onAction={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={t("my_applications_empty_title")}
          description={t("my_applications_empty_description")}
        />
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
