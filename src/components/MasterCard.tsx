import { Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";

export interface MasterCardData {
  id: string;
  name: string;
  photo?: string | null;
  category: string;
  rating: number | null;
  fromPrice: string;
}

interface MasterCardProps {
  item: MasterCardData;
  onPress?: () => void;
}

export function MasterCard({ item, onPress }: MasterCardProps) {
  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-3">
      <Avatar uri={item.photo} name={item.name} size={52} />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-foreground">{item.name}</Text>
        <Text className="text-sm text-muted">{item.category}</Text>
        <View className="mt-1 flex-row items-center gap-3">
          {item.rating != null ? <Rating value={item.rating} /> : null}
          <Text className="text-xs font-medium text-muted">{item.fromPrice}</Text>
        </View>
      </View>
    </PressableCard>
  );
}
