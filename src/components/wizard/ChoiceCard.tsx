import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

interface ChoiceCardProps {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  style?: object;
}

// Shared "selectable option card" look used by the timing choice (shoshilinch
// vs scheduled) and payment-type steps of the create-application wizard —
// mirrors the web wizard's TimingChoiceCard/PaymentTypeOption active-border
// treatment (border/bg toggle on emerald when selected).
export function ChoiceCard({ active, icon, title, description, onPress, style }: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 gap-2 rounded-2xl border p-4 ${active ? "border-accent bg-emerald-50 dark:bg-accent/15" : "border-border bg-surface"}`}
      style={style}
    >
      <View>{icon}</View>
      <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
        {title}
      </Text>
      <Text className="text-xs leading-5 text-muted">{description}</Text>
    </Pressable>
  );
}
