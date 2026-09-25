import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { Body, Caption, ListLabel } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

export function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-center gap-3 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <View className="flex-1">
        <Caption>{label}</Caption>
        <Body style={{ fontFamily: GOLOS_WEIGHTS.medium }}>{value}</Body>
      </View>
    </View>
  );
}

export function NavRow({
  icon,
  label,
  onPress,
  color = "#34C759",
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  isLast?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      className={`flex-row items-center gap-3 py-3 ${isLast ? "" : "border-b border-border"}`}
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: color }}>
        <Ionicons name={icon} size={19} color="#FFFFFF" />
      </View>
      <ListLabel className="flex-1">{label}</ListLabel>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}
