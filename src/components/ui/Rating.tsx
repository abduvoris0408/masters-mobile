import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface RatingProps {
  value: number;
  size?: number;
}

export function Rating({ value, size = 13 }: RatingProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="star" size={size} color="#D97706" />
      <Text className="text-xs font-medium text-amber-600" style={{ fontSize: size }}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}
