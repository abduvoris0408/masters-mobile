import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useCreateFavoriteMutation, useDeleteFavoriteMutation, useFavoriteLookup } from "@/services/favorite";
import type { TFavoriteType } from "@/types";
import { showSuccess } from "@/utils/toast";

export const HEART_COLOR = "#F43F5E";

interface Props {
  type: TFavoriteType;
  // The profile's / organization's own guid (not a favorite record's).
  targetGuid: string;
  // "icon": round heart for catalog cards; "plain": bare heart glyph
  // (favorites screen tiles); "button": labelled pill for detail-page
  // action rows.
  variant?: "icon" | "plain" | "button";
}

// Heart toggle shared by master/organization cards and detail headers —
// port of the web project's FavoriteButton. Sits inside pressable cards, so
// it's its own Pressable: RN gives the touch to the innermost responder and
// the card's onPress doesn't fire.
export function FavoriteButton({ type, targetGuid, variant = "icon" }: Props) {
  const { t } = useTranslation("favorites");
  const colors = useThemeColors();
  const lookup = useFavoriteLookup(type);
  const createMutation = useCreateFavoriteMutation();
  const deleteMutation = useDeleteFavoriteMutation();
  const scale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const favoriteGuid = lookup.get(targetGuid);
  const isFavorite = !!favoriteGuid;
  const pending = createMutation.isPending || deleteMutation.isPending;

  const toggle = async () => {
    if (pending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    scale.value = withSequence(withTiming(1.3, { duration: 120 }), withSpring(1, { damping: 10, stiffness: 220 }));
    try {
      if (favoriteGuid) {
        await deleteMutation.mutateAsync(favoriteGuid);
        showSuccess(t("removed"));
      } else {
        await createMutation.mutateAsync(
          type === "profile" ? { type, profile: targetGuid } : { type, organization: targetGuid },
        );
        showSuccess(t("added"));
      }
    } catch {
      // Real reason is already surfaced by the global API-error toast.
    }
  };

  const heart = (size: number, idleColor: string) => (
    <Animated.View style={heartStyle}>
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={size}
        color={isFavorite ? HEART_COLOR : idleColor}
      />
    </Animated.View>
  );

  const label = isFavorite ? t("remove") : t("add");

  if (variant === "button") {
    return (
      <Pressable
        onPress={toggle}
        disabled={pending}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFavorite }}
        className="flex-row items-center gap-2 rounded-full px-4 py-2.5"
        style={{ backgroundColor: isFavorite ? `${HEART_COLOR}14` : colors.background }}
      >
        {pending ? <ActivityIndicator size="small" color={HEART_COLOR} /> : heart(16, colors.foreground)}
        <Text
          className="text-base"
          style={{ fontFamily: GOLOS_WEIGHTS.bold, color: isFavorite ? HEART_COLOR : colors.foreground }}
        >
          {isFavorite ? t("saved") : t("save")}
        </Text>
      </Pressable>
    );
  }

  if (variant === "plain") {
    return (
      <Pressable
        onPress={toggle}
        disabled={pending}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFavorite }}
      >
        {heart(22, colors.muted)}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      disabled={pending}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFavorite }}
      className="h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: isFavorite ? `${HEART_COLOR}14` : colors.background }}
    >
      {heart(18, colors.muted)}
    </Pressable>
  );
}
