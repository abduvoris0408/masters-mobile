import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";

import { Card } from "@/components/ui/Card";
import { PillTabs } from "@/components/ui/PillTabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Caption, SectionTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterStatisticsQuery } from "@/services/payments";
import type { IMasterStatistics, TStatisticsPeriod } from "@/types";
import {
  formatCompactNumber,
  formatDateRange,
  formatMonthLong,
  formatMonthShort,
  formatPrice,
} from "@/utils/format";

type ChartMetric = "earned" | "orders";
type Monthly = IMasterStatistics["monthly"][number];

const STAR_COLOR = "#F59E0B";
const CHART_HEIGHT = 150;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const formatRate = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate)}%`);

// Stat cards show the currency as a separate small suffix (see StatCard's
// `unit`), so only the grouped number goes in the big text.
const formatAmount = (value: number) => new Intl.NumberFormat("uz-UZ").format(value);
const CURRENCY = "so'm";

// Rounds the tallest value up to 1/2/5 × 10ⁿ so gridline labels land on
// readable numbers (625 000 -> 1 mln, 15 -> 20) instead of the raw maximum.
const niceMax = (value: number) => {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
};

// 0 → 1 once on mount — drives the bars/progress tracks growing in.
function useMountProgress() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 700, easing: EASE });
  }, [progress]);
  return progress;
}

function ProgressTrack({ percent, color }: { percent: number | null; color: string }) {
  const colors = useThemeColors();
  const progress = useMountProgress();
  const clamped = Math.min(100, Math.max(0, percent ?? 0));
  const fillStyle = useAnimatedStyle(() => ({ width: `${clamped * progress.value}%` }));
  return (
    <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: colors.background }}>
      <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, fillStyle]} />
    </View>
  );
}

// Period-over-period change pill ("+12%" / "−4%"). Renders nothing when the
// backend has no previous period to compare against (change_percent: null).
function ChangeBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 10) / 10;
  const tone =
    rounded > 0
      ? { color: "#15803D", bg: "rgba(22,163,74,0.12)", icon: "trending-up" as const }
      : rounded < 0
        ? { color: "#B91C1C", bg: "rgba(220,38,38,0.12)", icon: "trending-down" as const }
        : { color: "#64748B", bg: "rgba(100,116,139,0.14)", icon: "remove" as const };
  return (
    <View className="flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5" style={{ backgroundColor: tone.bg }}>
      <Ionicons name={tone.icon} size={11} color={tone.color} />
      <Text style={{ fontSize: 11, color: tone.color, fontFamily: GOLOS_WEIGHTS.semibold }}>
        {rounded > 0 ? "+" : ""}
        {rounded}%
      </Text>
    </View>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  unit,
  sub,
  badge,
  progress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: ReactNode;
  // Small muted suffix after the number ("so'm", "/ 5") so the figure itself
  // keeps a readable size instead of everything shrinking to fit.
  unit?: string;
  sub?: string;
  badge?: ReactNode;
  // 0–100; draws a thin progress track at the bottom when set (null = empty).
  progress?: number | null;
}) {
  return (
    <View className="gap-1.5 rounded-2xl bg-surface p-3.5" style={{ flexGrow: 1, flexBasis: "45%" }}>
      <View className="flex-row items-center justify-between gap-1">
        <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1F` }}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        {badge}
      </View>
      <Text className="text-xs text-muted" numberOfLines={1}>
        {label}
      </Text>
      <Text
        className="text-foreground"
        style={{ fontFamily: GOLOS_WEIGHTS.semibold, fontSize: 20, lineHeight: 26, fontVariant: ["tabular-nums"] }}
        numberOfLines={1}
      >
        {value}
        {unit ? (
          <Text className="text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium, fontSize: 13 }}>
            {` ${unit}`}
          </Text>
        ) : null}
      </Text>
      {sub ? (
        <Text className="text-[11px] text-muted" numberOfLines={2}>
          {sub}
        </Text>
      ) : null}
      {progress !== undefined ? (
        <View className="mt-auto pt-1.5">
          <ProgressTrack percent={progress} color={color} />
        </View>
      ) : null}
    </View>
  );
}

function Bar({ height, color, dim }: { height: number; color: string; dim: boolean }) {
  const colors = useThemeColors();
  const progress = useMountProgress();
  const style = useAnimatedStyle(() => ({ height: height > 0 ? Math.max(4, height * progress.value) : 2 }));
  return (
    <Animated.View
      style={[
        {
          width: "100%",
          maxWidth: 30,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: height > 0 ? color : colors.border,
          opacity: dim ? 0.45 : 1,
        },
        style,
      ]}
    />
  );
}

// Single-series monthly bar chart, hand-rolled with Views rather than pulling
// in a chart library for half a dozen bars. Tapping a column selects it and
// shows that month's details underneath (the web version's hover tooltip).
function MonthlyBarChart({ data, metric }: { data: Monthly[]; metric: ChartMetric }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const [selected, setSelected] = useState<number | null>(null);
  const value = (m: Monthly) => (metric === "earned" ? m.earned : m.orders);
  const formatValue = (v: number) => (metric === "earned" ? formatCompactNumber(v) : String(v));

  const values = data.map(value);
  const top = niceMax(Math.max(...values, 0));
  const ticks = [top, top / 2, 0];
  const lastIndex = data.length - 1;
  const active = selected ?? lastIndex;
  const activeItem = data[active];

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <View style={{ width: 44, height: CHART_HEIGHT }} className="justify-between">
          {ticks.map((tick, i) => (
            <Text key={i} className="text-right text-[10px] text-muted" numberOfLines={1}>
              {formatValue(tick)}
            </Text>
          ))}
        </View>
        <View className="flex-1">
          <View style={{ height: CHART_HEIGHT }}>
            {ticks.map((_, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: (i / (ticks.length - 1)) * (CHART_HEIGHT - 1),
                  borderTopWidth: 1,
                  borderStyle: i === ticks.length - 1 ? "solid" : "dashed",
                  borderColor: colors.border,
                }}
              />
            ))}
            <View className="absolute inset-0 flex-row items-end gap-1.5">
              {data.map((item, i) => (
                <Pressable
                  key={item.month}
                  onPress={() => setSelected(i === selected ? null : i)}
                  className="h-full flex-1 items-center justify-end"
                >
                  <Bar
                    height={(values[i] / top) * CHART_HEIGHT}
                    color={i === active ? colors.accent : `${colors.accent}66`}
                    dim={selected !== null && selected !== i}
                  />
                </Pressable>
              ))}
            </View>
          </View>
          <View className="mt-1.5 flex-row gap-1.5">
            {data.map((item, i) => (
              <Text
                key={item.month}
                className={`flex-1 text-center text-[10.5px] capitalize ${i === active ? "text-foreground" : "text-muted"}`}
                style={{ fontFamily: i === active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.regular }}
                numberOfLines={1}
              >
                {formatMonthShort(item.month)}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {activeItem ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-background px-3.5 py-2.5">
          <Text className="text-[13px] capitalize text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {formatMonthLong(activeItem.month)}
          </Text>
          <Text className="text-xs text-muted">
            {t("stats_metric_earned")}: {formatPrice(activeItem.earned)}
          </Text>
          <Text className="text-xs text-muted">
            {t("stats_metric_orders")}: {activeItem.orders}
          </Text>
          {activeItem.rating !== null ? (
            <Text className="text-xs text-muted">
              {t("stats_rating")}: {activeItem.rating.toFixed(1)} ★ ({activeItem.reviews_count})
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// One stacked bar splitting the period's orders by state, with a legend that
// repeats each count so the split never relies on color alone.
function OrdersBreakdown({ orders }: { orders: IMasterStatistics["orders"] }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const segments = [
    { key: "new", value: orders.new, color: "#60A5FA" },
    { key: "active", value: orders.active, color: "#F59E0B" },
    { key: "completed", value: orders.completed, color: "#10B981" },
    { key: "cancelled", value: orders.cancelled, color: "#F87171" },
  ];
  const sum = segments.reduce((acc, s) => acc + s.value, 0);

  return (
    <Card className="gap-4 p-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {t("stats_breakdown")}
        </Text>
        <Caption className="text-xs">{t("stats_orders_total", { count: orders.total })}</Caption>
      </View>

      <View
        className="h-3 flex-row overflow-hidden rounded-full"
        style={{ gap: sum > 0 ? 2 : 0, backgroundColor: colors.background }}
      >
        {sum > 0
          ? segments
              .filter((s) => s.value > 0)
              .map((s) => <View key={s.key} style={{ flex: s.value, backgroundColor: s.color }} />)
          : null}
      </View>

      <View className="flex-row flex-wrap gap-y-2.5">
        {segments.map((s) => (
          <View key={s.key} className="flex-row items-center gap-2 pr-4" style={{ width: "50%" }}>
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="flex-1 text-[13px] text-muted" numberOfLines={1}>
              {t(`stats_status_${s.key}`)}
            </Text>
            <Text className="text-[13px] text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      <View
        className="flex-row items-center justify-between gap-3 pt-3"
        style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: colors.border }}
      >
        <Text className="flex-1 text-[13px] text-muted">{t("stats_completed_value")}</Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {formatPrice(orders.completed_value)}
        </Text>
      </View>
    </Card>
  );
}

function RatingCriteria({ rating }: { rating: IMasterStatistics["rating"] }) {
  const { t } = useTranslation("catalog");
  const criteria = Object.entries(rating.criteria);
  const rounded = Math.round((rating.average ?? 0) * 2) / 2;

  return (
    <Card className="gap-3.5 p-4">
      <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
        {t("stats_criteria")}
      </Text>

      {rating.reviews_count === 0 ? (
        <Caption className="text-[13px]">{t("stats_no_reviews")}</Caption>
      ) : (
        <>
          <View className="flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: `${STAR_COLOR}1A` }}>
            <Text className="text-3xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {rating.average?.toFixed(1) ?? "—"}
            </Text>
            <View className="gap-0.5">
              <View className="flex-row gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={rounded >= n ? "star" : rounded >= n - 0.5 ? "star-half" : "star-outline"}
                    size={14}
                    color={STAR_COLOR}
                  />
                ))}
              </View>
              <Text className="text-xs text-muted">{t("stats_reviews_count", { count: rating.reviews_count })}</Text>
            </View>
          </View>

          {criteria.map(([key, value]) => (
            <View key={key} className="gap-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-[13px] text-foreground">{t(`stats_criteria_${key}`, { defaultValue: key })}</Text>
                <Text className="text-[13px] text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {value?.toFixed(1) ?? "—"}
                </Text>
              </View>
              <ProgressTrack percent={value === null ? null : (value / 5) * 100} color={STAR_COLOR} />
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

function PanelSkeleton() {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="gap-2 rounded-2xl bg-surface p-3.5" style={{ flexGrow: 1, flexBasis: "45%" }}>
            <Skeleton width={32} height={32} radius={12} />
            <Skeleton width="60%" height={12} />
            <Skeleton width="80%" height={18} />
          </View>
        ))}
      </View>
      <Skeleton height={220} radius={24} />
    </View>
  );
}

// Master dashboard statistics (GET /payments/balance/master-statistics/) —
// mobile port of the web project's MasterStatisticsPanel: a money grid, an
// activity grid, the monthly trend, then the order-status split and rating
// criteria stacked underneath.
export function MasterStatisticsPanel() {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const [period, setPeriod] = useState<TStatisticsPeriod>("month");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("earned");
  const { data, isLoading, isError, isFetching, refetch } = useMasterStatisticsQuery(period);

  return (
    <View className="gap-3">
      <View className="gap-0.5 px-1">
        <SectionTitle>{t("stats_title")}</SectionTitle>
        {data ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={13} color={colors.muted} />
            <Caption className="text-xs">{formatDateRange(data.period.date_from, data.period.date_to)}</Caption>
          </View>
        ) : null}
      </View>

      <PillTabs<TStatisticsPeriod>
        value={period}
        onChange={setPeriod}
        options={(["week", "month", "year"] as const).map((p) => ({ value: p, label: t(`stats_period_${p}`) }))}
      />

      {isLoading ? (
        <PanelSkeleton />
      ) : isError || !data ? (
        <Pressable onPress={() => refetch()} className="items-center gap-1 rounded-3xl bg-surface p-5">
          <Ionicons name="refresh" size={18} color={colors.muted} />
          <Text className="text-sm text-muted">{t("stats_error")}</Text>
        </Pressable>
      ) : (
        <View className="gap-3" style={{ opacity: isFetching ? 0.6 : 1 }}>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="wallet-outline"
              color={colors.accent}
              label={t("stats_balance")}
              value={formatAmount(data.income.balance)}
              unit={CURRENCY}
            />
            <StatCard
              icon="cash-outline"
              color="#0EA5E9"
              label={t("stats_period_earned")}
              value={formatAmount(data.income.earned)}
              unit={CURRENCY}
              badge={<ChangeBadge value={data.income.change_percent} />}
              sub={t("stats_commission_value", { value: formatPrice(data.income.commission) })}
            />
            <StatCard
              icon="time-outline"
              color="#F59E0B"
              label={t("stats_pending")}
              value={formatAmount(data.income.pending)}
              unit={CURRENCY}
            />
            <StatCard
              icon="trophy-outline"
              color="#6366F1"
              label={t("stats_total_earned")}
              value={formatAmount(data.income.total_earned)}
              unit={CURRENCY}
            />
          </View>

          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="clipboard-outline"
              color="#3B82F6"
              label={t("stats_orders")}
              value={data.orders.total}
              badge={<ChangeBadge value={data.orders.change_percent} />}
              sub={t("stats_previous", { count: data.orders.previous_total })}
            />
            <StatCard
              icon="checkmark-circle-outline"
              color="#10B981"
              label={t("stats_completion_rate")}
              value={formatRate(data.orders.completion_rate)}
              sub={t("stats_completed_of", { completed: data.orders.completed, total: data.orders.total })}
              progress={data.orders.completion_rate}
            />
            <StatCard
              icon="paper-plane-outline"
              color="#8B5CF6"
              label={t("stats_offers")}
              value={data.offers.sent}
              sub={t("stats_offers_accepted", {
                count: data.offers.accepted,
                rate: formatRate(data.offers.acceptance_rate),
              })}
              progress={data.offers.acceptance_rate}
            />
            <StatCard
              icon="star-outline"
              color={STAR_COLOR}
              label={t("stats_rating")}
              value={data.rating.average?.toFixed(1) ?? "—"}
              unit="/ 5"
              sub={t("stats_reviews_count", { count: data.rating.reviews_count })}
              progress={data.rating.average === null ? null : (data.rating.average / 5) * 100}
            />
          </View>

          {data.monthly.length > 0 ? (
            <Card className="gap-4 p-4">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-accent/15">
                  <Ionicons name="bar-chart-outline" size={16} color={colors.accent} />
                </View>
                <Text className="flex-1 text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {t("stats_monthly")}
                </Text>
              </View>
              <PillTabs<ChartMetric>
                value={chartMetric}
                onChange={setChartMetric}
                options={[
                  { value: "earned", label: t("stats_metric_earned") },
                  { value: "orders", label: t("stats_metric_orders") },
                ]}
              />
              <MonthlyBarChart data={data.monthly} metric={chartMetric} />
            </Card>
          ) : null}

          <OrdersBreakdown orders={data.orders} />
          <RatingCriteria rating={data.rating} />
        </View>
      )}
    </View>
  );
}
