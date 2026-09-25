import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";

interface ProgressiveBlurViewProps extends PropsWithChildren {
  intensity?: number;
  tint?: "light" | "dark";
  /** "down" fades the blur toward the bottom (header), "up" toward the top (tab bar). */
  fade?: "down" | "up";
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
}

// iOS-style "liquid glass" bar: full blur strength near the bar's anchored
// edge, fading to fully transparent toward the opposite edge — the frosted
// look in the Shortcuts app reference, not a flat uniform blur. Needs
// @react-native-masked-view (native module, dev-client/EAS build only, no
// Expo Go) since RN has no CSS mask-image equivalent.
//
// Android skips the native blur entirely: expo-blur's SDK 57 Android
// implementation only actually blurs when the content behind it is wrapped
// in a <BlurTargetView> and passed via the `blurTarget` ref prop — without
// that wiring (which this component's callers don't do, since they blur
// arbitrary screen content, not a single sibling view) BlurView renders as a
// plain semi-transparent layer on Android, i.e. a washed-out/hazy bar with
// no actual frosted-glass effect. A solid tinted fallback looks intentional
// on every device instead of looking broken on most Android ones.
export function ProgressiveBlurView({ intensity = 80, tint = "light", fade = "down", style, onLayout, children }: ProgressiveBlurViewProps) {
  const gradientColors = fade === "down" ? (["#000000", "#000000", "transparent"] as const) : (["transparent", "#000000", "#000000"] as const);

  if (Platform.OS === "android") {
    const solidColor = tint === "dark" ? "rgba(24,27,36,0.96)" : "rgba(255,255,255,0.96)";
    return (
      <View style={[style, { backgroundColor: solidColor }]} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  return (
    <View style={style} onLayout={onLayout}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      </MaskedView>
      {children}
    </View>
  );
}
