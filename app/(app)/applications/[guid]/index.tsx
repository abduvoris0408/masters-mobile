import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { LocationMap } from "@/components/ui/LocationMap";
import { Skeleton } from "@/components/ui/Skeleton";
import { Body, CardTitle, ScreenTitle, SectionTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useAcceptOfferMutation,
  useApplicationDetailQuery,
  useUpdateApplicationMutation,
} from "@/services/application";
import type { IApplicationOffer } from "@/types";
import { formatAddress, formatDate, formatPhoneNumber, formatPrice } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

function OfferRow({
  offer,
  isOpen,
  onAccept,
  accepting,
}: {
  offer: IApplicationOffer;
  isOpen: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const OFFER_STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    pending: { label: t("offer_status_pending"), tone: "warning" },
    accepted: { label: t("offer_status_accepted"), tone: "success" },
    rejected: { label: t("offer_status_rejected"), tone: "danger" },
  };
  const statusMeta = OFFER_STATUS_META[offer.status] ?? { label: offer.status, tone: "neutral" as ChipTone };

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar uri={offer.master.photo} name={offer.master.name} size={44} />
        <View className="flex-1 gap-0.5">
          <CardTitle>{offer.master.name}</CardTitle>
          <Text className="text-xs text-muted">{formatPhoneNumber(offer.master.phone)}</Text>
        </View>
        <Chip label={statusMeta.label} tone={statusMeta.tone} />
      </View>

      <View className="flex-row items-center justify-between rounded-xl bg-background px-3 py-2.5">
        <Text className="text-xs text-muted">{t("offer_price_label")}</Text>
        <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
          {formatPrice(Number(offer.price))}
        </Text>
      </View>

      {offer.comment ? <Text className="text-sm leading-5 text-foreground">{offer.comment}</Text> : null}

      <Text className="text-xs text-muted">{formatDate(offer.created_at)}</Text>

      {offer.status === "pending" && isOpen ? (
        <Pressable
          disabled={accepting}
          onPress={onAccept}
          className="flex-row items-center justify-center gap-2 rounded-full bg-accent py-3"
        >
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {t("offer_accept_button")}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </Card>
  );
}

export default function ApplicationManageScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useApplicationDetailQuery(guid ?? null);
  const updateMutation = useUpdateApplicationMutation();
  const acceptOfferMutation = useAcceptOfferMutation();

  const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
    open: { label: t("status_open"), tone: "success" },
    new: { label: t("status_open"), tone: "success" },
    in_progress: { label: t("status_in_progress"), tone: "warning" },
    closed: { label: t("status_closed"), tone: "neutral" },
    cancelled: { label: t("status_cancelled"), tone: "danger" },
  };

  const isOpenStatus = data?.status === "open" || data?.status === "new";
  const statusMeta = data ? STATUS_META[data.status] ?? { label: data.status, tone: "neutral" as ChipTone } : null;

  const confirmCancel = () => {
    if (!guid) return;
    Alert.alert(
      t("cancel_application_confirm_title"),
      t("cancel_application_confirm_message"),
      [
        { text: t("common_no"), style: "cancel" },
        {
          text: t("common_cancel"),
          style: "destructive",
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({ guid, data: { status: "cancelled" } });
              showSuccess(t("cancel_application_success"));
            } catch {
              showError(t("cancel_application_error"));
            }
          },
        },
      ],
    );
  };

  const handleAccept = async (offerGuid: string) => {
    try {
      await acceptOfferMutation.mutateAsync(offerGuid);
      showSuccess(t("offer_accept_success"));
    } catch {
      showError(t("offer_accept_error"));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("application_details_header")} onBackPress={() => router.back()} />

      {isLoading ? (
        <View className="gap-4 px-4" style={{ paddingTop: headerHeight + 12 }}>
          <View className="flex-row gap-2">
            <Skeleton width={80} height={26} radius={13} />
            <Skeleton width={100} height={26} radius={13} />
          </View>
          <Skeleton width="85%" height={24} />
          <Skeleton height={60} />
          <Skeleton height={160} radius={20} />
          <Skeleton height={140} radius={24} />
        </View>
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title={t("application_not_found")} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10" contentContainerStyle={{ paddingTop: headerHeight + 12 }}>
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              <Chip label={data.category.name} tone="info" />
              {data.is_urgent ? <Chip label={t("field_urgent")} tone="danger" icon="alarm-outline" /> : null}
              {statusMeta ? <Chip label={statusMeta.label} tone={statusMeta.tone} /> : null}
            </View>
            <ScreenTitle className="text-xl">{data.title}</ScreenTitle>
            <Text className="text-sm leading-6 text-muted">{data.description}</Text>
          </View>

          {data.latitude && data.longitude ? (
            <LocationMap lat={Number(data.latitude)} lng={Number(data.longitude)} height={160} />
          ) : null}

          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">{t("field_address")}</Text>
              <Body style={{ fontFamily: GOLOS_WEIGHTS.medium }}>{formatAddress(data.address) || t("not_specified")}</Body>
            </View>
            <View className="flex-row items-center justify-between border-t border-border pt-3">
              <Text className="text-xs text-muted">{t("field_budget")}</Text>
              <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {data.budget_from === data.budget_to
                  ? formatPrice(Number(data.budget_from))
                  : `${formatPrice(Number(data.budget_from))} – ${formatPrice(Number(data.budget_to))}`}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-border pt-3">
              <Text className="text-xs text-muted">{t("field_date")}</Text>
              <Body style={{ fontFamily: GOLOS_WEIGHTS.medium }}>{formatDate(data.created_at)}</Body>
            </View>
          </Card>

          {isOpenStatus ? (
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push(`/applications/${data.guid}/edit`)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-surface py-3"
              >
                <Ionicons name="pencil-outline" size={16} color={colors.foreground} />
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {t("common_edit")}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCancel}
                disabled={updateMutation.isPending}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-red-50 py-3 dark:bg-danger/15"
              >
                <Ionicons name="ban-outline" size={16} color={colors.danger} />
                <Text className="text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {t("common_cancel")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="gap-2">
            <SectionTitle className="px-1">{t("offers_section_title")}</SectionTitle>
            <Text className="px-1 text-xs text-muted">{t("offers_section_subtitle")}</Text>

            {!data.offers || data.offers.length === 0 ? (
              <EmptyState icon="people-outline" title={t("offers_empty_title")} description={t("offers_empty_description")} />
            ) : (
              data.offers.map((offer) => (
                <OfferRow
                  key={offer.guid}
                  offer={offer}
                  isOpen={isOpenStatus}
                  onAccept={() => handleAccept(offer.guid)}
                  accepting={acceptOfferMutation.isPending}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
