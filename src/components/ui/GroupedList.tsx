import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

// iOS grouped list (Settings / Telegram): rounded white (#1C1C1E in dark)
// group on the canvas, rows with a colored icon tile, 17px regular label,
// trailing value/badge + chevron, and hairline separators inset to the text.

const ROW_PADDING_X = 16;
const TILE_SIZE = 30;
const TILE_GAP = 14;

export function ListGroup({ children }: { children: ReactNode }) {
  return <View className="overflow-hidden rounded-2xl bg-surface">{children}</View>;
}

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon tile fill — an iOS system color (white glyph on top). */
  color: string;
  label: string;
  onPress: () => void;
  /** Muted text before the chevron (e.g. a current value or a count). */
  value?: string;
  /** Red count pill before the chevron; hidden when 0/undefined. */
  badge?: number;
  isLast?: boolean;
}

export function ListRow({ icon, color, label, onPress, value, badge, isLast }: ListRowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center active:bg-border/50"
      style={{ minHeight: 50, paddingHorizontal: ROW_PADDING_X, gap: TILE_GAP }}
    >
      <View
        className="items-center justify-center"
        style={{ width: TILE_SIZE, height: TILE_SIZE, borderRadius: 8, backgroundColor: color }}
      >
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text className="flex-1 text-[17px] text-foreground" numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text className="text-[17px] text-muted" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {badge ? (
        <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-danger px-1.5">
          <Text className="text-[13px] font-semibold text-white">{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ marginLeft: -4 }} />
      {isLast ? null : (
        <View
          className="absolute bottom-0 right-0 bg-border"
          style={{ left: ROW_PADDING_X + TILE_SIZE + TILE_GAP, height: StyleSheet.hairlineWidth * 2 }}
        />
      )}
    </Pressable>
  );
}
