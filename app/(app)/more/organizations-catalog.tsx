import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { ListLabel } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useOrganizationsCatalogQuery } from "@/services/organization";
import type { IOrganizationCatalogSummary } from "@/types";
import { appendUniquePage } from "@/utils/pagination";

const PAGE_SIZE = 12;

export default function OrganizationsCatalogScreen() {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IOrganizationCatalogSummary[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useOrganizationsCatalogQuery(page, PAGE_SIZE);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  return (
    <View className="flex-1 bg-background">
      <Header title={t("orgs_catalog_title")} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="alert-circle-outline"
            title={t("common_load_error_title")}
            description={t("common_retry_description")}
            actionLabel={t("common_retry_action")}
            onAction={() => refetch()}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="business-outline" title={t("orgs_catalog_empty_title")} description={t("common_nothing_found_description")} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          contentContainerStyle={{ paddingTop: headerHeight + 16 }}
          renderItem={({ item }) => (
            <PressableCard className="flex-row items-center gap-3" onPress={() => router.push(`/organization/${item.guid}`)}>
              <Avatar uri={item.logo} name={item.name} size={48} fallbackIcon="business" />
              <View className="flex-1 gap-0.5">
                <ListLabel>{item.name}</ListLabel>
                <Text className="text-sm text-muted">
                  {item.categories.map((c) => c.name).join(", ") || t("orgs_catalog_category_not_specified")}
                </Text>
              </View>
            </PressableCard>
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
