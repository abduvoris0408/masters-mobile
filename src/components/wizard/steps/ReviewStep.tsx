import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import type { IApplicationCategoryRef, IAddressItem } from "@/types";
import { formatPrice } from "@/utils/format";
import type { IPendingApplicationImage } from "../WizardStepImages";
import type { WizardState } from "../types";

interface ReviewStepProps {
  values: WizardState;
  matchedCategory: IApplicationCategoryRef | null;
  selectedBaseCategory?: { name: string };
  selectedCategory?: { name: string };
  selectedRegion?: IAddressItem;
  selectedDistrict?: IAddressItem;
  pendingImages: IPendingApplicationImage[];
  goToStep: (index: number) => void;
}

export function ReviewStep({
  values,
  matchedCategory,
  selectedBaseCategory,
  selectedCategory,
  selectedRegion,
  selectedDistrict,
  pendingImages,
  goToStep,
}: ReviewStepProps) {
  const { t } = useTranslation("orders");

  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      <ReviewRow icon="text-outline" label={t("field_title")} value={values.title || "—"} onEdit={() => goToStep(0)} />
      <ReviewRow
        icon="pricetags-outline"
        label={t("wizard_category_label")}
        value={
          matchedCategory?.name ??
          ([selectedBaseCategory?.name, selectedCategory?.name].filter(Boolean).join(" — ") || "—")
        }
        onEdit={() => goToStep(0)}
      />
      <ReviewRow icon="document-text-outline" label={t("field_description")} value={values.description || "—"} onEdit={() => goToStep(1)} />
      <ReviewRow
        icon="location-outline"
        label={t("field_address")}
        value={[selectedRegion?.name, selectedDistrict?.name, values.address].filter(Boolean).join(", ") || "—"}
        onEdit={() => goToStep(3)}
      />
      <ReviewRow
        icon="calendar-outline"
        label={t("wizard_step_timing_title")}
        value={
          values.is_urgent
            ? t("field_urgent")
            : values.date_from && values.date_to
              ? `${values.date_from} — ${values.date_to}`
              : t("deadline_negotiable")
        }
        onEdit={() => goToStep(4)}
      />
      <ReviewRow
        icon="wallet-outline"
        label={t("field_budget")}
        value={values.budget_from && values.budget_to ? `${formatPrice(Number(values.budget_from))} — ${formatPrice(Number(values.budget_to))}` : "—"}
        onEdit={() => goToStep(5)}
      />
      <ReviewRow
        icon="shield-checkmark-outline"
        label={t("field_payment_type")}
        value={values.payment_type === "direct" ? t("payment_direct_title") : t("payment_escrow_title")}
        onEdit={() => goToStep(5)}
      />
      <ReviewRow
        icon="image-outline"
        label={t("wizard_step_images_title")}
        value={pendingImages.length > 0 ? t("wizard_images_count", { count: pendingImages.length }) : t("wizard_no_images")}
        onEdit={() => goToStep(6)}
        last
      />
    </View>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  onEdit,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onEdit: () => void;
  last?: boolean;
}) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-start gap-3 bg-surface p-3.5 ${last ? "" : "border-b border-border"}`}>
      <Ionicons name={icon} size={16} color={colors.accent} style={{ marginTop: 2 }} />
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {value}
        </Text>
      </View>
      <Pressable onPress={onEdit}>
        <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
          {t("common_edit")}
        </Text>
      </Pressable>
    </View>
  );
}
