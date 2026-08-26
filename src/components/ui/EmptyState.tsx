import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Plain, illustration-free empty state (matches the "Вы пока не откликнулись
// ни на одно задание" pattern) — a real illustration can replace `icon`
// later without touching call sites.
export function EmptyState({ icon = "file-tray-outline", title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-2 px-10">
      <Ionicons name={icon} size={40} color={colors.muted} />
      <Text className="mt-2 text-center text-base font-medium text-foreground">{title}</Text>
      {description ? <Text className="text-center text-sm text-muted">{description}</Text> : null}
      {actionLabel ? (
        <Button className="mt-6 w-full" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
