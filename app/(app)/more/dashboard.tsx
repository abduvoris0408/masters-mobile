import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
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
import { formatAddress, formatDate, formatPrice } from "@/utils/format";

type TileTone = "emerald" | "amber" | "violet" | "sky" | "rose" | "orange";

const TONE_STYLE: Record<TileTone, { bg: string; bgDark: string; fg: string }> = {
  emerald: { bg: "#D1FAE5", bgDark: "rgba(16,185,129,0.18)", fg: "#059669" },
  amber: { bg: "#FEF3C7", bgDark: "rgba(245,158,11,0.18)", fg: "#D97706" },
  violet: { bg: "#EDE9FE", bgDark: "rgba(139,92,246,0.18)", fg: "#7C3AED" },
  sky: { bg: "#DBEAFE", bgDark: "rgba(59,130,246,0.18)", fg: "#2563EB" },
  rose: { bg: "#FFE4E6", bgDark: "rgba(244,63,94,0.18)", fg: "#E11D48" },
  orange: { bg: "#FFEDD5", bgDark: "rgba(249,115,22,0.18)", fg: "#EA580C" },
};

function StatTile({
  icon,
  label,
  value,
  achieved,
  tone = "emerald",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  achieved?: boolean;
  tone?: TileTone;
}) {
  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";
  const isDimmed = achieved === false;
  const toneStyle = TONE_STYLE[tone];

  return (
    <View className="flex-1 gap-1.5 rounded-2xl bg-surface p-3.5" style={{ minWidth: "45%" }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: isDimmed ? undefined : isDark ? toneStyle.bgDark : toneStyle.bg }}
      >
        <Ionicons name={icon} size={16} color={isDimmed ? colors.muted : toneStyle.fg} />
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
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted">
                      {masterProfile.completed_orders_count}/{masterProfile.level.next.min_orders} buyurtma
                    </Text>
                    <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                      {Math.min(
                        100,
                        Math.round(
                          (masterProfile.completed_orders_count / masterProfile.level.next.min_orders) * 100,
                        ),
                      )}
                      %
                    </Text>
                  </View>
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
              tone="sky"
            />
            <StatTile icon="trophy-outline" label="10 ta ish" achieved={stats?.is_10_orders_completed} tone="amber" />
            <StatTile icon="trophy-outline" label="50 ta ish" achieved={stats?.is_50_orders_completed} tone="orange" />
            <StatTile icon="trophy-outline" label="100+ ta ish" achieved={stats?.is_100_orders_completed} tone="rose" />
            <StatTile icon="shield-checkmark-outline" label="To'liq tekshirilgan" achieved={stats?.is_fully_verified} tone="emerald" />
            <StatTile icon="star-outline" label="Birinchi 100 mutaxassis" achieved={stats?.is_early_master} tone="violet" />
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
                    {formatAddress(order.address)}
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
