import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
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
const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; direction: "in" | "out"; label: string }> = {
  top_up: { icon: "wallet-outline", direction: "in", label: "Balansni to'ldirish" },
  order_earning: { icon: "cash-outline", direction: "in", label: "Buyurtmadan tushum" },
  order_payment: { icon: "bag-handle-outline", direction: "out", label: "Buyurtma uchun to'lov" },
  withdrawal: { icon: "arrow-redo-outline", direction: "out", label: "Pul yechib olish" },
};

function TransactionRow({ item }: { item: IBalanceTransaction }) {
  const colors = useThemeColors();
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
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
          {meta.label}
        </Text>
        <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-sm" style={{ fontFamily: GOLOS_WEIGHTS.bold, color: isCredit ? colors.accent : colors.foreground }}>
          {isCredit ? "+" : "-"}
          {formatPrice(Math.abs(Number(item.amount)))}
        </Text>
        <Text className="text-[11px] text-muted">Balans: {formatPrice(Number(item.balance_after))}</Text>
      </View>
    </View>
  );
}

function DepositModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const depositMutation = useDepositBalanceMutation();

  useEffect(() => {
    if (visible) {
      setAmount("");
      setSucceeded(false);
    }
  }, [visible]);

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const canSubmit = numericAmount > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await depositMutation.mutateAsync(numericAmount);
      setSucceeded(true);
      showSuccess("Hisob to'ldirildi");
      setTimeout(onClose, 1200);
    } catch {
      showError("Hisobni to'ldirib bo'lmadi");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 16 }}>
        <Text className="mb-4 text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          Hisobni to'ldirish
        </Text>

        {succeeded ? (
          <View className="items-center gap-3 py-6">
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              Hisob to'ldirildi!
            </Text>
          </View>
        ) : (
          <>
            <TextField
              label="Summa"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="100 000"
            />
            <Button
              className="mt-5"
              loading={depositMutation.isPending}
              disabled={!canSubmit}
              onPress={handleSubmit}
            >
              To'ldirish
            </Button>
          </>
        )}
      </View>
    </Modal>
  );
}

export default function BalanceScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IBalanceTransaction[]>([]);
  const [depositVisible, setDepositVisible] = useState(false);

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
      <Header title="Hisobim" onBackPress={() => router.back()} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.guid}
        contentContainerClassName="gap-3 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <GradientCard>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-white/75">Joriy balans</Text>
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
                  Holat sanasi: {formatDateTime(balance.created_at)}
                </Text>
              ) : null}
            </GradientCard>

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setDepositVisible(true)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 dark:bg-accent/15"
              >
                <Ionicons name="arrow-down-circle-outline" size={18} color={colors.accent} />
                <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Pul kiritish
                </Text>
              </Pressable>
              <Pressable
                onPress={() => showError("Bu funksiya tez orada qo'shiladi")}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-surface py-3.5"
              >
                <Ionicons name="arrow-up-circle-outline" size={18} color={colors.muted} />
                <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Pul yechish
                </Text>
              </Pressable>
            </View>

            <Text className="px-1 text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
              Tranzaksiyalar tarixi
            </Text>
          </View>
        }
        renderItem={({ item }) => <TransactionRow item={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : isError ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Tarixni yuklab bo'lmadi"
              description="Qayta urinib ko'ring"
              actionLabel="Qayta urinish"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState icon="receipt-outline" title="Hozircha tranzaksiyalar yo'q" />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
        ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
        refreshControl={
          <RefreshControl refreshing={(isFetching && page === 1) || balanceFetching} onRefresh={handleRefresh} />
        }
      />

      <DepositModal visible={depositVisible} onClose={() => setDepositVisible(false)} />
    </View>
  );
}
