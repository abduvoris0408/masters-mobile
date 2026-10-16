import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/lib/theme/colors";
import { getChatUnreadTotal, useChatUnreadSummaryQuery } from "@/services/chat";

// System tab bar (UITabBarController on iOS — Liquid Glass on iOS 26 — and
// the Material tab bar on Android) instead of the old custom floating pill.
// Native tabs can't run an action on press, so "E'lon joylash" and "Ko'proq"
// are real tab screens now rather than buttons opening a screen/sheet.
// Android caps native tabs at 5.
export default function TabsLayout() {
  const { t, i18n } = useTranslation("common");
  const colors = useThemeColors();
  const { data: unreadSummary } = useChatUnreadSummaryQuery(true);
  const unreadChatCount = getChatUnreadTotal(unreadSummary);

  return (
    // minimizeBehavior "never": iOS 26 would otherwise shrink the bar down to
    // just the active tab while scrolling, which read as tabs disappearing.
    // key: the native tab bar keeps the item widths it measured for the old
    // labels when they change in place, so switching language left items
    // shifted/overlapping — rebuilding the bar per language re-measures them.
    <NativeTabs key={i18n.language} tintColor={colors.accent} minimizeBehavior="never">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{t("tab_home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(orders)">
        <NativeTabs.Trigger.Label>{t("tab_orders")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bag", selected: "bag.fill" }} md="shopping_bag" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(create)">
        <NativeTabs.Trigger.Label>{t("tab_create")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} md="add_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(menu)">
        <NativeTabs.Trigger.Label>{t("more_sheet_title")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} md="apps" />
        {/* Rendered only when there's something unread — `hidden` alone
            still showed a "0" badge on iOS. */}
        {unreadChatCount > 0 ? (
          <NativeTabs.Trigger.Badge>{unreadChatCount > 9 ? "9+" : String(unreadChatCount)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>{t("profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
