import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { extractChatGuid, extractChatId, useStartChatMutation } from "@/services/chat";
import { useMasterCatalogDetailQuery } from "@/services/master";
import type { IUserServiceCategoryRef } from "@/types";
import { showError } from "@/utils/toast";

import { CreateOrderModal, type CreateOrderModalHandle } from "./components/CreateOrderModal";
import { IntroVideoSection } from "./components/IntroVideoSection";
import { MasterDetailTabs, type ServiceGroup } from "./components/MasterDetailTabs";
import { MasterHeaderCard } from "./components/MasterHeaderCard";
import { MasterStatisticsCards } from "./components/MasterStatisticsCards";
import { ReviewsSection } from "./components/ReviewsSection";

export default function MasterDetailScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data: master, isLoading, isError } = useMasterCatalogDetailQuery(guid ?? null);
  const startChatMutation = useStartChatMutation();

  const orderSheetRef = useRef<CreateOrderModalHandle>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSummary, setReviewsSummary] = useState<{ averageRating: number | null; count: number } | null>(null);

  const groups = useMemo<ServiceGroup[]>(() => {
    if (!master) return [];
    const map = new Map<string, ServiceGroup>();
    for (const service of master.services) {
      const key = service.category.guid;
      if (!map.has(key)) map.set(key, { category: service.category, services: [] });
      map.get(key)!.services.push(service);
    }
    return Array.from(map.values());
  }, [master]);

  const categories: IUserServiceCategoryRef[] = groups.map((g) => g.category);

  const handleContact = async () => {
    if (!master) return;
    try {
      const result = await startChatMutation.mutateAsync({ user: Number(master.user_id) });
      const chatGuid = extractChatGuid(result);
      const chatId = extractChatId(result);
      if (!chatGuid || !chatId) {
        showError("Suhbatni ochishda xatolik yuz berdi");
        return;
      }
      router.push({ pathname: "/chat/[guid]", params: { guid: chatGuid, id: String(chatId) } });
    } catch {
      showError("Suhbatni ochishda xatolik yuz berdi");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Mutaxassis" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !master ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Mutaxassis topilmadi" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-4"
          contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 32 }}
        >
          <MasterHeaderCard
            master={master}
            categories={categories}
            averageRating={reviewsSummary?.averageRating}
            onContact={handleContact}
            contacting={startChatMutation.isPending}
          />

          <IntroVideoSection videos={master.intro_videos} />

          <MasterStatisticsCards guid={master.guid} completedOrders={master.completed_orders_count} />

          <MasterDetailTabs
            groups={groups}
            onOrder={(service) => orderSheetRef.current?.present(service)}
            profileGuid={master.guid}
          />

          <ReviewsSection
            profileGuid={master.guid}
            fallbackRating={master.rating}
            page={reviewsPage}
            onPageChange={setReviewsPage}
            onSummary={setReviewsSummary}
          />
        </ScrollView>
      )}

      {master ? <CreateOrderModal ref={orderSheetRef} masterUserId={Number(master.user_id)} /> : null}
    </View>
  );
}
