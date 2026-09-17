import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { Chip } from "@/components/ui/Chip";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import { useLegalSupportRequestsQuery } from "@/services/legal-support";
import type { ILegalSupportRequestListItem } from "@/types";
import { formatDate } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";

const PAGE_SIZE = 12;

export default function LegalHelpScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ILegalSupportRequestListItem[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useLegalSupportRequestsQuery(page, PAGE_SIZE);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  return (
    <View className="flex-1 bg-background">
      <Header title="Huquqiy yordam" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Yuklashda xatolik"
            description="Qayta urinib ko'ring"
            actionLabel="Qayta urinish"
            onAction={() => refetch()}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="shield-checkmark-outline" title="Hozircha murojaatlar yo'q" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          contentContainerStyle={{ paddingTop: headerHeight + 16 }}
          renderItem={({ item }) => (
            <PressableCard className="gap-2">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                  <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    {item.category.name}
                  </Text>
                </View>
                <Chip label={item.status} />
              </View>
              <Text className="text-sm text-muted" numberOfLines={2}>
                {item.description}
              </Text>
              <Text className="text-xs text-muted">
                Buyurtma #{item.order.order_number} · {formatDate(item.created_at)}
              </Text>
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
