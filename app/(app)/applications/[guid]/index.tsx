import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { LocationMap } from "@/components/ui/LocationMap";
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

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  open: { label: "Ochiq", tone: "success" },
  new: { label: "Ochiq", tone: "success" },
  in_progress: { label: "Jarayonda", tone: "warning" },
  closed: { label: "Yopilgan", tone: "neutral" },
  cancelled: { label: "Bekor qilingan", tone: "danger" },
};

const OFFER_STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  pending: { label: "Kutilmoqda", tone: "warning" },
  accepted: { label: "Qabul qilingan", tone: "success" },
  rejected: { label: "Rad etilgan", tone: "danger" },
};

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
  const colors = useThemeColors();
  const statusMeta = OFFER_STATUS_META[offer.status] ?? { label: offer.status, tone: "neutral" as ChipTone };

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar uri={offer.master.photo} name={offer.master.name} size={44} />
        <View className="flex-1 gap-0.5">
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {offer.master.name}
          </Text>
          <Text className="text-xs text-muted">{formatPhoneNumber(offer.master.phone)}</Text>
        </View>
        <Chip label={statusMeta.label} tone={statusMeta.tone} />
      </View>

      <View className="flex-row items-center justify-between rounded-xl bg-background px-3 py-2.5">
        <Text className="text-xs text-muted">Taklif narxi</Text>
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
                Qabul qilish
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </Card>
  );
}

export default function ApplicationManageScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useApplicationDetailQuery(guid ?? null);
  const updateMutation = useUpdateApplicationMutation();
  const acceptOfferMutation = useAcceptOfferMutation();

  const isOpenStatus = data?.status === "open" || data?.status === "new";
  const statusMeta = data ? STATUS_META[data.status] ?? { label: data.status, tone: "neutral" as ChipTone } : null;

  const confirmCancel = () => {
    if (!guid) return;
    Alert.alert(
      "Elon bekor qilinsinmi?",
      "Bekor qilingan elon takliflarni qabul qilmaydi va qayta faollashtirilmaydi.",
      [
        { text: "Yo'q", style: "cancel" },
        {
          text: "Bekor qilish",
          style: "destructive",
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({ guid, data: { status: "cancelled" } });
              showSuccess("Elon bekor qilindi");
            } catch {
              showError("Elonni bekor qilishda xatolik yuz berdi");
            }
          },
        },
      ],
    );
  };

  const handleAccept = async (offerGuid: string) => {
    try {
      await acceptOfferMutation.mutateAsync(offerGuid);
      showSuccess("Taklif qabul qilindi");
    } catch {
      showError("Taklifni qabul qilishda xatolik yuz berdi");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Elon tafsilotlari" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Elon topilmadi" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10" contentContainerStyle={{ paddingTop: headerHeight + 12 }}>
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              <Chip label={data.category.name} tone="info" />
              {data.is_urgent ? <Chip label="Shoshilinch" tone="danger" icon="alarm-outline" /> : null}
              {statusMeta ? <Chip label={statusMeta.label} tone={statusMeta.tone} /> : null}
            </View>
            <Text className="text-xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
              {data.title}
            </Text>
            <Text className="text-sm leading-6 text-muted">{data.description}</Text>
          </View>

          {data.latitude && data.longitude ? (
            <LocationMap lat={Number(data.latitude)} lng={Number(data.longitude)} height={160} />
          ) : null}

          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">Manzil</Text>
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                {formatAddress(data.address) || "Ko'rsatilmagan"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-border pt-3">
              <Text className="text-xs text-muted">Byudjet</Text>
              <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {data.budget_from === data.budget_to
                  ? formatPrice(Number(data.budget_from))
                  : `${formatPrice(Number(data.budget_from))} – ${formatPrice(Number(data.budget_to))}`}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-border pt-3">
              <Text className="text-xs text-muted">Sana</Text>
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                {formatDate(data.created_at)}
              </Text>
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
                  Tahrirlash
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCancel}
                disabled={updateMutation.isPending}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-red-50 py-3 dark:bg-danger/15"
              >
                <Ionicons name="ban-outline" size={16} color={colors.danger} />
                <Text className="text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Bekor qilish
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="px-1 text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              Takliflar
            </Text>
            <Text className="px-1 text-xs text-muted">Mutaxassislar tomonidan ushbu elonga yuborilgan takliflar</Text>

            {!data.offers || data.offers.length === 0 ? (
              <EmptyState icon="people-outline" title="Hali taklif yo'q" description="Mutaxassislar hali taklif yubormagan" />
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
