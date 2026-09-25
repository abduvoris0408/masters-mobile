import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { ChoiceCard } from "../ChoiceCard";
import type { SetWizardValue, WizardState } from "../types";
import { DatePickerField } from "./DatePickerField";

const DATE_FORMAT = "YYYY-MM-DD";

export function TimingStep({ values, set }: { values: WizardState; set: SetWizardValue }) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <ChoiceCard
          active={values.is_urgent === true}
          icon={<Ionicons name="flash" size={18} color={colors.accent} />}
          title={t("field_urgent")}
          description={t("wizard_urgent_description")}
          onPress={() => {
            set("is_urgent", true);
            set("date_from", null);
            set("date_to", null);
          }}
        />
        <ChoiceCard
          active={values.is_urgent === false}
          icon={<Ionicons name="calendar-outline" size={18} color={colors.accent} />}
          title={t("wizard_scheduled_title")}
          description={t("wizard_scheduled_description")}
          onPress={() => set("is_urgent", false)}
        />
      </View>

      {values.is_urgent === false ? (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => {
                const today = dayjs().format(DATE_FORMAT);
                set("date_from", today);
                set("date_to", today);
              }}
              className="rounded-full bg-surface px-3.5 py-2"
            >
              <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("wizard_date_today")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const tomorrow = dayjs().add(1, "day").format(DATE_FORMAT);
                set("date_from", tomorrow);
                set("date_to", tomorrow);
              }}
              className="rounded-full bg-surface px-3.5 py-2"
            >
              <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("wizard_date_tomorrow")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                set("date_from", dayjs().format(DATE_FORMAT));
                set("date_to", dayjs().add(6, "day").format(DATE_FORMAT));
              }}
              className="rounded-full bg-surface px-3.5 py-2"
            >
              <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("wizard_date_this_week")}
              </Text>
            </Pressable>
          </View>

          <DatePickerField
            label={t("wizard_date_from_label")}
            value={values.date_from}
            minimumDate={new Date()}
            onChange={(date) => set("date_from", date)}
          />
          <DatePickerField
            label={t("wizard_date_to_label")}
            value={values.date_to}
            minimumDate={values.date_from ? dayjs(values.date_from).toDate() : new Date()}
            onChange={(date) => set("date_to", date)}
          />
        </View>
      ) : null}
    </View>
  );
}
