import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { useThemeColors } from "@/lib/theme/colors";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

// One pulsing block — the building unit for every screen's *Skeleton.tsx
// (e.g. ListingCardSkeleton). Pulses opacity between 0.4 and 1 on a loop
// instead of a spinner, so a loading list reads as "content is forming"
// rather than "wait" — matches the shape of what's about to appear.
export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
  }));

  return (
    <Animated.View style={[animatedStyle]}>
      <View style={[{ width, height, borderRadius: radius, backgroundColor: colors.border }, style]} />
    </Animated.View>
  );
}
