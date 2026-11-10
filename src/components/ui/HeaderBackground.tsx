import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { StyleSheet, View } from "react-native";

import { ProgressiveBlurView } from "@/components/ui/ProgressiveBlurView";
import { useThemeColors } from "@/lib/theme/colors";

// iOS header background: the soft scroll-edge look of iOS 26 system apps —
// content scrolling under the transparent bar blurs and fades into the page
// color toward the top, with no hard edge or separate bar color. A
// progressive blur (full near the top, clear at the bottom) plus a veil of
// the page's own background color so the tint always matches the screen.
// At rest there's nothing under the bar, so it's invisible until scrolled.
export function HeaderBackground() {
  const colors = useThemeColors();
  const isDark = useColorScheme().colorScheme === "dark";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ProgressiveBlurView intensity={isDark ? 40 : 30} tint={isDark ? "dark" : "light"} fade="down" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${colors.background}F2`, `${colors.background}B3`, `${colors.background}00`]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
