import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

interface ProgressiveBlurViewProps extends PropsWithChildren {
  intensity?: number;
  tint?: "light" | "dark";
  /** "down" fades the blur toward the bottom (header), "up" toward the top (tab bar). */
  fade?: "down" | "up";
  style?: StyleProp<ViewStyle>;
}

// iOS-style "liquid glass" bar: full blur strength near the bar's anchored
// edge, fading to fully transparent toward the opposite edge — the frosted
// look in the Shortcuts app reference, not a flat uniform blur. Needs
// @react-native-masked-view (native module, dev-client/EAS build only, no
// Expo Go) since RN has no CSS mask-image equivalent.
export function ProgressiveBlurView({ intensity = 80, tint = "light", fade = "down", style, children }: ProgressiveBlurViewProps) {
  const gradientColors = fade === "down" ? (["#000000", "#000000", "transparent"] as const) : (["transparent", "#000000", "#000000"] as const);

  return (
    <View style={style}>
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
