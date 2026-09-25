import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View } from "react-native";

import { TextField } from "@/components/ui/TextField";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { formatDate } from "@/utils/format";

const DATE_FORMAT = "YYYY-MM-DD";

// @react-native-community/datetimepicker is a native module — it isn't
// bundled inside Expo Go, so a static top-level import throws at module
// load and takes the whole file down with it (surfaces as unrelated errors
// like "Property 'DatePickerField' doesn't exist"). Loaded lazily and
// guarded so Expo Go falls back to a plain text field below, while a
// dev-client/production build gets the real native picker.
type DateTimePickerModule = typeof import("@react-native-community/datetimepicker");
let dateTimePickerModule: DateTimePickerModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dateTimePickerModule = require("@react-native-community/datetimepicker");
} catch {
  dateTimePickerModule = null;
}

// Android shows its date dialog imperatively (no inline mode); iOS renders
// the wheel inline inside a dismissible sheet so the user sees the picker
// without leaving the field, matching PickerField's own dropdown pattern.
export function DatePickerField({
  label,
  value,
  minimumDate,
  onChange,
}: {
  label: string;
  value: string | null;
  minimumDate?: Date;
  onChange: (date: string) => void;
}) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const dateValue = value ? dayjs(value).toDate() : new Date();

  // No native module (Expo Go) — fall back to a plain YYYY-MM-DD text field
  // instead of crashing the whole wizard.
  if (!dateTimePickerModule) {
    return (
      <TextField
        label={`${label} (YYYY-MM-DD)`}
        placeholder={dayjs().format(DATE_FORMAT)}
        value={value ?? ""}
        onChangeText={(v) => onChange(v)}
      />
    );
  }

  const DateTimePicker = dateTimePickerModule.default;
  const { DateTimePickerAndroid } = dateTimePickerModule;

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: "date",
        minimumDate,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) onChange(dayjs(selected).format(DATE_FORMAT));
        },
      });
    } else {
      setIosPickerOpen((o) => !o);
    }
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
        {label}
      </Text>
      <Pressable
        onPress={open}
        className="h-13 flex-row items-center justify-between rounded-2xl bg-surface px-4"
        style={{ height: 52 }}
      >
        <Text className={value ? "text-base text-foreground" : "text-base text-muted"}>
          {value ? formatDate(value) : t("wizard_select_date")}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>

      {Platform.OS === "ios" && iosPickerOpen ? (
        <View className="overflow-hidden rounded-2xl bg-surface">
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            accentColor={colors.accent}
            onChange={(_, selected) => {
              if (selected) onChange(dayjs(selected).format(DATE_FORMAT));
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
