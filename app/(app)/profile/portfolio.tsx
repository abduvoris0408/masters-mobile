import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { usePortfolioListQuery } from "@/services/portfolio";
import { useMasterProfileQuery } from "@/services/master";
import type { IPortfolioWork } from "@/types";
import { formatDate } from "@/utils/format";

export default function ProfilePortfolioScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: works, isLoading } = usePortfolioListQuery(profileGuid);

  return (
    <View className="flex-1 bg-background">
      <Header title="Portfolio" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !works?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="images-outline" title="Portfolio bo'sh" description="Hali bajarilgan ishlar qo'shilmagan" />
        </View>
      ) : (
        <FlatList
          data={works}
          keyExtractor={(item: IPortfolioWork) => item.guid}
          contentContainerClassName="gap-3 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => (
            <View className="gap-2 rounded-3xl bg-surface p-3">
              <View className="flex-row flex-wrap gap-2">
                {item.images.map((img) => (
                  <Image key={img.id} source={{ uri: img.image }} className="rounded-2xl" style={{ width: 110, height: 110 }} />
                ))}
              </View>
              {item.description ? <Text className="px-1 text-sm text-foreground">{item.description}</Text> : null}
              <Text className="px-1 text-xs text-muted">{formatDate(item.created_at)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
