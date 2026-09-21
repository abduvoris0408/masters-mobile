import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NotificationBell } from "@/components/NotificationBell";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { ProgressiveBlurView } from "@/components/ui/ProgressiveBlurView";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useAuthStore } from "@/stores";

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  right?: ReactNode;
  /** The notifications screen itself hides the bell — mirrors the web
   *  shell header's onNotificationsPage check (no point linking to the
   *  page you're already on). */
  hideRight?: boolean;
  /** The settings screen itself hides the settings gear — no point linking
   *  to the page you're already on. */
  hideSettings?: boolean;
}

// Floating liquid-glass header — absolutely positioned over the screen's
// content (screens add matching top padding, see useHeaderHeight) instead of
// sitting in-flow, so content is visible scrolling underneath the frosted
// glass, fading to fully transparent toward the bottom edge.
// Left slot priority: onBackPress > onSearchPress > onMenuPress. The
// top-level catalog tabs (Asosiy, Mutaxassislar) use onSearchPress instead of
// a back/menu button — there's nowhere to go "back" to from a tab root, and
// the reference screens show a search icon there instead.
// Right slot defaults to the notification bell (signed-in users only) unless
// a screen passes its own `right` or sets `hideRight` — matches the web
// shell header, where the bell is the one consistent default action. Every
// slot (back/search/menu/bell) renders through the same HeaderIconButton so
// they share one visual size/weight instead of the bell looking bare next to
// a bordered back button.
export function Header({ title, onMenuPress, onBackPress, onSearchPress, right, hideRight, hideSettings }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColors().foreground;
  const isAuth = useAuthStore((s) => s.isAuth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const resolvedRight =
    right ??
    (!hideRight && isAuth ? (
      <View className="flex-row items-center gap-1.5">
        {hideSettings ? null : (
          <HeaderIconButton onPress={() => router.push("/more/settings")}>
            <Ionicons name="settings-outline" size={20} color={iconColor} />
          </HeaderIconButton>
        )}
        <NotificationBell />
      </View>
    ) : null);

  return (
    <ProgressiveBlurView
      fade="down"
      intensity={70}
      tint={isDark ? "dark" : "light"}
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}
    >
      <View className="flex-row items-center justify-between px-4 pb-3" style={{ paddingTop: insets.top + 10 }}>
        <View style={{ minWidth: 84 }}>
          {onBackPress ? (
            <HeaderIconButton onPress={onBackPress}>
              <Ionicons name="chevron-back" size={22} color={iconColor} />
            </HeaderIconButton>
          ) : onSearchPress ? (
            <HeaderIconButton onPress={onSearchPress}>
              <Ionicons name="search-outline" size={20} color={iconColor} />
            </HeaderIconButton>
          ) : onMenuPress ? (
            <HeaderIconButton onPress={onMenuPress}>
              <Ionicons name="menu-outline" size={24} color={iconColor} />
            </HeaderIconButton>
          ) : null}
        </View>

        {title ? (
          <Text
            className="flex-1 text-center text-lg text-foreground"
            style={{ fontFamily: GOLOS_WEIGHTS.bold }}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : (
          <View className="flex-1" />
        )}

        <View className="items-end" style={{ minWidth: 84 }}>
          {resolvedRight}
        </View>
      </View>
    </ProgressiveBlurView>
  );
}
