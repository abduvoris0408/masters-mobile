import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useProfileReviewsQuery } from "@/services/review";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 5;

interface Props {
  profileGuid: string;
  fallbackRating: number | null;
  page: number;
  onPageChange: (page: number) => void;
  onSummary?: (summary: { averageRating: number | null; count: number }) => void;
}

export function ReviewsSection({ profileGuid, fallbackRating, page, onPageChange, onSummary }: Props) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const { data, isLoading } = useProfileReviewsQuery(profileGuid, page, PAGE_SIZE);

  const reviews = data?.results ?? [];
  const count = data?.count ?? 0;
  const averageRating = data?.average_rating ?? fallbackRating ?? null;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  useEffect(() => {
    if (data) onSummary?.({ averageRating: data.average_rating ?? fallbackRating ?? null, count: data.count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <View className="gap-3 rounded-3xl bg-surface p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {t("reviews_title")}
        </Text>
        {!isLoading && count > 0 ? (
          <View className="flex-row items-center gap-2">
            <Rating value={averageRating ?? 0} />
            <Text className="text-xs text-muted">({count})</Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
      ) : count === 0 ? (
        <EmptyState icon="chatbubbles-outline" title={t("reviews_empty_title")} />
      ) : (
        <View className="gap-2.5">
          {reviews.map((review) => (
            <View key={review.id} className="gap-1.5 rounded-2xl border border-border p-3.5">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Avatar name={review.customer?.name} size={24} />
                  <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    {review.customer?.name}
                  </Text>
                </View>
                <Text className="text-xs text-muted">{formatDateTime(review.created_at)}</Text>
              </View>
              <Rating value={review.rating} />
              {review.comment ? <Text className="text-sm leading-5 text-foreground">{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {totalPages > 1 ? (
        <View className="flex-row items-center justify-center gap-4 pt-1">
          <Pressable onPress={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={page <= 1 ? colors.muted : colors.foreground} />
          </Pressable>
          <Text className="text-xs text-muted">{t("reviews_page_indicator", { page, totalPages })}</Text>
          <Pressable onPress={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={page >= totalPages ? colors.muted : colors.foreground} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
