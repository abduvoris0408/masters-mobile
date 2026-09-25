import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Header } from "@/components/ui/Header";
import { Caption, ListLabel } from "@/components/ui/Typography";
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

// Drawn with react-native-svg rather than Ionicons — the icon-font glyph
// intermittently failed to rasterize here (Expo Go font-cache flakiness),
// leaving the row looking like the icon+label had merged with nothing
// selected on the right. An SVG path has no font dependency to fail.
function CheckBadge({ active, color, borderColor }: { active: boolean; color: string; borderColor: string }) {
  return (
    <View
      className="h-6 w-6 items-center justify-center rounded-full"
      style={active ? { backgroundColor: color } : { borderWidth: 2, borderColor }}
    >
      {active ? (
        <Svg width={13} height={13} viewBox="0 0 24 24">
          <Path d="M5 13L10 18L19 7" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}

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

      <View className="gap-7 px-4 py-4" style={{ paddingTop: headerHeight + 16 }}>
        <View className="gap-2.5">
          <Caption className="px-1 text-sm">{t("settings_appearance")}</Caption>
          <View className="overflow-hidden rounded-2xl bg-surface">
            {THEME_OPTIONS.map((opt, i) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  className={`flex-row items-center gap-4 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <View style={{ width: 22, alignItems: "center" }}>
                    <Ionicons name={opt.icon} size={20} color={active ? colors.accent : colors.foreground} />
                  </View>
                  <ListLabel className="flex-1" style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium }}>
                    {opt.label}
                  </ListLabel>
                  <CheckBadge active={active} color={colors.accent} borderColor={colors.border} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2.5">
          <Caption className="px-1 text-sm">{t("settings_language")}</Caption>
          <View className="overflow-hidden rounded-2xl bg-surface">
            {LANGUAGE_OPTIONS.map((opt, i) => {
              const active = language === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setLanguage(opt.value)}
                  className={`flex-row items-center gap-4 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <View style={{ width: 22, alignItems: "center" }}>
                    <Ionicons name="language-outline" size={20} color={active ? colors.accent : colors.foreground} />
                  </View>
                  <ListLabel className="flex-1" style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium }}>
                    {opt.label}
                  </ListLabel>
                  <CheckBadge active={active} color={colors.accent} borderColor={colors.border} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
