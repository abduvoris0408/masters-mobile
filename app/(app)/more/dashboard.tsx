import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMyMasterOrdersQuery } from "@/services/application";
import { useMasterProfileQuery, useProfileStatisticsQuery } from "@/services/master";
import { ORDER_STATUS_LABEL } from "@/utils/orderStatus";
import { formatDate, formatPrice } from "@/utils/format";

function StatTile({
  icon,
  label,
  value,
  achieved,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  achieved?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 gap-1.5 rounded-2xl bg-surface p-3.5" style={{ minWidth: "45%" }}>
      <View
        className={`h-8 w-8 items-center justify-center rounded-xl ${achieved ? "bg-emerald-50 dark:bg-accent/15" : "bg-background"}`}
      >
        <Ionicons name={icon} size={16} color={achieved ? colors.accent : colors.muted} />
      </View>
      {value ? (
        <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
          {value}
        </Text>
      ) : null}
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile, isLoading: profileLoading } = useMasterProfileQuery();
  const masterProfile = profile?.master_profile ? profile : null;
  const { data: stats, isLoading: statsLoading } = useProfileStatisticsQuery(masterProfile?.guid ?? null);
  const { data: orders, isLoading: ordersLoading } = useMyMasterOrdersQuery(1, 5);

  const isLoading = profileLoading || statsLoading;

  return (
    <View className="flex-1 bg-background">
      <Header title="Dashboard" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !masterProfile ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="speedometer-outline" title="Mutaxassis profili topilmadi" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4" contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 32 }}>
          {masterProfile.level ? (
            <View className="gap-3 rounded-3xl bg-surface p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15">
                  <Ionicons name="ribbon-outline" size={20} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Mutaxassis darajasi</Text>
                  <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                    {masterProfile.level.current.name}
                  </Text>
                </View>
              </View>
              {masterProfile.level.next ? (
                <View className="gap-1.5">
                  <View className="h-1.5 overflow-hidden rounded-full bg-background">
                    <View
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (masterProfile.completed_orders_count / masterProfile.level.next.min_orders) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </View>
                  <Text className="text-xs text-muted">
                    "{masterProfile.level.next.name}" darajasigacha yana{" "}
                    {Math.max(0, masterProfile.level.next.min_orders - masterProfile.completed_orders_count)} ta buyurtma
                  </Text>
                </View>
              ) : (
                <Text className="text-xs text-muted">Eng yuqori daraja qo'lga kiritildi</Text>
              )}
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-3">
            <StatTile
              icon="briefcase-outline"
              label="Bajarilgan buyurtmalar"
              value={String(stats?.completed_orders_count ?? masterProfile.completed_orders_count ?? 0)}
            />
            <StatTile icon="trophy-outline" label="10 ta ish" achieved={stats?.is_10_orders_completed} />
            <StatTile icon="trophy-outline" label="50 ta ish" achieved={stats?.is_50_orders_completed} />
            <StatTile icon="trophy-outline" label="100+ ta ish" achieved={stats?.is_100_orders_completed} />
            <StatTile icon="shield-checkmark-outline" label="To'liq tekshirilgan" achieved={stats?.is_fully_verified} />
            <StatTile icon="star-outline" label="Birinchi 100 mutaxassis" achieved={stats?.is_early_master} />
          </View>

          <View className="gap-2">
            <Text className="px-1 text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
              So'nggi buyurtmalar
            </Text>
            {ordersLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : !orders?.results.length ? (
              <View className="items-center rounded-3xl bg-surface p-6">
                <Text className="text-sm text-muted">Hozircha buyurtmalar yo'q</Text>
              </View>
            ) : (
              orders.results.map((order) => (
                <Card key={order.guid} className="gap-1.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                      #{order.order_number}
                    </Text>
                    <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                      {formatPrice(Number(order.price))}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted" numberOfLines={1}>
                    {order.address}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted">{formatDate(order.created_at)}</Text>
                    <Text className="text-xs text-accent">{ORDER_STATUS_LABEL[order.status] ?? order.status}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
