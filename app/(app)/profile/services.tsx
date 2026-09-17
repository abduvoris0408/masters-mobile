import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { router } from "expo-router";

import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterProfileQuery, useUserServicesQuery } from "@/services/master";
import type { IUserService } from "@/types";
import { formatPrice } from "@/utils/format";

export default function ProfileServicesScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: services, isLoading } = useUserServicesQuery(profileGuid);

  return (
    <View className="flex-1 bg-background">
      <Header title="Xizmatlar" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !services?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="construct-outline" title="Xizmatlar qo'shilmagan" />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item: IUserService) => item.guid}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => (
            <View className="gap-2 rounded-3xl bg-surface p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                  {item.service_name ?? item.category.name}
                </Text>
                <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
                  {formatPrice(Number(item.price))}
                </Text>
              </View>
              <View className="flex-row flex-wrap items-center gap-1.5">
                <Chip label={item.category.name} tone="info" />
                {!item.is_published ? <Chip label="Nashr etilmagan" tone="warning" /> : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
