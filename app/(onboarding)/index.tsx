import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { useActionSheet } from "@expo/react-native-action-sheet";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { BrowseIllustration } from "@/components/onboarding/BrowseIllustration";
import { FastOrderIllustration } from "@/components/onboarding/FastOrderIllustration";
import { TrustIllustration } from "@/components/onboarding/TrustIllustration";
import { SectionTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { useOnboardingStore } from "@/stores";
import { useLanguageStore, type AppLanguage } from "@/stores/language.store";
import { useThemeStore } from "@/stores/theme.store";
import { ETheme } from "@/types";

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string; short: string }[] = [
  { value: "uz", label: "O'zbekcha", short: "UZ" },
  { value: "ru", label: "Русский", short: "RU" },
  { value: "en", label: "English", short: "EN" },
];

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

// Illustration + copy ease in (fade + rise) each time their slide becomes the
// active one, instead of just snapping into place with the paging scroll —
// small touch that keeps the 3-slide beat from feeling static.
function OnboardingSlide({
  Illustration,
  title,
  subtitle,
  isActive,
}: {
  Illustration: (typeof SLIDES)[number]["Illustration"];
  title: string;
  subtitle: string;
  isActive: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(isActive ? 1 : 0, { duration: 420 });
  }, [isActive, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 18 }],
  }));

  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      <Animated.View style={[{ marginBottom: 32, height: 240, width: 240, alignItems: "center", justifyContent: "center" }, animatedStyle]}>
        <Illustration width="100%" height="100%" />
      </Animated.View>

      <Animated.View style={animatedStyle}>
        <Text className="text-center text-2xl font-bold text-foreground">{title}</Text>
        <Text className="mt-3 text-center text-sm leading-5 text-muted">{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

// Android: expo-blur only actually blurs when the content behind it is
// wrapped in a <BlurTargetView>, which these small floating pills don't do
// (they sit over an arbitrary scrolling illustration, not one fixed sibling)
// — without that wiring BlurView just renders as a flat translucent layer,
// i.e. a washed-out, barely-legible pill. A solid tinted pill sidesteps that.
function BlurPill({
  isDark,
  style,
  children,
}: {
  isDark: boolean;
  style: object;
  children: ReactNode;
}) {
  if (Platform.OS === "android") {
    return (
      <View style={[style, { backgroundColor: isDark ? "rgba(24,27,36,0.96)" : "rgba(255,255,255,0.96)" }]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView
      intensity={50}
      tint={isDark ? "dark" : "light"}
      style={[style, { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)" }]}
    >
      {children}
    </BlurView>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation("onboarding");
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { showActionSheetWithOptions } = useActionSheet();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const toggleTheme = () => setThemePreference(isDark ? ETheme.LIGHT : ETheme.DARK);

  const openLanguagePicker = () => {
    const labels = [...LANGUAGE_OPTIONS.map((o) => o.label), t("cancel", { defaultValue: "Bekor qilish" })];
    const cancelButtonIndex = labels.length - 1;
    showActionSheetWithOptions({ options: labels, cancelButtonIndex }, (selectedIndex) => {
      if (selectedIndex == null || selectedIndex === cancelButtonIndex) return;
      setLanguage(LANGUAGE_OPTIONS[selectedIndex].value);
    });
  };

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
        <View className="flex-row items-center gap-2.5">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
            <Ionicons name="hammer" size={22} color="#FFFFFF" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Masters</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable onPress={toggleTheme} hitSlop={8}>
            <BlurPill style={styles.iconPill} isDark={isDark}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={16} color={colors.foreground} />
            </BlurPill>
          </Pressable>

          <Pressable onPress={openLanguagePicker} hitSlop={8}>
            <BlurPill style={styles.skipPill} isDark={isDark}>
              <Text className="text-sm font-medium text-foreground">
                {LANGUAGE_OPTIONS.find((o) => o.value === language)?.short ?? "UZ"}
              </Text>
            </BlurPill>
          </Pressable>

          {!isLastSlide ? (
            <Pressable onPress={finishOnboarding} hitSlop={8}>
              <BlurPill style={styles.skipPill} isDark={isDark}>
                <Text className="text-sm font-medium text-foreground">{t("skip")}</Text>
              </BlurPill>
            </Pressable>
          ) : null}
        </View>
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
        renderItem={({ item, index }) => (
          <OnboardingSlide
            Illustration={item.Illustration}
            title={t(`${item.key}_title`)}
            subtitle={t(`${item.key}_subtitle`)}
            isActive={index === activeIndex}
          />
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
          {Platform.OS === "android" ? (
            <View style={[styles.cta, { backgroundColor: "rgba(22,163,74,0.96)" }]}>
              <SectionTitle className="text-white">{isLastSlide ? t("get_started") : t("next")}</SectionTitle>
            </View>
          ) : (
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={[styles.cta, { backgroundColor: "rgba(22,163,74,0.78)" }]}>
              <SectionTitle className="text-white">{isLastSlide ? t("get_started") : t("next")}</SectionTitle>
            </BlurView>
          )}
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
  iconPill: {
    height: 36,
    width: 36,
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
