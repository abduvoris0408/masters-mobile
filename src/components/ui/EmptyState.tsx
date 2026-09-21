import type { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { Button } from "./Button";
import { EmptyStateIllustration } from "./EmptyStateIllustration";

interface EmptyStateProps {
  /** Unused visually — kept so existing call sites (Ionicons name literals)
   *  don't need touching; every state renders the same line-art scene. */
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Every "no data yet" / error / filtered-empty screen (29+ call sites)
// shares this one component — a restrained line-art illustration (same
// visual language as the onboarding scenes) instead of a loud solid-color
// icon badge, so it reads as minimal and consistent everywhere.
export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    progress.value = withDelay(60, withTiming(1, { duration: 420 }));
    scale.value = withDelay(60, withSpring(1, { damping: 14, stiffness: 160 }));
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return (
    <View className="flex-1 items-center justify-center gap-1 px-10">
      <Animated.View style={badgeStyle}>
        <EmptyStateIllustration width={148} height={148} />
      </Animated.View>

      <Animated.View style={[textStyle, { alignItems: "center", gap: 6, marginTop: 6 }]}>
        <Text
          className="text-center text-foreground"
          style={{ fontFamily: GOLOS_WEIGHTS.bold, fontSize: 18 }}
        >
          {title}
        </Text>
        {description ? (
          <Text className="max-w-[240px] text-center text-[13px] leading-5 text-muted">{description}</Text>
        ) : null}
      </Animated.View>

      {actionLabel ? (
        <Button className="mt-6 w-full" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
