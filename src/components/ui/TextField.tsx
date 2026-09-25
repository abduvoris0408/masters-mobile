import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  /** The field normally sits on bg-background (screens' base fill), so it
   *  fills bg-surface (white) to stand out. A field placed on top of an
   *  already-white card (e.g. login's form sheet) needs the opposite —
   *  bg-background — to still read as a distinct control instead of
   *  disappearing into the card's own white. */
  onSurface?: boolean;
}

export function TextField({ label, error, secureToggle, secureTextEntry, leadingIcon, onSurface, className, ...rest }: TextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const colors = useThemeColors();

  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <View className={`flex-row items-center rounded-2xl px-4 ${onSurface ? "bg-background" : "bg-surface"}`}>
        {leadingIcon ? <Ionicons name={leadingIcon} size={18} color={colors.muted} style={{ marginRight: 10 }} /> : null}
        <TextInput
          className="h-13 flex-1"
          style={{ height: 52, fontSize: 16, color: colors.foreground }}
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
