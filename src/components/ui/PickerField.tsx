import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

// Native action sheet instead of a hand-rolled dropdown: iOS gets a real
// UIAlertController (.actionSheet style, Swift/UIKit), Android a Material
// bottom sheet — both via @expo/react-native-action-sheet's useActionSheet,
// which picks the right native primitive per platform instead of this app
// drawing its own absolutely-positioned option list. Shared between the
// create-listing wizard and the master/organization onboarding screens.
export function PickerField({
  label,
  placeholder,
  value,
  options,
  onSelect,
  loading,
  disabled,
  error,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const colors = useThemeColors();
  const { showActionSheetWithOptions } = useActionSheet();
  const { t } = useTranslation("common");

  const open = () => {
    if (disabled || loading || options.length === 0) return;
    const labels = [...options.map((o) => o.label), t("cancel")];
    const cancelButtonIndex = labels.length - 1;
    showActionSheetWithOptions({ options: labels, cancelButtonIndex, title: label }, (selectedIndex) => {
      if (selectedIndex == null || selectedIndex === cancelButtonIndex) return;
      onSelect(options[selectedIndex].value);
    });
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
        {label}
      </Text>
      <Pressable
        onPress={open}
        className={`flex-row items-center justify-between rounded-2xl bg-surface px-4 ${disabled ? "opacity-50" : ""}`}
        style={{ height: 52 }}
      >
        <Text className={value ? "text-base text-foreground" : "text-base text-muted"} numberOfLines={1}>
          {loading ? t("loading") : value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
