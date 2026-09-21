import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { getChatUnreadTotal, useChatUnreadSummaryQuery } from "@/services/chat";

// "worker" = any masterProfile holder (individual master or org owner),
// "client" = no masterProfile at all yet. Distinct from the finer-grained
// isOrganization/isIndividualMaster split below, which only "client"-tagged
// rows (the two onboarding links) need to further exclude org accounts from.
type TMoreSheetAudience = "worker" | "client";

interface MoreSheetItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
  /** Only shown for this audience — omit to show for everyone. */
  onlyFor?: TMoreSheetAudience;
  disabled?: boolean;
}

export interface MoreSheetHandle {
  present: () => void;
  dismiss: () => void;
}

// "Ko'proq" tab's destination per mobile-design.md's MobileTabBar spec — a
// bottom sheet listing every secondary destination (not a route itself), one
// row per link from the web project's MobileMoreSheet.tsx.
//
// Built on @gorhom/bottom-sheet (react-native-reanimated + gesture-handler)
// instead of a plain RN <Modal> — gives the platform's native-feel spring
// physics, drag-to-dismiss, and backdrop fade instead of a hand-rolled slide
// animation. Imperative present()/dismiss() via ref (gorhom's own pattern),
// so FloatingTabBar holds a ref instead of a visible/onClose boolean prop.
export const MoreSheet = forwardRef<MoreSheetHandle>(function MoreSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useThemeColors();
  const { t } = useTranslation("common");
  const { isWorker } = useProfilePerspective();
  const audience: TMoreSheetAudience = isWorker ? "worker" : "client";
  const { data: unreadSummary } = useChatUnreadSummaryQuery(true);
  const unreadChatCount = getChatUnreadTotal(unreadSummary);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const allItems: MoreSheetItem[] = [
    { key: "my-applications", label: t("more_sheet_my_applications"), icon: "document-text-outline", href: "/more/my-applications" },
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
    { key: "applications-create", label: t("more_sheet_post_listing"), icon: "add-circle-outline", href: "/applications/create" },
    { key: "blog", label: t("more_sheet_blog"), icon: "newspaper-outline", href: "/more/blog" },
  ];
  const items = allItems.filter((item) => !item.onlyFor || item.onlyFor === audience);

  const go = (href?: string) => {
    if (!href) return;
    sheetRef.current?.dismiss();
    router.push(href as never);
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["75%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text className="text-xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {t("more_sheet_title")}
        </Text>
        <Pressable
          onPress={() => sheetRef.current?.dismiss()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => !item.disabled && go(item.href)}
            disabled={item.disabled}
            className={`flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5 ${item.disabled ? "opacity-40" : ""}`}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
              <Ionicons name={item.icon} size={19} color={colors.foreground} />
            </View>
            <Text
              className="flex-1 text-base text-foreground"
              style={{ fontFamily: GOLOS_WEIGHTS.medium }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.key === "chat" && unreadChatCount > 0 ? (
              <View className="mr-1 h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5">
                <Text className="text-xs text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </Text>
              </View>
            ) : null}
            {item.disabled ? (
              <Text className="text-xs text-muted" numberOfLines={1}>
                {t("more_sheet_coming_soon")}
              </Text>
            ) : (
              <Ionicons name="chevron-forward" size={17} color={colors.muted} />
            )}
          </Pressable>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
