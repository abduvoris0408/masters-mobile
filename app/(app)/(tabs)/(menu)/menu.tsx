import type { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { ListGroup, ListRow } from "@/components/ui/GroupedList";
import { Header } from "@/components/ui/Header";
import { useHeaderCollapse } from "@/hooks/useHeaderCollapse";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { getChatUnreadTotal, useChatUnreadSummaryQuery } from "@/services/chat";

// "worker" = any masterProfile holder (individual master or org owner),
// "client" = no masterProfile at all yet.
type TMenuAudience = "worker" | "client";

interface MenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** iOS system color for the icon tile. */
  color: string;
  href: string;
  badge?: number;
  /** Only shown for this audience — omit to show for everyone. */
  onlyFor?: TMenuAudience;
}

// "Ko'proq" tab — every secondary destination from the web project's
// MobileMoreSheet.tsx, laid out as an iOS grouped list (Telegram/Settings
// style): related links share a rounded group, each row has a colored tile.
export default function MenuScreen() {
  const { collapsed, scrollProps } = useHeaderCollapse();
  const { t } = useTranslation("common");
  const { isWorker } = useProfilePerspective();
  const audience: TMenuAudience = isWorker ? "worker" : "client";
  const { data: unreadSummary } = useChatUnreadSummaryQuery(true);
  const unreadChatCount = getChatUnreadTotal(unreadSummary);

  const groups: MenuItem[][] = [
    [
      { key: "my-applications", label: t("more_sheet_my_applications"), icon: "document-text", color: "#007AFF", href: "/more/my-applications" },
      { key: "favorites", label: t("favorites"), icon: "heart", color: "#FF2D55", href: "/more/favorites" },
      { key: "chat", label: t("chat"), icon: "chatbubble", color: "#34C759", href: "/more/chat", badge: unreadChatCount },
    ],
    [
      { key: "services", label: t("more_sheet_catalog"), icon: "pricetags", color: "#FF9500", href: "/more/services" },
      { key: "masters-catalog", label: t("more_sheet_masters_catalog"), icon: "construct", color: "#5856D6", href: "/more/masters-catalog" },
      {
        key: "organizations-catalog",
        label: t("more_sheet_organizations_catalog"),
        icon: "business",
        color: "#30B0C7",
        href: "/more/organizations-catalog",
      },
    ],
    [
      { key: "dashboard", label: t("dashboard"), icon: "speedometer", color: "#5AC8FA", onlyFor: "worker", href: "/more/dashboard" },
      { key: "courses", label: t("more_sheet_my_courses"), icon: "school", color: "#AF52DE", onlyFor: "worker", href: "/more/courses" },
      {
        key: "master-onboarding",
        label: t("more_sheet_switch_to_master"),
        icon: "briefcase",
        color: "#34C759",
        onlyFor: "client",
        href: "/master-onboarding",
      },
      {
        key: "organization-onboarding",
        label: t("more_sheet_switch_to_organization"),
        icon: "business",
        color: "#30B0C7",
        onlyFor: "client",
        href: "/organization-onboarding",
      },
    ],
    [
      { key: "legal-help", label: t("more_sheet_legal_help"), icon: "shield-checkmark", color: "#8E8E93", href: "/more/legal-help" },
      { key: "blog", label: t("more_sheet_blog"), icon: "newspaper", color: "#FF3B30", href: "/more/blog" },
    ],
  ];
  const visibleGroups = groups
    .map((group) => group.filter((item) => !item.onlyFor || item.onlyFor === audience))
    .filter((group) => group.length > 0);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("more_sheet_title")} largeTitle collapsed={collapsed} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic" {...scrollProps}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32, gap: 20 }}
      >
        {visibleGroups.map((group, gi) => (
          <ListGroup key={gi}>
            {group.map((item, i) => (
              <ListRow
                key={item.key}
                icon={item.icon}
                color={item.color}
                label={item.label}
                badge={item.badge}
                onPress={() => router.push(item.href as never)}
                isLast={i === group.length - 1}
              />
            ))}
          </ListGroup>
        ))}
      </ScrollView>
    </View>
  );
}
