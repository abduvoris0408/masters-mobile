import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { TextField } from "@/components/ui/TextField";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { formatPrice } from "@/utils/format";
import { PaymentTypeOption } from "../PaymentTypeOption";
import type { SetWizardValue, WizardState } from "../types";

const BUDGET_PRESETS = [80_000, 150_000, 300_000, 600_000];

export function BudgetStep({
  values,
  set,
  errors,
}: {
  values: WizardState;
  set: SetWizardValue;
  errors: Partial<Record<keyof WizardState, string>>;
}) {
  const { t } = useTranslation("orders");

  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <TextField
          className="flex-1"
          label={t("field_budget_from")}
          placeholder="100 000"
          keyboardType="number-pad"
          value={values.budget_from}
          onChangeText={(v) => set("budget_from", v.replace(/[^0-9]/g, ""))}
          error={errors.budget_from}
        />
        <TextField
          className="flex-1"
          label={t("field_budget_to")}
          placeholder="200 000"
          keyboardType="number-pad"
          value={values.budget_to}
          onChangeText={(v) => set("budget_to", v.replace(/[^0-9]/g, ""))}
          error={errors.budget_to}
        />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {BUDGET_PRESETS.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => {
              set("budget_from", String(amount));
              set("budget_to", String(Math.round(amount * 1.5)));
            }}
            className="rounded-full bg-surface px-3.5 py-2"
          >
            <Text className="text-xs text-foreground">{formatPrice(amount)}</Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-2.5">
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
          {t("field_payment_type")}
        </Text>
        <PaymentTypeOption
          active={values.payment_type === "escrow"}
          title={t("payment_escrow_title")}
          badge={t("payment_recommended_badge")}
          description={t("wizard_payment_escrow_description")}
          onPress={() => set("payment_type", "escrow")}
        />
        <PaymentTypeOption
          active={values.payment_type === "direct"}
          title={t("payment_direct_title")}
          description={t("wizard_payment_direct_description")}
          onPress={() => set("payment_type", "direct")}
        />
      </View>
    </View>
  );
}
