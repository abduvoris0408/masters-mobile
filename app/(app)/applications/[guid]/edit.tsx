import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { CardTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { PaymentTypeOption } from "@/components/wizard/PaymentTypeOption";
import { useThemeColors } from "@/lib/theme/colors";
import { useApplicationDetailQuery, useUpdateApplicationMutation } from "@/services/application";
import type { TPaymentType } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

export default function EditApplicationScreen() {
  const { t } = useTranslation("orders");
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
      showError(t("edit_application_title_required"));
      return;
    }
    const from = Number(budgetFrom.replace(/\D/g, ""));
    const to = Number(budgetTo.replace(/\D/g, ""));
    if (!from || !to || to < from) {
      showError(t("edit_application_budget_invalid"));
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
      showSuccess(t("edit_application_success"));
      router.back();
    } catch {
      showError(t("edit_application_error"));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("edit_application_header")} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title={t("application_not_found")} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10" contentContainerStyle={{ paddingTop: headerHeight + 12 }}>
          <TextField label={t("field_title")} value={title} onChangeText={setTitle} placeholder={t("field_title_placeholder")} />
          <TextField
            label={t("field_description")}
            value={description}
            onChangeText={setDescription}
            placeholder={t("field_description_placeholder")}
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top", paddingTop: 12 }}
          />
          <TextField label={t("field_address")} value={address} onChangeText={setAddress} placeholder={t("field_address_placeholder")} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField label={t("field_budget_from")} value={budgetFrom} onChangeText={setBudgetFrom} keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <TextField label={t("field_budget_to")} value={budgetTo} onChangeText={setBudgetTo} keyboardType="number-pad" />
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
            <CardTitle>{t("field_urgent")}</CardTitle>
            <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ true: colors.accent }} />
          </View>

          <View className="gap-2">
            <CardTitle>{t("field_payment_type")}</CardTitle>
            <PaymentTypeOption
              active={paymentType === "direct"}
              title={t("payment_direct_title")}
              description={t("payment_direct_description")}
              onPress={() => setPaymentType("direct")}
            />
            <PaymentTypeOption
              active={paymentType === "escrow"}
              title={t("payment_escrow_title")}
              badge={t("payment_recommended_badge")}
              description={t("payment_escrow_description")}
              onPress={() => setPaymentType("escrow")}
            />
          </View>

          <Button loading={updateMutation.isPending} onPress={handleSave}>
            {t("common_save")}
          </Button>
        </ScrollView>
      )}
    </View>
  );
}
