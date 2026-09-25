import { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useThemeColors } from "@/lib/theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Check mark path length (measured for this exact path string) — the stroke
// is drawn in by animating dashoffset from this down to 0, the standard
// SVG "draw-on" trick, since RN has no equivalent of CSS's path() timing.
const CHECK_PATH = "M18 34L28 44L46 24";
const CHECK_LENGTH = 40;
const CIRCLE_RADIUS = 30;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

interface SuccessCheckmarkProps {
  size?: number;
}

// Self-contained, no Lottie/JSON asset — a filled circle springs in, its
// outline ring draws around it, then the check mark strokes itself on.
// Mirrors the web project's checkmark.json beat (circle burst → check
// draws in) without pulling in lottie-react-native for one animation.
export function SuccessCheckmark({ size = 96 }: SuccessCheckmarkProps) {
  const colors = useThemeColors();
  const fillScale = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  useEffect(() => {
    fillScale.value = withSpring(1, { damping: 9, stiffness: 140 });
    ringProgress.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    checkProgress.value = withDelay(
      280,
      withSequence(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })),
    );
  }, [checkProgress, fillScale, ringProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fillScale.value }],
    opacity: fillScale.value,
  }));

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_CIRCUMFERENCE * (1 - ringProgress.value),
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - checkProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: "absolute", inset: 0 }, fillStyle]}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={CIRCLE_RADIUS} fill={colors.accent} />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
        <AnimatedCircle
          cx={32}
          cy={32}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          animatedProps={ringAnimatedProps}
          strokeLinecap="round"
        />
        <AnimatedPath
          d={CHECK_PATH}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkAnimatedProps}
        />
      </Svg>
    </View>
  );
}
