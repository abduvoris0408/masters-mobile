import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { ListLabel } from "@/components/ui/Typography";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { getChatUnreadTotal, useChatUnreadSummaryQuery } from "@/services/chat";

// "worker" = any masterProfile holder (individual master or org owner),
// "client" = no masterProfile at all yet.
type TMenuAudience = "worker" | "client";

interface MenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  /** Only shown for this audience — omit to show for everyone. */
  onlyFor?: TMenuAudience;
}

// "Ko'proq" tab — every secondary destination, one row per link from the
// web project's MobileMoreSheet.tsx. Used to be a bottom sheet opened from
// the custom JS tab bar; native tabs can't intercept a tab press to open a
// sheet, so it's a real tab screen now.
export default function MenuScreen() {
  const { t } = useTranslation("common");
  const colors = useThemeColors();
  const { isWorker } = useProfilePerspective();
  const audience: TMenuAudience = isWorker ? "worker" : "client";
  const { data: unreadSummary } = useChatUnreadSummaryQuery(true);
  const unreadChatCount = getChatUnreadTotal(unreadSummary);

  const allItems: MenuItem[] = [
    { key: "my-applications", label: t("more_sheet_my_applications"), icon: "document-text-outline", href: "/more/my-applications" },
    { key: "favorites", label: t("favorites"), icon: "heart-outline", href: "/more/favorites" },
    { key: "services", label: t("more_sheet_catalog"), icon: "pricetags-outline", href: "/more/services" },
    { key: "masters-catalog", label: t("more_sheet_masters_catalog"), icon: "construct-outline", href: "/more/masters-catalog" },
    { key: "organizations-catalog", label: t("more_sheet_organizations_catalog"), icon: "business-outline", href: "/more/organizations-catalog" },
    { key: "dashboard", label: t("dashboard"), icon: "speedometer-outline", onlyFor: "worker", href: "/more/dashboard" },
    { key: "courses", label: t("more_sheet_my_courses"), icon: "school-outline", onlyFor: "worker", href: "/more/courses" },
    { key: "master-onboarding", label: t("more_sheet_switch_to_master"), icon: "briefcase-outline", onlyFor: "client", href: "/master-onboarding" },
    {
      key: "organization-onboarding",
      label: t("more_sheet_switch_to_organization"),
      icon: "business-outline",
      onlyFor: "client",
      href: "/organization-onboarding",
    },
    { key: "chat", label: t("chat"), icon: "chatbubble-outline", href: "/more/chat" },
    { key: "legal-help", label: t("more_sheet_legal_help"), icon: "shield-checkmark-outline", href: "/more/legal-help" },
    { key: "blog", label: t("more_sheet_blog"), icon: "newspaper-outline", href: "/more/blog" },
  ];
  const items = allItems.filter((item) => !item.onlyFor || item.onlyFor === audience);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("more_sheet_title")} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 8, paddingBottom: 32 }}
      >
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href as never)}
            className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5 active:bg-surface"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
              <Ionicons name={item.icon} size={19} color={colors.foreground} />
            </View>
            <ListLabel className="flex-1" numberOfLines={1}>
              {item.label}
            </ListLabel>
            {item.key === "chat" && unreadChatCount > 0 ? (
              <View className="mr-1 h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5">
                <Text className="text-xs text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
