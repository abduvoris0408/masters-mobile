import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLanguageStore } from "@/stores/language.store";
import { useThemeStore } from "@/stores/theme.store";
import { ETheme } from "@/types";

const LANGUAGE_OPTIONS: { value: "uz" | "ru" | "en"; label: string }[] = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export default function SettingsScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const THEME_OPTIONS: { value: ETheme; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: ETheme.SYSTEM, label: t("settings_theme_system"), icon: "phone-portrait-outline" },
    { value: ETheme.LIGHT, label: t("settings_theme_light"), icon: "sunny-outline" },
    { value: ETheme.DARK, label: t("settings_theme_dark"), icon: "moon-outline" },
  ];

  return (
    <View className="flex-1 bg-background">
      <Header title={t("settings_header")} onBackPress={() => router.back()} hideSettings />

      <View className="gap-6 px-4 py-4" style={{ paddingTop: headerHeight + 16 }}>
        <View className="gap-2">
          <Text className="px-1 text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            {t("settings_appearance")}
          </Text>
          <View className="overflow-hidden rounded-2xl bg-surface">
            {THEME_OPTIONS.map((opt, i) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? colors.accent : colors.foreground} />
                  <Text
                    className="flex-1 text-sm text-foreground"
                    style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.regular }}
                  >
                    {opt.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            {t("settings_language")}
          </Text>
          <View className="overflow-hidden rounded-2xl bg-surface">
            {LANGUAGE_OPTIONS.map((opt, i) => {
              const active = language === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setLanguage(opt.value)}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Text
                    className="flex-1 text-sm text-foreground"
                    style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.regular }}
                  >
                    {opt.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
