import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface GradientCardProps extends PropsWithChildren {
  colors?: [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

// The one hero surface in the app — a saturated gradient block that content
// (a balance, a featured profile, a promo) sits on top of, mirroring the
// reference wallet card. Everything else stays flat/white; overusing this
// would flatten its impact.
//
// Style set inline, not via `className`: LinearGradient is a third-party
// native component, not one of NativeWind's auto-intercepted primitives (the
// same class of bug hit RN's core Animated.View earlier — confirmed via
// screenshot there), so utility classes are not guaranteed to apply.
export function GradientCard({ colors = ["#22C55E", "#059669"], style, children }: GradientCardProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 28, padding: 24 }, style]}
    >
      {children}
    </LinearGradient>
  );
}
