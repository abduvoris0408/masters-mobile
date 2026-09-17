import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { useThemeColors } from "@/lib/theme/colors";
import { useUnreadNotificationsCountQuery } from "@/services/notification";

// Header bell + unread badge, shared by every top-level screen — mirrors the
// web project's navbar bell (src/pages/notifications/notifications.tsx's
// unreadCount) instead of a hardcoded placeholder number. Renders through
// the same HeaderIconButton as the header's back/search/menu slots so every
// header action shares one visual size/weight.
export function NotificationBell() {
  const colors = useThemeColors();
  const { data } = useUnreadNotificationsCountQuery();
  const count = data?.count ?? 0;

  return (
    <HeaderIconButton onPress={() => router.push("/notifications")}>
      <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
      {count > 0 ? (
        <View className="absolute -right-1.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1">
          <Text className="text-[10px] text-white" style={{ fontWeight: "700" }}>
            {count > 9 ? "9+" : count}
          </Text>
        </View>
      ) : null}
    </HeaderIconButton>
  );
}
