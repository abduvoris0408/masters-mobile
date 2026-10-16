import type { NativeStackNavigationOptions } from "expo-router";
import { Platform } from "react-native";

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
  const isIOS = Platform.OS === "ios";

  return {
    headerShown: true,
    headerTransparent: isIOS,
    headerStyle: isIOS ? undefined : { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.foreground,
    headerTitleAlign: "center",
    headerTitleStyle: { fontFamily: GOLOS_WEIGHTS.bold, color: colors.foreground },
    headerLargeTitleStyle: { fontFamily: GOLOS_WEIGHTS.bold, color: colors.foreground },
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: colors.background },
  };
}
