import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useNavigation } from "expo-router";
import type { ReactNode } from "react";
import { Platform, Text, View } from "react-native";

import { NotificationBell } from "@/components/NotificationBell";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useAuthStore } from "@/stores";

interface HeaderProps {
  title?: string;
  /** Title on the left of the bar (same row as the buttons) while the page
   *  is at the top; once scrolled (`collapsed`, from useHeaderCollapse) it
   *  moves to the center and the bar gets a blurred background. Used on tab
   *  roots and list screens; detail pages and forms keep the plain centered
   *  title. Android shows a Material left-aligned title instead. */
  largeTitle?: boolean;
  collapsed?: boolean;
  /** Custom left slot for tab roots, where there's no back button (e.g. the
   *  app logo on Asosiy). Ignored when the native back button is shown. */
  left?: ReactNode;
  /** Only used when the screen is the first in its stack (e.g. opened from a
   *  deep link) — otherwise the native back button is shown and does the
   *  same thing a router.back() would. */
  onBackPress?: () => void;
  right?: ReactNode;
  /** The notifications screen itself hides the bell — mirrors the web
   *  shell header's onNotificationsPage check (no point linking to the
   *  page you're already on). */
  hideRight?: boolean;
  /** The settings screen itself hides the settings gear — no point linking
   *  to the page you're already on. */
  hideSettings?: boolean;
}

// Configures the screen's native header (UINavigationBar on iOS — Liquid
// Glass on iOS 26 — Material top app bar on Android) instead of drawing one
// in JS; the look itself comes from useNativeHeaderOptions in the stack
// layouts. Renders nothing of its own, so screens keep calling it the same
// way they did when it was a floating JS header.
// Left slot: native back button whenever there's somewhere to go back to;
// otherwise `left`, or a back button for onBackPress.
// Right slot defaults to settings + notification bell (signed-in users only)
// unless a screen passes its own `right` or sets `hideRight`.
export function Header({
  title,
  largeTitle,
  collapsed,
  left: customLeft,
  onBackPress,
  right,
  hideRight,
  hideSettings,
}: HeaderProps) {
  const iconColor = useThemeColors().foreground;
  const isAuth = useAuthStore((s) => s.isAuth);
  const navigation = useNavigation();
  // Same test the native back button uses: is there a screen below this one
  // in its *own* stack? (navigation.canGoBack() also counts parent
  // navigators, so it reads true on tab roots after switching tabs.)
  const canGoBack = (navigation.getState()?.index ?? 0) > 0;

  const resolvedRight =
    right ??
    (!hideRight && isAuth ? (
      <View className="flex-row items-center gap-1">
        {hideSettings ? null : (
          <HeaderIconButton onPress={() => router.push("/more/settings")}>
            <Ionicons name="settings-outline" size={21} color={iconColor} />
          </HeaderIconButton>
        )}
        <NotificationBell />
      </View>
    ) : null);

  const left = canGoBack ? null : customLeft ? (
    customLeft
  ) : onBackPress ? (
    <HeaderIconButton onPress={onBackPress}>
      <Ionicons name="chevron-back" size={24} color={iconColor} />
    </HeaderIconButton>
  ) : null;

  // A custom left element (the brand on Asosiy) isn't a button, so on iOS 26
  // it's opted out of the Liquid Glass capsule the bar wraps items in.
  // unstable_headerLeftItems is iOS-only and overrides headerLeft there;
  // Android keeps using headerLeft.
  const plainLeft = !canGoBack && !!customLeft;
  const rightOption = resolvedRight ? () => resolvedRight : undefined;

  if (largeTitle && Platform.OS === "android") {
    return (
      <Stack.Screen
        options={{
          title: title ?? "",
          headerTitleAlign: "left",
          headerTitleStyle: { fontFamily: GOLOS_WEIGHTS.semibold, fontSize: 20, color: iconColor },
          headerLeft: left ? () => left : undefined,
          headerRight: rightOption,
        }}
      />
    );
  }

  if (largeTitle && !collapsed) {
    // At the top: the title sits in the bar's left slot as plain text (no
    // Liquid Glass capsule), next to the native back button when there is
    // one; the centered title is empty and the bar has no background.
    const leftTitle = (
      <Text
        className="text-foreground"
        style={{ fontFamily: GOLOS_WEIGHTS.semibold, fontSize: 22, maxWidth: 240 }}
        numberOfLines={1}
      >
        {title}
      </Text>
    );
    return (
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: canGoBack,
          headerLeft: () => leftTitle,
          unstable_headerLeftItems: () => [{ type: "custom", element: leftTitle, hidesSharedBackground: true }],
          headerRight: rightOption,
        }}
      />
    );
  }

  return (
    <Stack.Screen
      options={{
        title: title ?? "",
        headerBackVisible: true,
        headerLeft: left ? () => left : undefined,
        unstable_headerLeftItems: plainLeft
          ? () => [{ type: "custom", element: <>{customLeft}</>, hidesSharedBackground: true }]
          : undefined,
        headerRight: rightOption,
        // The blurred backdrop comes from HeaderBackground (stack
        // screenOptions), shown on every iOS screen as content scrolls under.
      }}
    />
  );
}
