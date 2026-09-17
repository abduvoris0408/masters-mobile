import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { PaymentTypeOption } from "@/components/wizard/PaymentTypeOption";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useApplicationDetailQuery, useUpdateApplicationMutation } from "@/services/application";
import type { TPaymentType } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

export default function EditApplicationScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useApplicationDetailQuery(guid ?? null);
  const updateMutation = useUpdateApplicationMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [paymentType, setPaymentType] = useState<TPaymentType>("direct");

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setDescription(data.description);
    setAddress(data.address ?? "");
    setBudgetFrom(String(data.budget_from));
    setBudgetTo(String(data.budget_to));
    setIsUrgent(data.is_urgent);
    setPaymentType(data.payment_type ?? "direct");
  }, [data]);

  const handleSave = async () => {
    if (!guid) return;
    if (!title.trim()) {
      showError("Sarlavhani kiriting");
      return;
    }
    const from = Number(budgetFrom.replace(/\D/g, ""));
    const to = Number(budgetTo.replace(/\D/g, ""));
    if (!from || !to || to < from) {
      showError("Byudjetni to'g'ri kiriting");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        guid,
        data: {
          title: title.trim(),
          description: description.trim(),
          address: address.trim(),
          budget_from: from,
          budget_to: to,
          is_urgent: isUrgent,
          payment_type: paymentType,
        },
      });
      showSuccess("Elon yangilandi");
      router.back();
    } catch {
      showError("Elonni saqlashda xatolik yuz berdi");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Elonni tahrirlash" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Elon topilmadi" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10" contentContainerStyle={{ paddingTop: headerHeight + 12 }}>
          <TextField label="Sarlavha" value={title} onChangeText={setTitle} placeholder="Ish nomi" />
          <TextField
            label="Tavsif"
            value={description}
            onChangeText={setDescription}
            placeholder="Ish haqida batafsil"
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top", paddingTop: 12 }}
          />
          <TextField label="Manzil" value={address} onChangeText={setAddress} placeholder="Manzilingiz" />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField label="Byudjet (dan)" value={budgetFrom} onChangeText={setBudgetFrom} keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <TextField label="Byudjet (gacha)" value={budgetTo} onChangeText={setBudgetTo} keyboardType="number-pad" />
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
            <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              Shoshilinch
            </Text>
            <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ true: colors.accent }} />
          </View>

          <View className="gap-2">
            <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              To'lov turi
            </Text>
            <PaymentTypeOption
              active={paymentType === "direct"}
              title="To'g'ridan-to'g'ri"
              description="Ish yakunlangach, to'g'ridan-to'g'ri mutaxassisga to'lov qilinadi."
              onPress={() => setPaymentType("direct")}
            />
            <PaymentTypeOption
              active={paymentType === "escrow"}
              title="Xavfsiz bitim (escrow)"
              badge="Tavsiya etiladi"
              description="To'lov tizim orqali ushlab turiladi va ish tasdiqlangach mutaxassisga o'tkaziladi."
              onPress={() => setPaymentType("escrow")}
            />
          </View>

          <Button loading={updateMutation.isPending} onPress={handleSave}>
            Saqlash
          </Button>
        </ScrollView>
      )}
    </View>
  );
}
