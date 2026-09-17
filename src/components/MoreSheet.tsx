import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { getChatUnreadTotal, useChatUnreadSummaryQuery } from "@/services/chat";
import { useAuthStore } from "@/stores";
import { EUserType } from "@/types";

interface MoreSheetItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
  /** Only shown for this user type — omit to show for everyone. */
  onlyFor?: EUserType;
  disabled?: boolean;
}

interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

// "Ko'proq" tab's destination per mobile-design.md's MobileTabBar spec — a
// bottom sheet listing every secondary destination (not a route itself), one
// row per link from the web project's MobileMoreSheet.tsx. Master/organization
// onboarding have no RN screen yet — they render disabled/"Tez orada" instead
// of being left out, so the full menu structure is visible up front.
export function MoreSheet({ visible, onClose }: MoreSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const isWorker = user?.user_type === EUserType.WORKER;
  const { data: unreadSummary } = useChatUnreadSummaryQuery(visible);
  const unreadChatCount = getChatUnreadTotal(unreadSummary);

  const allItems: MoreSheetItem[] = [
    { key: "my-applications", label: "Mening elonlarim", icon: "document-text-outline", href: "/more/my-applications" },
    { key: "services", label: "Katalog", icon: "pricetags-outline", href: "/more/services" },
    { key: "masters-catalog", label: "Ustalar katalogi", icon: "construct-outline", href: "/more/masters-catalog" },
    { key: "organizations-catalog", label: "Tashkilotlar katalogi", icon: "business-outline", href: "/more/organizations-catalog" },
    { key: "dashboard", label: "Dashboard", icon: "speedometer-outline", onlyFor: EUserType.WORKER, href: "/more/dashboard" },
    { key: "courses", label: "Kurslarim", icon: "school-outline", onlyFor: EUserType.WORKER, href: "/more/courses" },
    { key: "master-onboarding", label: "Ustaga o'tish", icon: "briefcase-outline", onlyFor: EUserType.CLIENT, disabled: true },
    {
      key: "organization-onboarding",
      label: "Tashkilotga o'tish",
      icon: "business-outline",
      onlyFor: EUserType.CLIENT,
      disabled: true,
    },
    { key: "chat", label: "Xabarlar", icon: "chatbubble-outline", href: "/more/chat" },
    { key: "legal-help", label: "Huquqiy yordam", icon: "shield-checkmark-outline", href: "/more/legal-help" },
    { key: "applications-create", label: "E'lon berish", icon: "add-circle-outline", href: "/applications/create" },
    { key: "blog", label: "Blog", icon: "newspaper-outline", href: "/more/blog" },
    { key: "settings", label: "Sozlamalar", icon: "settings-outline", href: "/more/settings" },
  ];
  const items = allItems.filter((item) => !item.onlyFor || (item.onlyFor === EUserType.WORKER ? isWorker : !isWorker));

  const go = (href?: string) => {
    if (!href) return;
    onClose();
    router.push(href as never);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="max-h-[75%] rounded-t-3xl bg-background" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="items-center py-3">
          <View className="h-1.5 w-10 rounded-full bg-border" />
        </View>
        <View className="flex-row items-center justify-between px-5 pb-3">
          <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            Ko'proq
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="close" size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="px-2 pb-2">
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => !item.disabled && go(item.href)}
              disabled={item.disabled}
              className={`flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5 ${item.disabled ? "opacity-40" : ""}`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface">
                <Ionicons name={item.icon} size={18} color={colors.foreground} />
              </View>
              <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                {item.label}
              </Text>
              {item.key === "chat" && unreadChatCount > 0 ? (
                <View className="mr-1 h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5">
                  <Text className="text-[11px] text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </Text>
                </View>
              ) : null}
              {item.disabled ? (
                <Text className="text-xs text-muted">Tez orada</Text>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
