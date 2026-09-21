import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrowseIllustration } from "@/components/onboarding/BrowseIllustration";
import { FastOrderIllustration } from "@/components/onboarding/FastOrderIllustration";
import { TrustIllustration } from "@/components/onboarding/TrustIllustration";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import { useOnboardingStore } from "@/stores";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Custom SVG scenes (no photo assets in this project yet) standing in for the
// reference screenshot's photo/avatar cards — same 3-slide beat (browse →
// trusted pros → fast order), reworded for this app's domain (home-service
// masters, not an auction marketplace) and recolored to the green/emerald
// brand instead of the reference's blue.
const SLIDES = [
  { key: "browse", Illustration: BrowseIllustration },
  { key: "trust", Illustration: TrustIllustration },
  { key: "fast", Illustration: FastOrderIllustration },
];

export default function OnboardingScreen() {
  const { t } = useTranslation("onboarding");
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const finishOnboarding = () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true);
    router.replace("/(auth)/login");
  };

  const onNext = () => {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6" style={{ marginTop: insets.top + 12 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Ionicons name="hammer" size={16} color="#FFFFFF" />
          </View>
          <Text className="text-lg font-bold text-foreground">Masters</Text>
        </View>

        {!isLastSlide ? (
          <Pressable onPress={finishOnboarding} hitSlop={8}>
            <BlurView
              intensity={Platform.OS === "ios" ? 50 : 90}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.skipPill,
                { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)" },
              ]}
            >
              <Text className="text-sm font-medium text-foreground">{t("skip")}</Text>
            </BlurView>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
            <View className="mb-8 h-60 w-60 items-center justify-center">
              <item.Illustration width="100%" height="100%" />
            </View>

            <Text className="text-center text-2xl font-bold text-foreground">{t(`${item.key}_title`)}</Text>
            <Text className="mt-3 text-center text-sm leading-5 text-muted">{t(`${item.key}_subtitle`)}</Text>
          </View>
        )}
      />

      <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              className="h-2 rounded-full"
              style={{
                width: index === activeIndex ? 24 : 8,
                backgroundColor: index === activeIndex ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        <Pressable onPress={onNext}>
          <BlurView
            intensity={Platform.OS === "ios" ? 60 : 100}
            tint={isDark ? "dark" : "light"}
            style={[styles.cta, { backgroundColor: "rgba(22,163,74,0.78)" }]}
          >
            <Text className="text-base text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {isLastSlide ? t("get_started") : t("next")}
            </Text>
          </BlurView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  skipPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
};
