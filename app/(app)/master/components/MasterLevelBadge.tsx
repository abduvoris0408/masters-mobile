import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import type { IMasterLevelProgress } from "@/types";

// Small inline pill next to the master's name — mirrors the web project's
// MasterLevelBadge, minus the hover popover (no hover on touch — the level
// name is already legible at a glance in the pill itself).
export function MasterLevelBadge({ level }: { level: IMasterLevelProgress }) {
  const colors = useThemeColors();
  const current = level.current;

  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-full bg-emerald-50 py-1 pl-1 pr-2.5 dark:bg-accent/15"
      style={{ borderWidth: 1, borderColor: `${colors.accent}45` }}
    >
      <View className="h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-surface">
        {current.icon ? (
          <Image source={{ uri: current.icon }} style={{ width: 14, height: 14 }} resizeMode="contain" />
        ) : (
          <Ionicons name="ribbon" size={12} color={colors.accent} />
        )}
      </View>
      <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={1}>
        {current.name}
      </Text>
    </View>
  );
}
