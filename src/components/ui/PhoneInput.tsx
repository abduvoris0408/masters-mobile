import { Text, TextInput, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

// Same 2-3-2-2 grouping mask as the web project's components/shared/PhoneInput.
function maskDigits(digits: string): string {
  const d = digits.slice(0, 9);
  let out = d.slice(0, 2);
  if (d.length > 2) out += " " + d.slice(2, 5);
  if (d.length > 5) out += " " + d.slice(5, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  return out;
}

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export function PhoneInput({ value = "", onChange, label }: PhoneInputProps) {
  const colors = useThemeColors();
  const localDigits = value.replace(/^\+998/, "").replace(/\D/g, "");
  const displayValue = maskDigits(localDigits);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 9);
    onChange("+998" + digits);
  };

  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <View className="flex-row items-center rounded-2xl bg-surface px-4">
        <Text className="mr-2 text-muted" style={{ fontSize: 16 }}>
          +998
        </Text>
        <TextInput
          className="flex-1"
          style={{ height: 52, fontSize: 16, color: colors.foreground }}
          value={displayValue}
          onChangeText={handleChange}
          placeholder="90 123 45 67"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={12}
        />
      </View>
    </View>
  );
}
