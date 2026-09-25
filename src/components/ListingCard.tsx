import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { BadgeLabel, Caption } from "@/components/ui/Typography";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import type { TPaymentType } from "@/types";

export interface ListingCardData {
  id: string;
  categoryGuid: string;
  categoryIcon?: string | null;
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

// The backend doesn't return a color for a category, only (sometimes) an
// icon image URL — so the tile color is picked deterministically from the
// category's guid (same approach as ustabor-front's ApplicationListRow),
// and the icon itself renders straight from that URL. Only when it's null
// does a generic wrench fall in as a placeholder.
const CATEGORY_TILE_COLORS = ["#AF52DE", "#5AC8FA", "#FF6482", "#FF9500", "#34C759", "#5856D6", "#30B0C7", "#FF2D55"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCategoryTileColor(categoryGuid: string): string {
  return CATEGORY_TILE_COLORS[hashString(categoryGuid) % CATEGORY_TILE_COLORS.length];
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

// One card = one listing row from the "Elonlar" feed screenshot: category
// tag + urgent badge up top, title/description, location + deadline rows,
// a budget row with the payment-type badge, then an offers footer and a
// full-width CTA. Urgent listings get a red left accent border, matching the
// reference screens' red-outlined card treatment.
export function ListingCard({ item, onPress, onOfferPress, ctaVariant = "offer", variant = "list" }: ListingCardProps) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const PAYMENT_LABEL: Record<TPaymentType, string> = {
    direct: t("listing_payment_direct"),
    escrow: t("listing_payment_escrow"),
  };

  if (variant === "grid") {
    // Compact single-column row per the reference screenshot: a colored
    // category tile on the left, everything else stacked to its right —
    // title, address, date and price all in one glance, plus a status
    // badge instead of the full card's description/CTA/footer.
    const tileColor = getCategoryTileColor(item.categoryGuid);
    return (
      <Pressable onPress={onPress} className="flex-row items-start gap-3 py-3 active:opacity-70">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${tileColor}1F` }}
        >
          {item.categoryIcon ? (
            <Image source={{ uri: item.categoryIcon }} style={{ width: 22, height: 22 }} resizeMode="contain" />
          ) : (
            <Ionicons name="construct" size={20} color={tileColor} />
          )}
        </View>

        <View className="flex-1 gap-1">
          <Text className="text-[15px] text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {item.address}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {item.deadlineLabel}
          </Text>
          <Text className="mt-0.5 text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
            {item.price}
          </Text>
          <View className="mt-0.5 self-start rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-accent/15">
            <BadgeLabel className="text-[11px] text-accent" numberOfLines={1}>
              {item.offersCount > 0 ? t("listing_offers_count", { count: item.offersCount }) : t("listing_no_offers")}
            </BadgeLabel>
          </View>
        </View>
      </Pressable>
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
          <BadgeLabel className="text-accent">{item.categoryLabel}</BadgeLabel>
        </View>
        {item.isUrgent ? (
          <View className="flex-row items-center gap-1 self-start rounded-lg bg-red-50 px-2.5 py-1 dark:bg-danger/15">
            <Ionicons name="flash" size={12} color={colors.danger} />
            <BadgeLabel className="text-danger">{t("listing_urgent")}</BadgeLabel>
          </View>
        ) : null}
      </View>

      <View className="gap-1">
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }} numberOfLines={2}>
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
        <Text className="text-sm text-muted">{t("listing_deadline_label")} </Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {item.deadlineLabel}
        </Text>
      </View>

      <View className="gap-2 rounded-2xl bg-background px-3.5 py-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="wallet-outline" size={13} color={colors.muted} />
            <Text className="text-xs text-muted">{t("listing_budget_label")}</Text>
          </View>
          {item.paymentType ? (
            <View className="flex-row items-center gap-1 self-start rounded-lg bg-surface px-2.5 py-1.5">
              <Ionicons
                name={item.paymentType === "escrow" ? "shield-checkmark-outline" : "swap-horizontal-outline"}
                size={12}
                color={colors.muted}
              />
              <Caption numberOfLines={1}>{PAYMENT_LABEL[item.paymentType]}</Caption>
            </View>
          ) : null}
        </View>
        <Text className="text-lg text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
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
            {item.offersCount > 0 ? t("listing_offers_received", { count: item.offersCount }) : t("listing_no_offers")}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOfferPress}
        className="flex-row items-center justify-center gap-2 rounded-full bg-accent py-3"
      >
        <Ionicons name={ctaVariant === "manage" ? "people-outline" : "paper-plane-outline"} size={16} color="#FFFFFF" />
        <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {ctaVariant === "manage" ? t("listing_view_offers") : t("listing_send_offer")}
        </Text>
      </Pressable>
    </PressableCard>
  );
}

// Placeholder shown while the first page of listings is loading — same
// shape as the real card (minus text) so the feed doesn't jump when data
// replaces it. "grid" here means the compact single-row variant (see
// ListingCardData/variant above), not a multi-column grid.
export function ListingCardSkeleton({ variant = "list" }: { variant?: "list" | "grid" }) {
  if (variant === "grid") {
    return (
      <View className="flex-row items-start gap-3 py-3">
        <Skeleton width={44} height={44} radius={16} />
        <View className="flex-1 gap-2">
          <Skeleton width="70%" height={15} />
          <Skeleton width="50%" height={13} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="35%" height={17} />
          <Skeleton width={90} height={20} radius={10} />
        </View>
      </View>
    );
  }

  return (
    <PressableCard className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <Skeleton width={90} height={20} radius={8} />
      </View>
      <View className="gap-1.5">
        <Skeleton width="85%" height={18} />
        <Skeleton width="60%" height={14} />
      </View>
      <Skeleton width="70%" height={14} />
      <Skeleton width="50%" height={14} />
      <Skeleton height={62} radius={16} />
      <View className="flex-row items-center justify-between pt-1">
        <Skeleton width={70} height={12} />
        <Skeleton width={90} height={12} />
      </View>
      <Skeleton height={44} radius={999} />
    </PressableCard>
  );
}
