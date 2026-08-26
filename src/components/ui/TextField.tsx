import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export function TextField({ label, error, secureToggle, secureTextEntry, className, ...rest }: TextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const colors = useThemeColors();

  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <View className="flex-row items-center rounded-2xl bg-surface px-4">
        <TextInput
          className={`h-13 flex-1 text-base text-foreground ${className ?? ""}`}
          style={{ height: 52 }}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureToggle ? !reveal : secureTextEntry}
          {...rest}
        />
        {secureToggle ? (
          <Pressable onPress={() => setReveal((r) => !r)} hitSlop={8}>
            <Ionicons name={reveal ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
