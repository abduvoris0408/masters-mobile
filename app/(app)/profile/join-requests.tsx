import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useAcceptJoinRequestMutation,
  useCancelJoinRequestMutation,
  useMyJoinRequestsQuery,
  useOrgJoinRequestsQuery,
  useRejectJoinRequestMutation,
} from "@/services/organization-join-request";
import type { IJoinRequest, TJoinRequestStatus } from "@/types";
import { formatDateTime, formatPhoneNumber } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";
import { showError, showSuccess } from "@/utils/toast";

const PAGE_SIZE = 10;

const STATUS_FILTER_KEYS: { value: string; labelKey: string }[] = [
  { value: "all", labelKey: "join_requests_status_all" },
  { value: "pending", labelKey: "join_requests_status_pending" },
  { value: "accepted", labelKey: "join_requests_status_accepted" },
  { value: "rejected", labelKey: "join_requests_status_rejected" },
  { value: "cancelled", labelKey: "join_requests_status_cancelled" },
];

const STATUS_LABEL_KEYS: Record<TJoinRequestStatus, string> = {
  pending: "join_requests_status_pending",
  accepted: "join_requests_status_accepted",
  rejected: "join_requests_status_rejected",
  cancelled: "join_requests_status_cancelled",
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

const profileName = (profile: IJoinRequest["profile"]) => {
  if (typeof profile === "string") return profile;
  const u = profile.user;
  return `${u.name ?? ""} ${u.surname ?? ""}`.trim() || formatPhoneNumber(u.phone);
};

const profilePhoto = (profile: IJoinRequest["profile"]) => (typeof profile === "string" ? null : profile.user.photo ?? null);

function JoinRequestCard({ item, isOrganization }: { item: IJoinRequest; isOrganization: boolean }) {
  // From the org owner's side, the counterpart card shows the *master* (who
  // asked to join, or who the org invited) instead of the organization
  // itself — and the accept/reject vs cancel action set flips accordingly:
  // an org owner accepts/rejects a master-initiated request, and cancels
  // their own org-initiated invite; a master does the opposite.
  const { t } = useTranslation("profile");
  const isIncomingInvite = isOrganization ? item.initiated_by === "master" : item.initiated_by === "organization";
  const isPending = item.status === "pending";

  const acceptMutation = useAcceptJoinRequestMutation();
  const rejectMutation = useRejectJoinRequestMutation();
  const cancelMutation = useCancelJoinRequestMutation();
  const busy = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(item.guid);
      showSuccess(t("join_requests_accepted"));
    } catch {
      showError(t("action_error"));
    }
  };

  const handleReject = () => {
    Alert.alert(t("join_requests_reject_title"), t("join_requests_reject_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("join_requests_reject_action"),
        style: "destructive",
        onPress: async () => {
          try {
            await rejectMutation.mutateAsync(item.guid);
            showSuccess(t("join_requests_rejected"));
          } catch {
            showError(t("action_error"));
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert(t("join_requests_cancel_title"), t("join_requests_cancel_message"), [
      { text: t("no"), style: "cancel" },
      {
        text: t("join_requests_cancel_action"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(item.guid);
            showSuccess(t("join_requests_cancelled"));
          } catch {
            showError(t("action_error"));
          }
        },
      },
    ]);
  };

  const tagLabel = isOrganization
    ? item.initiated_by === "master"
      ? t("join_requests_tag_from_master")
      : t("join_requests_tag_we_invited")
    : isIncomingInvite
      ? t("join_requests_tag_from_org")
      : t("join_requests_tag_i_sent");

  return (
    <Card className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip label={t(STATUS_LABEL_KEYS[item.status]) ?? item.status} tone={STATUS_TONE[item.status] ?? "neutral"} />
        <Chip label={tagLabel} tone={isIncomingInvite ? "info" : "neutral"} />
      </View>

      <View className="flex-row items-center gap-3">
        {isOrganization ? (
          <>
            <Avatar uri={profilePhoto(item.profile)} name={profileName(item.profile)} size={40} />
            <View className="flex-1">
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                {profileName(item.profile)}
              </Text>
              <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
            </View>
          </>
        ) : (
          <>
            <Avatar uri={organizationLogo(item.organization)} name={organizationName(item.organization)} size={40} />
            <View className="flex-1">
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                {organizationName(item.organization)}
              </Text>
              <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
            </View>
          </>
        )}
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
                  {t("join_requests_accept_action")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                disabled={busy}
                className="flex-1 items-center rounded-full bg-red-50 px-4 py-2.5 dark:bg-danger/15"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                <Text className="text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {t("join_requests_reject_action")}
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
                {t("join_requests_cancel_action")}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </Card>
  );
}

export default function ProfileJoinRequestsScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { isOrganization } = useProfilePerspective();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IJoinRequest[]>([]);
  const statusFilter = status === "all" ? undefined : status;
  const statusFilters = STATUS_FILTER_KEYS.map((f) => ({ value: f.value, label: t(f.labelKey) }));

  const myQuery = useMyJoinRequestsQuery(page, PAGE_SIZE, statusFilter, !isOrganization);
  const orgQuery = useOrgJoinRequestsQuery(page, PAGE_SIZE, statusFilter, isOrganization);
  const { data, isLoading, isFetching, isError, refetch } = isOrganization ? orgQuery : myQuery;

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
      <Header title={isOrganization ? t("join_requests_title_org") : t("join_requests_title_master")} onBackPress={() => router.back()} />

      <View className="pb-2" style={{ paddingTop: headerHeight }}>
        <FilterChips options={statusFilters} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title={t("load_error")}
          description={t("try_again")}
          actionLabel={t("retry")}
          onAction={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="send-outline"
          title={t("join_requests_empty_title")}
          description={
            isOrganization
              ? t("join_requests_empty_description_org")
              : t("join_requests_empty_description_master")
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-2"
          renderItem={({ item }) => <JoinRequestCard item={item} isOrganization={isOrganization} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}
    </View>
  );
}
