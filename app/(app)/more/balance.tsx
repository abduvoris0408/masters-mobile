import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { CardTitle, Caption, ScreenTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useBalanceQuery, useBalanceTransactionsQuery, useDepositBalanceMutation } from "@/services/payments";
import type { IBalanceTransaction } from "@/types";
import { formatDateTime, formatPrice } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";
import { showError, showSuccess } from "@/utils/toast";

const PAGE_SIZE = 20;

// Mirrors the web project's four backend-defined transaction types
// (payments.BalanceTransaction.Type) — each with its own icon/color so
// in/out money reads at a glance in the list.
function TransactionRow({ item }: { item: IBalanceTransaction }) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; direction: "in" | "out"; label: string }> = {
    top_up: { icon: "wallet-outline", direction: "in", label: t("balance_type_top_up") },
    order_earning: { icon: "cash-outline", direction: "in", label: t("balance_type_order_earning") },
    order_payment: { icon: "bag-handle-outline", direction: "out", label: t("balance_type_order_payment") },
    withdrawal: { icon: "arrow-redo-outline", direction: "out", label: t("balance_type_withdrawal") },
  };
  const meta = TYPE_META[item.type] ?? { icon: "wallet-outline", direction: "in" as const, label: item.type };
  const isCredit = meta.direction === "in";

  return (
    <View className="flex-row items-center gap-3 rounded-3xl bg-surface p-4">
      <View
        className={`h-10 w-10 items-center justify-center rounded-2xl ${isCredit ? "bg-emerald-50 dark:bg-accent/15" : "bg-amber-50 dark:bg-amber-500/15"}`}
      >
        <Ionicons name={meta.icon} size={18} color={isCredit ? colors.accent : "#D97706"} />
      </View>
      <View className="flex-1 gap-0.5">
        <CardTitle>{meta.label}</CardTitle>
        <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-sm" style={{ fontFamily: GOLOS_WEIGHTS.bold, color: isCredit ? colors.accent : colors.foreground }}>
          {isCredit ? "+" : "-"}
          {formatPrice(Math.abs(Number(item.amount)))}
        </Text>
        <Text className="text-[11px] text-muted">{t("balance_after_label", { amount: formatPrice(Number(item.balance_after)) })}</Text>
      </View>
    </View>
  );
}

interface DepositModalHandle {
  present: () => void;
}

const DepositModal = forwardRef<DepositModalHandle>(function DepositModal(_props, ref) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [amount, setAmount] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const depositMutation = useDepositBalanceMutation();

  useImperativeHandle(ref, () => ({
    present: () => {
      setAmount("");
      setSucceeded(false);
      sheetRef.current?.present();
    },
  }));

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const canSubmit = numericAmount > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await depositMutation.mutateAsync(numericAmount);
      setSucceeded(true);
      showSuccess(t("balance_deposit_success"));
      setTimeout(() => sheetRef.current?.dismiss(), 1200);
    } catch {
      showError(t("balance_deposit_error"));
    }
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
      snapPoints={["40%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetView style={{ padding: 20 }}>
        <ScreenTitle className="mb-4">{t("balance_topup_title")}</ScreenTitle>

        {succeeded ? (
          <View className="items-center gap-3 py-6">
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              {t("balance_topup_success")}
            </Text>
          </View>
        ) : (
          <>
            <TextField
              label={t("balance_amount_label")}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder={t("balance_amount_placeholder")}
            />
            <Button className="mt-5" loading={depositMutation.isPending} disabled={!canSubmit} onPress={handleSubmit}>
              {t("balance_topup_button")}
            </Button>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default function BalanceScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IBalanceTransaction[]>([]);
  const depositSheetRef = useRef<DepositModalHandle>(null);

  const { data: balance, isLoading: balanceLoading, isFetching: balanceFetching, refetch: refetchBalance } = useBalanceQuery();
  const { data, isLoading, isFetching, isError, refetch } = useBalanceTransactionsQuery(page, PAGE_SIZE);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, page]);

  const hasMore = !!data?.next;

  const handleRefresh = () => {
    setPage(1);
    refetchBalance();
    refetch();
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("balance_header")} onBackPress={() => router.back()} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.guid}
        contentContainerClassName="gap-3 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <GradientCard>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-white/75">{t("balance_current_label")}</Text>
                <Pressable onPress={() => refetchBalance()} hitSlop={8}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              {balanceLoading ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginTop: 10, alignSelf: "flex-start" }} />
              ) : (
                <Text className="mt-1 text-3xl text-white" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
                  {formatPrice(Number(balance?.amount ?? 0))}
                </Text>
              )}
              {balance?.created_at ? (
                <Text className="mt-1 text-xs text-white/60">
                  {t("balance_status_date", { date: formatDateTime(balance.created_at) })}
                </Text>
              ) : null}
            </GradientCard>

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => depositSheetRef.current?.present()}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 dark:bg-accent/15"
              >
                <Ionicons name="arrow-down-circle-outline" size={18} color={colors.accent} />
                <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {t("balance_deposit_label")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => showError(t("balance_withdraw_coming_soon"))}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-surface py-3.5"
              >
                <Ionicons name="arrow-up-circle-outline" size={18} color={colors.muted} />
                <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {t("balance_withdraw_label")}
                </Text>
              </Pressable>
            </View>

            <Caption className="px-1 text-sm">{t("balance_transaction_history_title")}</Caption>
          </View>
        }
        renderItem={({ item }) => <TransactionRow item={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : isError ? (
            <EmptyState
              icon="alert-circle-outline"
              title={t("balance_history_load_error")}
              description={t("common_try_again_description")}
              actionLabel={t("common_try_again")}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState icon="receipt-outline" title={t("balance_no_transactions")} />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
        ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
        refreshControl={
          <RefreshControl refreshing={(isFetching && page === 1) || balanceFetching} onRefresh={handleRefresh} />
        }
      />

      <DepositModal ref={depositSheetRef} />
    </View>
  );
}
