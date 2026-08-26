import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

interface SearchBarProps extends TextInputProps {
  /** Right-side icon slot (e.g. a map toggle). */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function SearchBar({ rightIcon, onRightIconPress, ...rest }: SearchBarProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-2">
      <View className="h-12 flex-1 flex-row items-center rounded-full bg-surface px-4">
        <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base text-foreground"
          placeholderTextColor={colors.muted}
          {...rest}
        />
      </View>
      {rightIcon ? (
        <Pressable onPress={onRightIconPress} className="h-12 w-12 items-center justify-center rounded-full bg-surface">
          <Ionicons name={rightIcon} size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
