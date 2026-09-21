import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import { useMandatoryCoursesQuery } from "@/services/mandatory-courses";
import type { IMandatoryCourseListItem } from "@/types";
import { appendUniquePage } from "@/utils/pagination";

const PAGE_SIZE = 12;

export default function CoursesScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IMandatoryCourseListItem[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useMandatoryCoursesQuery(page, PAGE_SIZE);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  return (
    <View className="flex-1 bg-background">
      <Header title={t("courses_header")} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="alert-circle-outline"
            title={t("common_load_error")}
            description={t("common_try_again_description")}
            actionLabel={t("common_try_again")}
            onAction={() => refetch()}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="school-outline" title={t("courses_empty")} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-4"
          contentContainerStyle={{ paddingTop: headerHeight + 16 }}
          renderItem={({ item }) => (
            <PressableCard className="flex-row items-center gap-3" onPress={() => router.push(`/courses/${item.guid}`)}>
              <View className={`h-12 w-12 items-center justify-center rounded-2xl ${item.is_completed ? "bg-emerald-50" : "bg-surface"}`}>
                <Ionicons
                  name={item.is_completed ? "checkmark-circle" : "school-outline"}
                  size={22}
                  color={item.is_completed ? colors.accent : colors.muted}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {item.title}
                </Text>
                <Text className="text-sm text-muted">{t("courses_lessons_count", { count: item.lessons_count })}</Text>
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
