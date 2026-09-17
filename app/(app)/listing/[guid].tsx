import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { Rating } from "@/components/ui/Rating";
import { StaticMap } from "@/components/ui/StaticMap";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useCreateOfferMutation } from "@/services/application";
import { useApplicationPublicDetailQuery } from "@/services/application";
import { useAuthStore } from "@/stores";
import { EUserType } from "@/types";
import { formatDate, formatPrice, fromNow } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const STATUS_LABEL: Record<string, string> = {
  open: "Ochiq",
  new: "Ochiq",
  in_progress: "Jarayonda",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
  closed: "Yopilgan",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#059669",
  new: "#059669",
  in_progress: "#D97706",
  completed: "#2563EB",
  cancelled: "#DC2626",
  closed: "#79748A",
};

function DetailRow({ label, value, index }: { label: string; value: React.ReactNode; index: number }) {
  return (
    <View
      className={`gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-3 ${index % 2 === 1 ? "bg-background" : "bg-surface"}`}
    >
      <Text className="text-sm text-muted sm:w-[130px]" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
        {label}
      </Text>
      <View className="flex-1">{typeof value === "string" ? <Text className="text-sm text-foreground">{value}</Text> : value}</View>
    </View>
  );
}

export default function ListingDetailScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useApplicationPublicDetailQuery(guid ?? null);
  const user = useAuthStore((s) => s.user);
  const createOfferMutation = useCreateOfferMutation();

  const [offerVisible, setOfferVisible] = useState(false);
  const [price, setPrice] = useState("");
  const [comment, setComment] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const isOwnListing = !!data && !!user && data.customer.guid === (user as { guid?: string }).guid;
  const isOpenStatus = data?.status === "open" || data?.status === "new";
  const canOffer = !!data && isOpenStatus && !isOwnListing && user?.user_type === EUserType.WORKER;

  const submitOffer = async () => {
    if (!data) return;
    const numericPrice = Number(price.replace(/\D/g, ""));
    if (!numericPrice) {
      showError("Narxingizni kiriting");
      return;
    }
    if (!comment.trim()) {
      showError("Izoh kiriting");
      return;
    }
    try {
      await createOfferMutation.mutateAsync({ application: data.id, price: numericPrice, comment: comment.trim() });
      setSucceeded(true);
      showSuccess("Taklif muvaffaqiyatli yuborildi");
      setTimeout(() => {
        setOfferVisible(false);
        router.push("/");
      }, 1600);
    } catch {
      showError("Taklif yuborishda xatolik yuz berdi");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Taklif yuborish" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Elon topilmadi" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerClassName="gap-4 px-4 pb-6"
            contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: canOffer ? 120 : 32 }}
          >
            {/* Title + meta */}
            <View className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {data.title}
                </Text>
                <View className="rounded-full bg-amber-100 px-3 py-1.5 dark:bg-amber-500/20">
                  <Text className="text-xs text-amber-700 dark:text-amber-400" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    {data.budget_from === data.budget_to
                      ? formatPrice(Number(data.budget_from))
                      : `${formatPrice(Number(data.budget_from))} – ${formatPrice(Number(data.budget_to))}`}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[data.status] ?? colors.muted }} />
                  <Text className="text-xs text-muted">{STATUS_LABEL[data.status] ?? data.status}</Text>
                </View>
                <Text className="text-xs text-muted">·</Text>
                <Text className="text-xs text-muted">{fromNow(data.created_at)} joylashtirilgan</Text>
                {data.views_count ? (
                  <>
                    <Text className="text-xs text-muted">·</Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="eye-outline" size={12} color={colors.muted} />
                      <Text className="text-xs text-muted">{data.views_count} marta ko'rildi</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <View className="flex-row flex-wrap gap-2">
                <Chip label={data.category.name} tone="info" />
                {data.is_urgent ? <Chip label="Shoshilinch" tone="danger" icon="alarm-outline" /> : null}
              </View>
            </View>

            {data.latitude && data.longitude ? (
              <StaticMap lat={Number(data.latitude)} lng={Number(data.longitude)} height={180} />
            ) : null}

            {/* Spec table */}
            <View className="overflow-hidden rounded-3xl border border-border">
              <DetailRow index={0} label="Manzil" value={data.address || "Ko'rsatilmagan"} />
              <DetailRow
                index={1}
                label="Bajarish muddati"
                value={
                  data.date_from
                    ? `${formatDate(data.date_from)}${data.date_to && data.date_to !== data.date_from ? ` – ${formatDate(data.date_to)}` : ""}`
                    : data.is_urgent
                      ? "Shoshilinch"
                      : "Muddat belgilanmagan"
                }
              />
              <DetailRow
                index={2}
                label="Byudjet"
                value={
                  data.budget_from === data.budget_to
                    ? formatPrice(Number(data.budget_from))
                    : `${formatPrice(Number(data.budget_from))} – ${formatPrice(Number(data.budget_to))}`
                }
              />
              <DetailRow
                index={3}
                label="To'lov"
                value={
                  data.payment_type === "escrow"
                    ? "Xavfsiz bitim (escrow)"
                    : "Ish yakunlangach, to'g'ridan-to'g'ri mutaxassisga"
                }
              />
              <DetailRow
                index={4}
                label="Tavsif"
                value={
                  <View className="rounded-xl bg-background p-3">
                    <Text className="text-sm leading-5 text-foreground">{data.description}</Text>
                  </View>
                }
              />
              {data.additional_works && data.additional_works.length > 0 ? (
                <DetailRow
                  index={5}
                  label="Qo'shimcha"
                  value={
                    <View className="flex-row flex-wrap gap-1.5">
                      {data.additional_works.map((w) => (
                        <Chip key={w.id} label={w.name} tone="neutral" />
                      ))}
                    </View>
                  }
                />
              ) : null}
              {data.images && data.images.length > 0 ? (
                <DetailRow
                  index={6}
                  label="Rasmlar"
                  value={
                    <View className="flex-row flex-wrap gap-2">
                      {data.images.map((img) => (
                        <Image
                          key={img.id}
                          source={{ uri: img.image }}
                          className="rounded-xl border border-border"
                          style={{ width: 72, height: 72 }}
                        />
                      ))}
                    </View>
                  }
                />
              ) : null}
              {data.offers_count > 0 ? (
                <View className="flex-row items-center justify-end gap-2 border-t border-border px-4 py-3">
                  <Ionicons name="people-outline" size={16} color={colors.muted} />
                  <Text className="text-sm text-foreground">
                    <Text style={{ fontFamily: GOLOS_WEIGHTS.bold }}>{data.offers_count} ta mutaxassis</Text> taklif yubordi
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Post your own job banner */}
            <Pressable
              onPress={() => router.push("/applications/create")}
              className="gap-1.5 rounded-3xl bg-surface p-5"
            >
              <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                O'zingiz ham ish joylashtirmoqchimisiz?
              </Text>
              <Text className="text-sm text-muted">
                Masters orqali uy-ro'zg'or va ta'mirlash ishlaringiz uchun tez va ishonchli mutaxassis toping.
              </Text>
              <View className="mt-1 flex-row items-center gap-1">
                <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Ish joylashtirish
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} />
              </View>
            </Pressable>

            {/* Customer card */}
            <Pressable className="flex-row items-center gap-3 rounded-3xl bg-surface p-5">
              <Avatar name={data.customer.name} size={48} />
              <View className="flex-1 gap-1">
                <Text className="text-xs text-muted">Buyurtmachi</Text>
                <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {data.customer.name} {data.customer.surname}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <Rating value={data.customer.rating} />
                  <Text className="text-xs text-muted">({data.customer.reviews_count} sharh)</Text>
                </View>
                <View className="mt-1 flex-row items-center gap-1.5 border-t border-border pt-2">
                  <Ionicons name="clipboard-outline" size={14} color={colors.muted} />
                  <Text className="text-xs text-muted">{data.customer.applications_count} ta joylashtirilgan ish</Text>
                </View>
              </View>
            </Pressable>

            {/* Safety tip */}
            <View className="flex-row items-start gap-2.5 rounded-3xl bg-emerald-50 p-4 dark:bg-accent/10">
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <Text className="flex-1 text-xs leading-5 text-foreground">
                Taklif yuborishdan oldin ish tafsilotlarini diqqat bilan o'qib chiqing
              </Text>
            </View>
          </ScrollView>

          {/* Floating CTA */}
          {canOffer ? (
            <Pressable
              onPress={() => setOfferVisible(true)}
              className="absolute inset-x-4 flex-row items-center gap-3 rounded-2xl bg-accent px-4 shadow-lg"
              style={{ bottom: 24, height: 56 }}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
              </View>
              <Text className="flex-1 text-base text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                Taklif yuborish
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {/* Offer form sheet */}
          <Modal visible={offerVisible} transparent animationType="slide" onRequestClose={() => setOfferVisible(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="flex-1 justify-end"
            >
              <Pressable className="flex-1" onPress={() => setOfferVisible(false)} />
              <View className="gap-4 rounded-t-3xl bg-background p-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                    Taklif yuborish
                  </Text>
                  <Pressable onPress={() => setOfferVisible(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.muted} />
                  </Pressable>
                </View>

                {succeeded ? (
                  <View className="items-center gap-2 py-6">
                    <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
                    <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                      Taklif muvaffaqiyatli yuborildi
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextField
                      label="Sizning narxingiz"
                      value={price}
                      onChangeText={setPrice}
                      placeholder="masalan, 150 000"
                      keyboardType="number-pad"
                    />
                    <TextField
                      label="Izoh"
                      value={comment}
                      onChangeText={setComment}
                      placeholder="Taklifingiz va muddatlarni tasvirlab bering"
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      style={{ height: 90, textAlignVertical: "top", paddingTop: 12 }}
                    />
                    <Button loading={createOfferMutation.isPending} onPress={submitOffer}>
                      Taklif yuborish
                    </Button>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}
    </View>
  );
}
