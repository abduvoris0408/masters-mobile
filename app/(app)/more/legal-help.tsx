import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import {
  useCreateLegalSupportRequestByOrderNumberMutation,
  useLegalSupportCategoriesQuery,
  useLegalSupportRequestsQuery,
} from "@/services/legal-support";
import type { ILegalSupportCategory, ILegalSupportRequestListItem } from "@/types";
import { formatDateTime } from "@/utils/format";
import { appendUniquePage } from "@/utils/pagination";
import { showError, showSuccess } from "@/utils/toast";

const HISTORY_PAGE_SIZE = 10;

// Fallback icon set for categories the backend didn't attach an icon to —
// keyed off the category id so the same category always gets the same icon.
const FALLBACK_CATEGORY_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "wallet-outline",
  "document-text-outline",
  "close-circle-outline",
  "shield-outline",
  "alert-circle-outline",
];

function CategoryCard({
  category,
  selected,
  onPress,
}: {
  category: ILegalSupportCategory;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const fallbackIcon = FALLBACK_CATEGORY_ICONS[category.id % FALLBACK_CATEGORY_ICONS.length];

  return (
    <Pressable
      onPress={onPress}
      className={`gap-2 rounded-2xl border p-3.5 ${selected ? "border-danger bg-red-50 dark:bg-danger/10" : "border-border bg-surface"}`}
      style={{ width: "48%" }}
    >
      <Ionicons name={fallbackIcon} size={20} color={selected ? colors.danger : colors.muted} />
      <Text
        className={`text-sm ${selected ? "text-danger" : "text-foreground"}`}
        style={{ fontFamily: GOLOS_WEIGHTS.semibold }}
        numberOfLines={2}
      >
        {category.name}
      </Text>
      {category.description ? (
        <Text className="text-xs leading-4 text-muted" numberOfLines={2}>
          {category.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

function RequestHistoryRow({ item }: { item: ILegalSupportRequestListItem }) {
  const { t } = useTranslation("orders");
  const STATUS_META: Record<string, { tone: ChipTone; label: string }> = {
    pending: { tone: "warning", label: t("legal_status_pending") },
    in_review: { tone: "info", label: t("legal_status_reviewing") },
    reviewing: { tone: "info", label: t("legal_status_reviewing") },
    resolved: { tone: "success", label: t("legal_status_resolved") },
    rejected: { tone: "danger", label: t("legal_status_rejected") },
    closed: { tone: "neutral", label: t("status_closed") },
  };
  const status = STATUS_META[item.status] ?? { tone: "neutral" as ChipTone, label: item.status };
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-surface p-3.5">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted">{formatDateTime(item.created_at)}</Text>
          {item.is_priority ? <Chip label={t("legal_priority_badge")} tone="warning" /> : null}
        </View>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={2}>
          {t("legal_request_row_title", { category: item.category.name, orderNumber: item.order.order_number })}
        </Text>
      </View>
      <Chip label={status.label} tone={status.tone} />
    </View>
  );
}

export default function LegalHelpScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();

  const TRUST_BADGES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: "flash-outline", label: t("legal_trust_badge_free_consult") },
    { icon: "time-outline", label: t("legal_trust_badge_response_time") },
    { icon: "lock-closed-outline", label: t("legal_trust_badge_confidential") },
  ];

  const { data: categoriesData, isLoading: categoriesLoading } = useLegalSupportCategoriesQuery();
  const categories = categoriesData?.results ?? [];
  const createMutation = useCreateLegalSupportRequestByOrderNumberMutation();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [againstPerson, setAgainstPerson] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (categoryId === null && categories.length > 0) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyItems, setHistoryItems] = useState<ILegalSupportRequestListItem[]>([]);
  const { data, isLoading, isFetching, isError, refetch } = useLegalSupportRequestsQuery(historyPage, HISTORY_PAGE_SIZE);

  useEffect(() => {
    if (!data) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setHistoryItems((prev) => appendUniquePage(historyPage === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, historyPage]);

  const hasMoreHistory = !!data?.next;

  const handleSubmit = async () => {
    if (!orderNumber.trim() || !categoryId || !description.trim() || !againstPerson.trim()) {
      showError(t("legal_all_fields_required"));
      return;
    }
    try {
      await createMutation.mutateAsync({
        order_number: orderNumber.trim(),
        category: categoryId,
        description: description.trim(),
        against_person: againstPerson.trim(),
      });
      showSuccess(t("legal_request_success"));
      setOrderNumber("");
      setAgainstPerson("");
      setDescription("");
      setHistoryPage(1);
    } catch {
      showError(t("legal_request_error"));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("legal_help_header")} onBackPress={() => router.back()} />

      <FlatList
        data={historyItems}
        keyExtractor={(item) => item.guid}
        contentContainerClassName="gap-4 px-4 pb-10"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="items-center gap-3 rounded-3xl bg-surface p-5">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-danger/15">
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.danger} />
              </View>
              <Text className="text-center text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {t("legal_help_header")}
              </Text>
              <Text className="text-center text-sm leading-5 text-muted">
                {t("legal_help_intro")}
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {TRUST_BADGES.map((badge) => (
                  <View key={badge.label} className="flex-row items-center gap-1.5 rounded-full bg-background px-3 py-1.5">
                    <Ionicons name={badge.icon} size={13} color={colors.accent} />
                    <Text className="text-xs text-foreground">{badge.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-2.5">
              <Text className="px-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {t("legal_problem_type_title")}
              </Text>
              {categoriesLoading ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
              ) : categories.length === 0 ? (
                <Text className="px-1 text-sm text-muted">{t("legal_categories_load_error")}</Text>
              ) : (
                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(category.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            <Card className="gap-3">
              <View className="gap-1">
                <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {t("legal_form_title")}
                </Text>
                <Text className="text-xs text-muted">
                  {t("legal_form_subtitle")}
                </Text>
              </View>

              <View className="gap-1.5">
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                  {t("legal_order_number_label")}
                </Text>
                <View className="flex-row items-center gap-2 rounded-2xl bg-background px-4">
                  <Ionicons name="pricetag-outline" size={15} color={colors.muted} />
                  <TextInput
                    value={orderNumber}
                    onChangeText={setOrderNumber}
                    placeholder={t("legal_order_number_placeholder")}
                    placeholderTextColor={colors.muted}
                    className="flex-1 py-3 text-base text-foreground"
                    style={{ color: colors.foreground }}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                  {t("legal_against_person_label")}
                </Text>
                <View className="flex-row items-center gap-2 rounded-2xl bg-background px-4">
                  <Ionicons name="person-outline" size={15} color={colors.muted} />
                  <TextInput
                    value={againstPerson}
                    onChangeText={setAgainstPerson}
                    placeholder={t("legal_against_person_placeholder")}
                    placeholderTextColor={colors.muted}
                    className="flex-1 py-3 text-base text-foreground"
                    style={{ color: colors.foreground }}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                  {t("legal_description_label")}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder={t("legal_description_placeholder")}
                  placeholderTextColor={colors.muted}
                  className="rounded-2xl bg-background px-4 py-3 text-base text-foreground"
                  style={{ minHeight: 90, textAlignVertical: "top", color: colors.foreground }}
                />
              </View>

              <View className="flex-row items-start gap-2 rounded-2xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/15">
                <Ionicons name="warning-outline" size={15} color="#D97706" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-xs text-foreground">
                  {t("legal_priority_notice")}
                </Text>
              </View>

              <Button loading={createMutation.isPending} onPress={handleSubmit}>
                {t("legal_submit_button")}
              </Button>
            </Card>

            <Card className="gap-3">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-accent/15">
                  <Ionicons name="call-outline" size={16} color={colors.accent} />
                </View>
                <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {t("legal_direct_contact_title")}
                </Text>
              </View>
              <Text className="text-xs leading-5 text-muted">
                {t("legal_direct_contact_description")}
              </Text>
              <View className="gap-2">
                {[
                  t("legal_step_1"),
                  t("legal_step_2"),
                  t("legal_step_3"),
                ].map((step, i) => (
                  <View key={step} className="flex-row items-center gap-2.5">
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-emerald-50 dark:bg-accent/15">
                      <Text className="text-[11px] text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text className="flex-1 text-xs text-foreground">{step}</Text>
                  </View>
                ))}
              </View>
              <View className="items-center gap-0.5 rounded-2xl bg-background py-3">
                <Text className="text-2xl text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
                  870+
                </Text>
                <Text className="text-xs text-muted">{t("legal_requests_resolved_label")}</Text>
              </View>
              <Button variant="outline" onPress={() => showError(t("legal_feature_coming_soon"))}>
                {t("legal_contact_now_button")}
              </Button>
            </Card>

            <Text className="px-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {t("legal_your_requests_title")}
            </Text>
          </View>
        }
        renderItem={({ item }) => <RequestHistoryRow item={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
          ) : isError ? (
            <EmptyState
              icon="alert-circle-outline"
              title={t("legal_requests_load_error")}
              actionLabel={t("common_try_again")}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState icon="shield-checkmark-outline" title={t("legal_no_requests")} />
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMoreHistory && !isFetching && setHistoryPage((p) => p + 1)}
        ListFooterComponent={isFetching && historyPage > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
        refreshControl={<RefreshControl refreshing={isFetching && historyPage === 1} onRefresh={() => refetch()} />}
      />
    </View>
  );
}
