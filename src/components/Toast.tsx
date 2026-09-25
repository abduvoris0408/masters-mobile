import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import type { ToastKind } from "@/stores/toast.store";
import { useToastStore } from "@/stores/toast.store";

const KIND_META: Record<ToastKind, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  error: { icon: "close-circle", tint: "#DC2626" },
  success: { icon: "checkmark-circle", tint: "#059669" },
  warning: { icon: "warning", tint: "#D97706" },
};

// Backs @/utils/toast's showError/showSuccess/showWarning — mounted once in
// the root layout. Liquid-glass card (matches the header/tab-bar language)
// with a colored icon tile per kind instead of a solid-color banner, plus a
// spring slide-in / fade-out so it doesn't just snap in and out.
export function Toast() {
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!toast) return;
    progress.value = 0;
    progress.value = withSpring(1, { damping: 16, stiffness: 180 });
    const timer = setTimeout(() => {
      progress.value = withTiming(0, { duration: 180 });
      setTimeout(() => dismiss(toast.id), 180);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -24 }, { scale: 0.96 + progress.value * 0.04 }],
  }));

  if (!toast) return null;
  const meta = KIND_META[toast.kind];

  return (
    <Animated.View
      style={[{ position: "absolute", left: 14, right: 14, top: insets.top + 10, zIndex: 100 }, animatedStyle]}
    >
      <Pressable
        onPress={() => dismiss(toast.id)}
        className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 ${isDark ? "border-white/10 bg-[#1c1f2a]/95" : "border-black/5 bg-white/95"}`}
        style={{
          shadowColor: "#0F172A",
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      >
        <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${meta.tint}1F` }}>
          <Ionicons name={meta.icon} size={18} color={meta.tint} />
        </View>
        <CardTitle className="flex-1">{toast.message}</CardTitle>
      </Pressable>
    </Animated.View>
  );
}
