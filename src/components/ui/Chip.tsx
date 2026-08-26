import { Text, View } from "react-native";

const TONES = {
  neutral: { bg: "bg-surface border border-border", text: "text-muted" },
  success: { bg: "bg-emerald-50", text: "text-emerald-600" },
  warning: { bg: "bg-amber-50", text: "text-amber-600" },
  info: { bg: "bg-violet-50", text: "text-primary" },
} as const;

export type ChipTone = keyof typeof TONES;

interface ChipProps {
  label: string;
  tone?: ChipTone;
}

// Small status pill — "Без откликов" / "Отменено заказчиком" style labels
// from the reference screens.
export function Chip({ label, tone = "neutral" }: ChipProps) {
  const { bg, text } = TONES[tone];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
