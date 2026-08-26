import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface FilterFabProps {
  label?: string;
  onPress?: () => void;
}

// Floating pill button anchored above the bottom edge of a list — the
// "🎚 Фильтр" pattern from the reference feed screen. Wrapped in a
// full-width absolute row so the (variable-width, e.g. "Filtr (2)") pill
// stays centered without hand-computing its width.
export function FilterFab({ label = "Filtr", onPress }: FilterFabProps) {
  return (
    <View className="absolute bottom-5 left-0 right-0 items-center" pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        className="h-12 flex-row items-center gap-2 rounded-full bg-primary px-5"
      >
        <Ionicons name="options-outline" size={16} color="#FFFFFF" />
        <Text className="text-sm font-semibold text-white">{label}</Text>
      </Pressable>
    </View>
  );
}
