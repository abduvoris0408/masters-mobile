import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/lib/theme/colors";

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  right?: ReactNode;
}

// Top app bar used on every screen — owns the safe-area top inset itself so
// screens never need their own SafeAreaView just for header spacing.
// `onBackPress` takes priority over `onMenuPress` when both are given.
export function Header({ title, onMenuPress, onBackPress, right }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColors().foreground;

  return (
    <View
      className="flex-row items-center justify-between bg-background px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="w-10">
        {onBackPress ? (
          <Pressable onPress={onBackPress} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </Pressable>
        ) : onMenuPress ? (
          <Pressable onPress={onMenuPress} hitSlop={8}>
            <Ionicons name="menu-outline" size={26} color={iconColor} />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <Text className="flex-1 text-center text-base font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}

      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
