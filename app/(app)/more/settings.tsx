import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLanguageStore, type AppLanguage } from "@/stores/language.store";
import { useThemeStore } from "@/stores/theme.store";
import { ETheme } from "@/types";

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

// Grouped settings list (iOS Settings style): a bold section title above a
// rounded card of rows, hairline dividers between rows.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="px-1 text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl bg-surface">{children}</View>
    </View>
  );
}

function Row({
  label,
  hint,
  right,
  onPress,
  first,
  disabled,
}: {
  label: string;
  hint?: string;
  right: ReactNode;
  onPress?: () => void;
  first?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-70 ${first ? "" : "border-t border-border"}`}
    >
      <View className={`flex-1 gap-0.5 ${disabled ? "opacity-40" : ""}`}>
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {label}
        </Text>
        {hint ? <Text className="text-xs text-muted">{hint}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { colorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  // Theme as two native switches instead of a 3-way radio list: "match
  // system" on defers to the OS (and disables the dark switch); off pins the
  // theme, starting from whatever is showing right now so nothing flips.
  const followSystem = preference === ETheme.SYSTEM;
  const isDark = followSystem ? colorScheme === "dark" : preference === ETheme.DARK;

  const toggleFollowSystem = (on: boolean) => {
    if (on) setPreference(ETheme.SYSTEM);
    else setPreference(colorScheme === "dark" ? ETheme.DARK : ETheme.LIGHT);
  };

  // A 3-way choice doesn't fit a switch — a row showing the current value
  // that opens the native action sheet, like iOS Settings' pickers.
  const pickLanguage = () => {
    const labels = [...LANGUAGE_OPTIONS.map((o) => o.label), t("settings_cancel")];
    const cancelButtonIndex = labels.length - 1;
    showActionSheetWithOptions({ options: labels, cancelButtonIndex, title: t("settings_language") }, (index) => {
      if (index == null || index === cancelButtonIndex) return;
      setLanguage(LANGUAGE_OPTIONS[index].value);
    });
  };

  const switchTrack = { true: colors.accent, false: colors.border };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("settings_header")} onBackPress={() => router.back()} hideSettings />

      <ScrollView contentContainerClassName="gap-7 px-4" contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 32 }}>
        <Section title={t("settings_appearance")}>
          <Row
            first
            label={t("settings_follow_system")}
            hint={t("settings_follow_system_hint")}
            right={<Switch value={followSystem} onValueChange={toggleFollowSystem} trackColor={switchTrack} />}
          />
          <Row
            label={t("settings_dark_mode")}
            disabled={followSystem}
            right={
              <Switch
                value={isDark}
                disabled={followSystem}
                onValueChange={(on) => setPreference(on ? ETheme.DARK : ETheme.LIGHT)}
                trackColor={switchTrack}
              />
            }
          />
        </Section>

        <Section title={t("settings_language")}>
          <Row
            first
            label={t("settings_language")}
            onPress={pickLanguage}
            right={
              <View className="flex-row items-center gap-1">
                <Text className="text-base text-muted">
                  {LANGUAGE_OPTIONS.find((o) => o.value === language)?.label}
                </Text>
                <Ionicons name="chevron-forward" size={17} color={colors.muted} />
              </View>
            }
          />
        </Section>
      </ScrollView>
    </View>
  );
}
