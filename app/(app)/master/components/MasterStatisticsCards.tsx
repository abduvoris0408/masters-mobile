import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { BadgeLabel } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { useProfileStatisticsQuery } from "@/services/master";

interface StatItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value?: number;
}

// Same rectangular stat-tile look used elsewhere (dashboard's own stats row)
// — the completed-orders count always renders (zero included), while the
// milestone/verification/early-master badges are achievements that only
// appear once their backing flag is true.
export function MasterStatisticsCards({ guid, completedOrders }: { guid: string; completedOrders: number }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const { data: statistics, isLoading } = useProfileStatisticsQuery(guid);

  const items: StatItem[] = [
    { key: "count", icon: "briefcase-outline", color: colors.accent, label: t("master_stats_completed_orders"), value: completedOrders },
    statistics?.is_10_orders_completed && { key: "10", icon: "trophy-outline", color: "#F59E0B", label: t("master_stats_10_orders") },
    statistics?.is_50_orders_completed && { key: "50", icon: "trophy-outline", color: "#F59E0B", label: t("master_stats_50_orders") },
    statistics?.is_100_orders_completed && { key: "100", icon: "trophy-outline", color: "#F59E0B", label: t("master_stats_100_orders") },
    statistics?.is_fully_verified && {
      key: "verified",
      icon: "shield-checkmark-outline",
      color: "#059669",
      label: t("master_stats_fully_verified"),
    },
    statistics?.is_early_master && { key: "early", icon: "rocket-outline", color: "#8B5CF6", label: t("master_stats_early_master") },
  ].filter((item): item is StatItem => !!item);

  if (isLoading) {
    return (
      <View className="items-center rounded-3xl bg-surface p-6">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map((item) => (
        <View key={item.key} className="gap-2 rounded-2xl bg-surface p-3.5" style={{ minWidth: "30%", flexGrow: 1 }}>
          <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}1F` }}>
            <Ionicons name={item.icon} size={17} color={item.color} />
          </View>
          <BadgeLabel className="text-foreground">
            {item.value !== undefined ? `${item.label}: ${item.value}` : item.label}
          </BadgeLabel>
        </View>
      ))}
    </View>
  );
}
