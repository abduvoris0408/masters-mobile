import type { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Chip, type ChipTone } from "@/components/ui/Chip";
import { IconBadge, type IconBadgeTone } from "@/components/ui/IconBadge";
import { PressableCard } from "@/components/ui/Card";

export interface ListingCardData {
  id: string;
  icon?: keyof typeof Ionicons.glyphMap;
  imageUri?: string | null;
  tone: IconBadgeTone;
  title: string;
  subtitleLines: string[];
  price: string;
  statusLabel: string;
  statusTone?: ChipTone;
}

interface ListingCardProps {
  item: ListingCardData;
  onPress?: () => void;
}

// One card = one listing row, composed from IconBadge + Chip + Card so the
// visual language stays defined in one place instead of per-screen styling.
export function ListingCard({ item, onPress }: ListingCardProps) {
  return (
    <PressableCard onPress={onPress} className="gap-3">
      <View className="flex-row gap-3">
        <IconBadge icon={item.icon} imageUri={item.imageUri} tone={item.tone} />
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">{item.title}</Text>
          {item.subtitleLines.map((line) => (
            <Text key={line} className="text-sm text-muted">
              {line}
            </Text>
          ))}
        </View>
      </View>
      <Text className="text-2xl font-extrabold tracking-tight text-foreground">{item.price}</Text>
      <Chip label={item.statusLabel} tone={item.statusTone} />
    </PressableCard>
  );
}
