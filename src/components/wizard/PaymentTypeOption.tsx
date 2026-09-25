import { Pressable, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { CardTitle, Caption } from "@/components/ui/Typography";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

interface PaymentTypeOptionProps {
  active: boolean;
  title: string;
  badge?: string;
  description: string;
  onPress: () => void;
}

// Radio-style selectable row for the budget step's payment_type choice
// (escrow vs direct) — mirrors the web wizard's PaymentTypeOption without the
// details popover (kept out for the RN skeleton pass).
export function PaymentTypeOption({ active, title, badge, description, onPress }: PaymentTypeOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-3 rounded-2xl border p-4 ${active ? "border-accent bg-emerald-50 dark:bg-accent/15" : "border-border bg-surface"}`}
    >
      <View
        className={`mt-0.5 h-[18px] w-[18px] rounded-full border-2 ${active ? "border-accent" : "border-border"}`}
        style={active ? { borderWidth: 5 } : undefined}
      />
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <CardTitle style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>{title}</CardTitle>
          {badge ? <Chip label={badge} tone="success" /> : null}
        </View>
        <Caption className="leading-5">{description}</Caption>
      </View>
    </Pressable>
  );
}
