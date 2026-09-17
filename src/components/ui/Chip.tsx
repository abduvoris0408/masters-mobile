import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const ICON_COLOR = {
  neutral: "#79748A",
  success: "#059669",
  warning: "#D97706",
  info: "#16A34A",
  danger: "#DC2626",
} as const;

const TONES = {
  neutral: { bg: "bg-surface border border-border", text: "text-muted" },
  success: { bg: "bg-emerald-50 dark:bg-accent/15", text: "text-emerald-600 dark:text-accent" },
  warning: { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  info: { bg: "bg-emerald-50 dark:bg-primary/15", text: "text-primary" },
  danger: { bg: "bg-red-50 dark:bg-danger/15", text: "text-danger" },
} as const;

export type ChipTone = keyof typeof TONES;

interface ChipProps {
  label: string;
  tone?: ChipTone;
  icon?: keyof typeof Ionicons.glyphMap;
}

// Small status pill — "Без откликов" / "Отменено заказчиком" style labels
// from the reference screens.
export function Chip({ label, tone = "neutral", icon }: ChipProps) {
  const { bg, text } = TONES[tone];
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-3 py-1 ${bg}`}>
      {icon ? <Ionicons name={icon} size={12} color={ICON_COLOR[tone]} /> : null}
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
