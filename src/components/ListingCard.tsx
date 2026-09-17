import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import type { TPaymentType } from "@/types";

export interface ListingCardData {
  id: string;
  categoryLabel: string;
  title: string;
  description?: string;
  address: string;
  isUrgent: boolean;
  deadlineLabel: string;
  price: string;
  paymentType?: TPaymentType;
  offersCount: number;
  postedAtLabel: string;
  offerAvatarUri?: string | null;
}

interface ListingCardProps {
  item: ListingCardData;
  onPress?: () => void;
  onOfferPress?: () => void;
  /** "offer" (default) shows the worker-facing "Taklif yuborish" CTA; "manage"
   *  shows "Takliflarni ko'rish" for the owner's own "Mening elonlarim" list. */
  ctaVariant?: "offer" | "manage";
  /** "list" (default) is the full card from the reference screens — every
   *  field, a full-width CTA. "grid" is a compact 2-column tile: title,
   *  price and offer count only, no description/deadline/CTA — those don't
   *  fit two-per-row without wrapping into an unreadable wall of text, so
   *  grid mode trims to what still reads at a glance and taps through to
   *  the same detail screen for the rest. */
  variant?: "list" | "grid";
}

const PAYMENT_LABEL: Record<TPaymentType, string> = {
  direct: "To'g'ridan-to'g'ri",
  escrow: "Xavfsiz to'lov",
};

// One card = one listing row from the "Elonlar" feed screenshot: category
// tag + urgent badge up top, title/description, location + deadline rows,
// a budget row with the payment-type badge, then an offers footer and a
// full-width CTA. Urgent listings get a red left accent border, matching the
// reference screens' red-outlined card treatment.
export function ListingCard({ item, onPress, onOfferPress, ctaVariant = "offer", variant = "list" }: ListingCardProps) {
  const colors = useThemeColors();

  if (variant === "grid") {
    return (
      <PressableCard
        onPress={onPress}
        className="gap-2 p-3.5"
        style={item.isUrgent ? { borderLeftWidth: 3, borderLeftColor: colors.danger } : undefined}
      >
        <View className="flex-row items-start justify-between gap-1.5">
          <View className="flex-1 self-start rounded-lg bg-emerald-50 px-2 py-1 dark:bg-accent/15">
            <Text className="text-[11px] text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
              {item.categoryLabel}
            </Text>
          </View>
          {item.isUrgent ? <Ionicons name="flash" size={14} color={colors.danger} /> : null}
        </View>

        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={2}>
          {item.title}
        </Text>

        <View className="flex-row items-center gap-1">
          <Ionicons name="location-outline" size={12} color={colors.muted} />
          <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }} numberOfLines={1}>
          {item.price}
        </Text>

        <View className="flex-row items-center justify-between gap-1 border-t border-border pt-2">
          <Text className="text-[11px] text-muted" numberOfLines={1}>
            {item.offersCount > 0 ? `${item.offersCount} ta taklif` : "Takliflar yo'q"}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </View>
      </PressableCard>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      className="gap-3 p-4"
      style={
        item.isUrgent
          ? { borderLeftWidth: 3, borderLeftColor: colors.danger }
          : undefined
      }
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="self-start rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-accent/15">
          <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {item.categoryLabel}
          </Text>
        </View>
        {item.isUrgent ? (
          <View className="flex-row items-center gap-1 self-start rounded-lg bg-red-50 px-2.5 py-1 dark:bg-danger/15">
            <Ionicons name="flash" size={12} color={colors.danger} />
            <Text className="text-xs text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              Shoshilinch
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-1">
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-sm text-muted" numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1.5">
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text className="flex-1 text-sm text-muted" numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Ionicons name="alert-circle-outline" size={14} color={colors.muted} />
        <Text className="text-sm text-muted">Bajarish muddati: </Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {item.deadlineLabel}
        </Text>
      </View>

      <View className="gap-2 rounded-2xl bg-background px-3.5 py-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="wallet-outline" size={13} color={colors.muted} />
            <Text className="text-xs text-muted">Byudjet</Text>
          </View>
          {item.paymentType ? (
            <View className="flex-row items-center gap-1 self-start rounded-lg bg-surface px-2.5 py-1.5">
              <Ionicons
                name={item.paymentType === "escrow" ? "shield-checkmark-outline" : "swap-horizontal-outline"}
                size={12}
                color={colors.muted}
              />
              <Text className="text-xs text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }} numberOfLines={1}>
                {PAYMENT_LABEL[item.paymentType]}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-lg text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
          {item.price}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-2 pt-1">
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={13} color={colors.muted} />
          <Text className="text-xs text-muted">{item.postedAtLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Avatar uri={item.offerAvatarUri} size={20} />
          <Text className="text-xs text-muted">
            {item.offersCount > 0 ? `${item.offersCount} ta taklif keldi` : "Takliflar yo'q"}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOfferPress}
        className="flex-row items-center justify-center gap-2 rounded-full bg-accent py-3"
      >
        <Ionicons name={ctaVariant === "manage" ? "people-outline" : "paper-plane-outline"} size={16} color="#FFFFFF" />
        <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {ctaVariant === "manage" ? "Takliflarni ko'rish" : "Taklif yuborish"}
        </Text>
      </Pressable>
    </PressableCard>
  );
}
