import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Header } from "@/components/ui/Header";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { extractChatGuid, extractChatId, useStartChatMutation } from "@/services/chat";
import {
  useCustomerCompleteOrderMutation,
  useMasterFinishOrderMutation,
  useMyMasterOrdersQuery,
  useMyOrdersQuery,
} from "@/services/application";
import type { IMasterOrder, TOrderStatus } from "@/types";
import { formatAddress, formatDate, formatPhoneNumber, formatPrice } from "@/utils/format";
import { ORDER_STATUS_LABEL } from "@/utils/orderStatus";
import { appendUniquePage } from "@/utils/pagination";
import { showError, showSuccess } from "@/utils/toast";

type OrdersView = "worker" | "client";

function useStatusFilters(t: (key: string) => string): { value: string; label: string }[] {
  return [
    { value: "all", label: t("orders_status_all") },
    { value: "new", label: ORDER_STATUS_LABEL.new },
    { value: "accepted", label: ORDER_STATUS_LABEL.accepted },
    { value: "in_progress", label: ORDER_STATUS_LABEL.in_progress },
    { value: "awaiting_confirmation", label: ORDER_STATUS_LABEL.awaiting_confirmation },
    { value: "completed", label: ORDER_STATUS_LABEL.completed },
    { value: "cancelled", label: ORDER_STATUS_LABEL.cancelled },
  ];
}

const STATUS_BADGE_STYLE: Record<TOrderStatus, { bg: string; text: string }> = {
  new: { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  accepted: { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  contract_signed: { bg: "bg-violet-50 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  in_progress: { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  awaiting_confirmation: { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  completed: { bg: "bg-emerald-50 dark:bg-accent/15", text: "text-emerald-600 dark:text-accent" },
  cancelled: { bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400" },
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: TOrderStatus }) {
  const style = STATUS_BADGE_STYLE[status] ?? STATUS_BADGE_STYLE.new;
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.bg}`}>
      <Text className={`text-xs ${style.text}`} style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
        {ORDER_STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}

interface OrderCardProps {
  order: IMasterOrder;
  /** Which side of the order the current user is on — decides whose contact
   *  card is shown (the other party) and which action button applies. */
  perspective: "client" | "worker";
  onMessage: (counterpartUserId: number) => void;
  onFinish?: (guid: string) => void;
  finishing?: boolean;
  onComplete?: (guid: string) => void;
  completing?: boolean;
}

function OrderCard({ order, perspective, onMessage, onFinish, finishing, onComplete, completing }: OrderCardProps) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const counterpart = perspective === "client" ? order.master : order.customer;
  const needsEscrowPayment = perspective === "client" && order.application?.payment_type === "escrow" && order.has_escrow === false;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
          #{order.order_number}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      {order.application?.title ? (
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }} numberOfLines={2}>
          {order.application.title}
        </Text>
      ) : null}

      <View className="flex-row items-center gap-2">
        <Avatar uri={counterpart?.photo} name={counterpart?.name} size={36} />
        <View className="flex-1">
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }} numberOfLines={1}>
            {counterpart?.name || (perspective === "client" ? t("orders_role_worker") : t("orders_role_client"))}
          </Text>
          {counterpart?.phone ? <Text className="text-xs text-muted">{formatPhoneNumber(counterpart.phone)}</Text> : null}
        </View>
        <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {formatPrice(Number(order.price))}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
          {formatAddress(order.address)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted">{formatDate(order.created_at)}</Text>

        <View className="flex-row items-center gap-3">
          {counterpart?.phone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${counterpart.phone}`)} hitSlop={8}>
              <Ionicons name="call-outline" size={18} color={colors.accent} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => onMessage(counterpart.id)} hitSlop={8}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {perspective === "worker" && order.status === "in_progress" && onFinish ? (
        <Button style={{ height: 44 }} loading={finishing} onPress={() => onFinish(order.guid)}>
          {t("orders_finish_work")}
        </Button>
      ) : null}

      {perspective === "client" && order.status === "awaiting_confirmation" && onComplete ? (
        <Button style={{ height: 44 }} loading={completing} onPress={() => onComplete(order.guid)}>
          {t("orders_accept_work")}
        </Button>
      ) : null}

      {needsEscrowPayment ? (
        <Button
          variant="outline"
          style={{ height: 44 }}
          onPress={() => order.application && router.push(`/applications/${order.application.guid}`)}
        >
          {t("orders_complete_payment")}
        </Button>
      ) : null}
    </Card>
  );
}

function OrdersList({ perspective }: { perspective: "client" | "worker" }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const STATUS_FILTERS = useStatusFilters(t);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IMasterOrder[]>([]);
  const startChatMutation = useStartChatMutation();
  const finishOrderMutation = useMasterFinishOrderMutation();
  const completeOrderMutation = useCustomerCompleteOrderMutation();
  const [finishingGuid, setFinishingGuid] = useState<string | null>(null);
  const [completingGuid, setCompletingGuid] = useState<string | null>(null);

  const clientQuery = useMyOrdersQuery(page, PAGE_SIZE, status === "all" ? undefined : status);
  const workerQuery = useMyMasterOrdersQuery(page, PAGE_SIZE, status === "all" ? undefined : status);
  const { data, isLoading, isFetching, isError, refetch } = perspective === "client" ? clientQuery : workerQuery;

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [status, perspective]);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  const handleMessage = async (counterpartUserId: number) => {
    try {
      const result = await startChatMutation.mutateAsync({ user: counterpartUserId });
      const chatGuid = extractChatGuid(result);
      const chatId = extractChatId(result);
      if (!chatGuid || !chatId) {
        showError(t("common_chat_open_error"));
        return;
      }
      router.push({ pathname: "/chat/[guid]", params: { guid: chatGuid, id: String(chatId) } });
    } catch {
      showError(t("common_chat_open_error"));
    }
  };

  const handleFinish = async (guid: string) => {
    setFinishingGuid(guid);
    try {
      await finishOrderMutation.mutateAsync(guid);
      showSuccess(t("orders_finish_success"));
    } catch {
      showError(t("orders_action_error"));
    } finally {
      setFinishingGuid(null);
    }
  };

  const handleComplete = async (guid: string) => {
    setCompletingGuid(guid);
    try {
      await completeOrderMutation.mutateAsync(guid);
      showSuccess(t("orders_complete_success"));
    } catch {
      showError(t("orders_action_error"));
    } finally {
      setCompletingGuid(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View className="pb-2 pt-3">
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : isError ? (
        <View style={{ flex: 1, marginTop: -44 }}>
          <EmptyState
            icon="alert-circle-outline"
            title={t("common_load_error_title")}
            description={t("common_retry_description")}
            actionLabel={t("common_retry_action")}
            onAction={() => refetch()}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, marginTop: -44 }}>
          <EmptyState
            icon="document-text-outline"
            title={
              status === "all"
                ? perspective === "worker"
                  ? t("orders_empty_worker_title")
                  : t("orders_empty_client_title")
                : t("orders_empty_status_title", { status: STATUS_FILTERS.find((f) => f.value === status)?.label ?? "" })
            }
            description={
              status === "all"
                ? perspective === "worker"
                  ? t("orders_empty_worker_description")
                  : t("orders_empty_client_description")
                : t("orders_empty_status_description")
            }
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 py-2"
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              perspective={perspective}
              onMessage={handleMessage}
              onFinish={perspective === "worker" ? handleFinish : undefined}
              finishing={finishingGuid === item.guid}
              onComplete={perspective === "client" ? handleComplete : undefined}
              completing={completingGuid === item.guid}
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={() => refetch()} />}
        />
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const { t } = useTranslation("catalog");
  const [view, setView] = useState<OrdersView>("client");
  const headerHeight = useHeaderHeight();

  return (
    <View className="flex-1 bg-background">
      <Header title={t("orders_title")} onBackPress={() => router.push("/")} />
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        <UnderlineTabs
          value={view}
          onChange={setView}
          options={[
            { value: "worker", label: t("orders_tab_worker") },
            { value: "client", label: t("orders_tab_client") },
          ]}
        />
        <OrdersList perspective={view} />
      </View>
    </View>
  );
}
