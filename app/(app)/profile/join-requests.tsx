import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useAcceptJoinRequestMutation,
  useCancelJoinRequestMutation,
  useMyJoinRequestsQuery,
  useRejectJoinRequestMutation,
} from "@/services/organization-join-request";
import type { IJoinRequest, TJoinRequestStatus } from "@/types";
import { formatDateTime } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";
import { showError, showSuccess } from "@/utils/toast";

const PAGE_SIZE = 10;

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "accepted", label: "Qabul qilingan" },
  { value: "rejected", label: "Rad etilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

const STATUS_LABEL: Record<TJoinRequestStatus, string> = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilingan",
  rejected: "Rad etilgan",
  cancelled: "Bekor qilingan",
};

const STATUS_TONE: Record<TJoinRequestStatus, ChipTone> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const organizationName = (organization: IJoinRequest["organization"]) =>
  typeof organization === "string" ? organization : organization.name;

const organizationLogo = (organization: IJoinRequest["organization"]) =>
  typeof organization === "string" ? null : organization.logo;

function JoinRequestCard({ item }: { item: IJoinRequest }) {
  const isIncomingInvite = item.initiated_by === "organization";
  const isPending = item.status === "pending";

  const acceptMutation = useAcceptJoinRequestMutation();
  const rejectMutation = useRejectJoinRequestMutation();
  const cancelMutation = useCancelJoinRequestMutation();
  const busy = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(item.guid);
      showSuccess("So'rov qabul qilindi");
    } catch {
      showError("Amalni bajarishda xatolik yuz berdi");
    }
  };

  const handleReject = () => {
    Alert.alert("So'rovni rad etish", "Ushbu taklifni rad etishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Rad etish",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectMutation.mutateAsync(item.guid);
            showSuccess("So'rov rad etildi");
          } catch {
            showError("Amalni bajarishda xatolik yuz berdi");
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert("So'rovni bekor qilish", "Ushbu so'rovni bekor qilishni tasdiqlaysizmi?", [
      { text: "Yo'q", style: "cancel" },
      {
        text: "Bekor qilish",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(item.guid);
            showSuccess("So'rov bekor qilindi");
          } catch {
            showError("Amalni bajarishda xatolik yuz berdi");
          }
        },
      },
    ]);
  };

  return (
    <Card className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip label={STATUS_LABEL[item.status] ?? item.status} tone={STATUS_TONE[item.status] ?? "neutral"} />
        <Chip label={isIncomingInvite ? "Tashkilotdan taklif" : "Men yubordim"} tone={isIncomingInvite ? "info" : "neutral"} />
      </View>

      <View className="flex-row items-center gap-3">
        <Avatar uri={organizationLogo(item.organization)} name={organizationName(item.organization)} size={40} />
        <View className="flex-1">
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
            {organizationName(item.organization)}
          </Text>
          <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
        </View>
      </View>

      {item.message ? <Text className="text-sm text-muted">{item.message}</Text> : null}

      {isPending ? (
        <View className="flex-row items-center gap-2">
          {isIncomingInvite ? (
            <>
              <Pressable
                onPress={handleAccept}
                disabled={busy}
                className="flex-1 items-center rounded-full bg-accent px-4 py-2.5"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  Qabul qilish
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                disabled={busy}
                className="flex-1 items-center rounded-full bg-red-50 px-4 py-2.5 dark:bg-danger/15"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                <Text className="text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  Rad etish
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleCancel}
              disabled={busy}
              className="flex-1 items-center rounded-full bg-background px-4 py-2.5"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                Bekor qilish
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </Card>
  );
}

export default function ProfileJoinRequestsScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IJoinRequest[]>([]);

  const { data, isLoading, isFetching, isError, refetch } = useMyJoinRequestsQuery(
    page,
    PAGE_SIZE,
    status === "all" ? undefined : status,
  );

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [status]);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  return (
    <View className="flex-1 bg-background">
      <Header title="Tashkilotga so'rovlarim" onBackPress={() => router.back()} />

      <View className="pb-2" style={{ paddingTop: headerHeight }}>
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Yuklashda xatolik"
          description="Qayta urinib ko'ring"
          actionLabel="Qayta urinish"
          onAction={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState icon="send-outline" title="So'rovlar yo'q" description="Tashkilotga qo'shilish so'rovlari shu yerda ko'rinadi" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-2"
          renderItem={({ item }) => <JoinRequestCard item={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}
    </View>
  );
}
