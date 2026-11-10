import type { NativeStackNavigationOptions } from "expo-router";
import { useColorScheme } from "nativewind";
import { Platform } from "react-native";

import { HeaderBackground } from "@/components/ui/HeaderBackground";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

// Shared screenOptions for every native Stack that shows the system header
// (UINavigationBar on iOS — Liquid Glass on iOS 26 — and the Material top
// app bar on Android). Screens fill in title/buttons through <Header>.
//
// iOS: transparent, so content scrolls under the glass like system apps;
// screens pad their content by useHeaderHeight(). Android: an opaque bar
// that lays content out below itself, so useHeaderHeight() is 0 there.
export function useNativeHeaderOptions(): NativeStackNavigationOptions {
  const colors = useThemeColors();
  const isDark = useColorScheme().colorScheme === "dark";
  const isIOS = Platform.OS === "ios";

  return {
    headerShown: true,
    headerTransparent: isIOS,
    // Follow the app's theme, not the (unset, so always light) navigation
    // theme — otherwise the Liquid Glass button capsules and blur stayed
    // light in dark mode.
    headerUserInterfaceStyle: isDark ? "dark" : "light",
    // Soft progressive blur fading into the page color (iOS 26 scroll-edge
    // look) instead of UIKit's bar materials, which drew an opaque gray/black
    // band with a hard edge. The system scroll-edge effect is hidden so the
    // two don't stack.
    headerBackground: isIOS ? () => <HeaderBackground /> : undefined,
    scrollEdgeEffects: isIOS ? { top: "hidden" } : undefined,
    headerStyle: isIOS ? undefined : { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.foreground,
    headerTitleAlign: "center",
    headerTitleStyle: { fontFamily: GOLOS_WEIGHTS.semibold, fontSize: 17, color: colors.foreground },
    // Smaller than iOS's 34pt default, which read as oversized with Golos.
    headerLargeTitleStyle: { fontFamily: GOLOS_WEIGHTS.bold, fontSize: 28, color: colors.foreground },
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: colors.background },
  };
}
