import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMarkNotificationReadMutation, useNotificationDetailQuery, useNotificationsQuery } from "@/services/notification";
import { ENotificationType, type INotification } from "@/types";
import { fromNow } from "@/utils/format";

const ADMIN_TYPES: string[] = [ENotificationType.ADMIN_BROADCAST, ENotificationType.ADMIN_DIRECT];

// Icon + color per notification type, mirroring the web project's
// NOTIF_TYPE_STYLE (src/pages/notifications/notifications.tsx) — a real
// notification center, not a wall of same-colored dots.
const NOTIF_TYPE_STYLE: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  new_application: { icon: "clipboard-outline", color: "#2563EB" },
  admin_broadcast: { icon: "megaphone-outline", color: "#9333EA" },
  admin_direct: { icon: "person-outline", color: "#F97316" },
  application_accepted: { icon: "checkmark-circle-outline", color: "#16A34A" },
  application_completed: { icon: "sparkles-outline", color: "#DB2777" },
  application_cancelled: { icon: "close-circle-outline", color: "#DC2626" },
  new_offer: { icon: "pricetag-outline", color: "#0891B2" },
  offer_accepted: { icon: "checkmark-circle-outline", color: "#0D9488" },
  review_new: { icon: "star-outline", color: "#EAB308" },
  payment_received: { icon: "wallet-outline", color: "#059669" },
};

const PAGE_SIZE = 20;

function NotificationRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-surface px-3.5 py-3">
      <Skeleton width={40} height={40} radius={20} />
      <View className="flex-1 gap-1.5">
        <Skeleton width="30%" height={11} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();

  const FILTERS: { key: string; label: string }[] = [
    { key: "all", label: t("common_all") },
    { key: ENotificationType.NEW_APPLICATION, label: t("notifications_filter_new_applications") },
    { key: ENotificationType.ADMIN_BROADCAST, label: t("notifications_filter_announcements") },
    { key: ENotificationType.ADMIN_DIRECT, label: t("notifications_filter_direct_messages") },
  ];
  const [typeFilter, setTypeFilter] = useState("all");
  const [detailGuid, setDetailGuid] = useState<string | null>(null);
  const { data, isLoading, isFetching, refetch } = useNotificationsQuery(
    1,
    PAGE_SIZE,
    typeFilter === "all" ? undefined : typeFilter,
  );
  const markReadMutation = useMarkNotificationReadMutation();
  const notifications = data?.results ?? [];

  const handleOpen = (notif: INotification) => {
    const isAdmin = ADMIN_TYPES.includes(notif.type);
    if (isAdmin) {
      if (!notif.is_read) markReadMutation.mutate(notif.id);
      setDetailGuid(notif.guid);
    } else if (notif.application) {
      if (!notif.is_read) markReadMutation.mutate(notif.id);
      router.push(`/listing/${notif.application.guid}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("notifications_header")} onBackPress={() => router.back()} hideRight />

      <View className="pb-2" style={{ paddingTop: headerHeight }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerClassName="gap-2 px-4"
          renderItem={({ item: f }) => {
            const active = typeFilter === f.key;
            return (
              <Pressable
                onPress={() => setTypeFilter(f.key)}
                className={`rounded-full px-4 py-2 ${active ? "bg-accent" : "bg-surface"}`}
              >
                <Text
                  className={`text-[13px] ${active ? "text-white" : "text-foreground"}`}
                  style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View className="gap-2.5 px-4 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationRowSkeleton key={i} />
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={t("notifications_empty_title")}
          description={t("notifications_empty_description")}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.guid}
          contentContainerClassName="gap-2.5 px-4 py-2"
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          renderItem={({ item: notif }) => {
            const style = NOTIF_TYPE_STYLE[notif.type] ?? { icon: "notifications-outline" as const, color: colors.muted };
            const isAdmin = ADMIN_TYPES.includes(notif.type);
            const canOpen = isAdmin || !!notif.application;
            const label =
              notif.category?.name ??
              (isAdmin ? (notif.type === ENotificationType.ADMIN_DIRECT ? t("notifications_direct_message_label") : t("notifications_announcement_label")) : null);

            // One row: type icon | meta line + title | "mark read" button, all
            // vertically centered so the icon lines up with the text block.
            return (
              <Pressable
                onPress={() => canOpen && handleOpen(notif)}
                className="flex-row items-center gap-3 rounded-2xl bg-surface px-3.5 py-3"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${style.color}1F` }}
                >
                  <Ionicons name={style.icon} size={18} color={style.color} />
                </View>

                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-1.5">
                    {label ? (
                      <Text className="shrink text-[11px] text-muted" numberOfLines={1}>
                        {label}
                      </Text>
                    ) : null}
                    {label ? <Text className="text-[11px] text-muted">·</Text> : null}
                    <Text className="text-[11px] text-muted" numberOfLines={1}>
                      {fromNow(notif.created_at)}
                    </Text>
                    {!notif.is_read ? <View className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                  </View>
                  <Text
                    className="text-sm leading-[19px] text-foreground"
                    style={{ fontFamily: notif.is_read ? GOLOS_WEIGHTS.regular : GOLOS_WEIGHTS.medium }}
                    numberOfLines={2}
                  >
                    {notif.title}
                  </Text>
                </View>

                {!notif.is_read ? (
                  <Pressable
                    onPress={() => markReadMutation.mutate(notif.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t("notifications_mark_as_read")}
                    className="h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-accent/15"
                  >
                    <Ionicons name="checkmark-done" size={16} color={colors.accent} />
                  </Pressable>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      <NotificationDetailModal guid={detailGuid} onClose={() => setDetailGuid(null)} />
    </View>
  );
}

function NotificationDetailModal({ guid, onClose }: { guid: string | null; onClose: () => void }) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const { data, isLoading } = useNotificationDetailQuery(guid);

  return (
    <Modal visible={!!guid} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable className="w-full max-w-sm gap-3 rounded-3xl bg-surface p-5" onPress={(e) => e.stopPropagation()}>
          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : data ? (
            <>
              <SectionTitle>{data.title}</SectionTitle>
              <Text className="text-sm leading-6 text-muted">{data.body}</Text>
            </>
          ) : null}
          <Pressable onPress={onClose} className="mt-2 items-center rounded-full bg-accent py-3">
            <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              {t("common_close")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
