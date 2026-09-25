import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { BadgeLabel, CardTitle, ScreenTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useCreateOrderMutation } from "@/services/application";
import { useUserServicePreviewQuery } from "@/services/contract";
import { EChatMessageType, type IAgreementContractContent, type IUserServiceCatalogServiceDetail } from "@/types";
import { useAuthStore } from "@/stores";
import { useSendChatInvite } from "@/services/chat";
import { formatPrice } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

interface Props {
  /** Real user pk of the master (catalog's `user_id`, not the catalog row's
   *  own id) — used to auto-drop a chat invite once the order is created. */
  masterUserId: number;
}

export interface CreateOrderModalHandle {
  present: (service: IUserServiceCatalogServiceDetail) => void;
}

export const CreateOrderModal = forwardRef<CreateOrderModalHandle, Props>(function CreateOrderModal(
  { masterUserId },
  ref,
) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const createOrderMutation = useCreateOrderMutation();
  const sendInvite = useSendChatInvite();

  const [service, setService] = useState<IUserServiceCatalogServiceDetail | null>(null);
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<"form" | "contract">("form");
  const [succeeded, setSucceeded] = useState(false);

  const { data: preview, isLoading: previewLoading } = useUserServicePreviewQuery(
    step === "contract" ? (service?.guid ?? null) : null,
  );

  const content = useMemo<IAgreementContractContent | null>(() => {
    if (!preview?.content) return null;
    try {
      return JSON.parse(preview.content);
    } catch {
      return null;
    }
  }, [preview?.content]);

  useImperativeHandle(ref, () => ({
    present: (nextService) => {
      setService(nextService);
      setAddress("");
      setComment("");
      setStep("form");
      setSucceeded(false);
      sheetRef.current?.present();
    },
  }));

  const onClose = () => sheetRef.current?.dismiss();

  const handleContinue = () => {
    if (!address.trim()) {
      showError(t("create_order_address_required"));
      return;
    }
    if (!comment.trim()) {
      showError(t("create_order_comment_required"));
      return;
    }
    setStep("contract");
  };

  const handleConfirm = async () => {
    if (!service) return;
    try {
      const order = await createOrderMutation.mutateAsync({
        user_service: service.id,
        address: address.trim(),
        comment: comment.trim(),
      });
      setSucceeded(true);
      setTimeout(onClose, 2000);
      // Never target chat/start at the current user themselves — a worker
      // could otherwise reach this modal from their own service list.
      if (masterUserId !== currentUserId) {
        sendInvite({ user: masterUserId }, { type: EChatMessageType.ORDER_INVITE, order: order.id }).catch(() => {});
      }
    } catch {
      showError(t("create_order_error"));
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["88%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <View className="px-5">
        <View className="mb-4 flex-row items-center justify-between">
          <ScreenTitle>{step === "contract" ? t("create_order_contract_title") : t("create_order_title")}</ScreenTitle>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      {service && succeeded ? (
        <View className="items-center gap-3 py-8">
          <Ionicons name="checkmark-circle" size={52} color={colors.accent} />
          <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {t("create_order_success")}
          </Text>
        </View>
      ) : service && step === "form" ? (
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text className="mb-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            {service.service_name ?? t("create_order_service_fallback")}
          </Text>
          <View className="mb-4 self-start rounded-full bg-emerald-50 px-3 py-1 dark:bg-accent/15">
            <BadgeLabel className="text-accent">{formatPrice(Number(service.price))}</BadgeLabel>
          </View>

          <Text className="mb-1.5 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            {t("create_order_address_label")}
          </Text>
          <BottomSheetTextInput
            value={address}
            onChangeText={setAddress}
            placeholder={t("create_order_address_placeholder")}
            placeholderTextColor={colors.muted}
            className="mb-4 rounded-2xl bg-surface px-4 py-3 text-base text-foreground"
            style={{ color: colors.foreground }}
          />

          <Text className="mb-1.5 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            {t("create_order_comment_label")}
          </Text>
          <BottomSheetTextInput
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder={t("create_order_comment_placeholder")}
            placeholderTextColor={colors.muted}
            className="mb-5 rounded-2xl bg-surface px-4 py-3 text-base text-foreground"
            style={{ minHeight: 90, textAlignVertical: "top", color: colors.foreground }}
          />

          <Button onPress={handleContinue}>{t("common_continue")}</Button>
        </BottomSheetScrollView>
      ) : service && step === "contract" ? (
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {previewLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : !preview ? (
            <Text className="py-6 text-center text-sm text-muted">{t("create_order_contract_load_error")}</Text>
          ) : (
            <>
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons name="document-text-outline" size={18} color={colors.foreground} />
                <CardTitle className="flex-1">{preview.contract_title}</CardTitle>
              </View>

              <View className="mb-3 gap-2 rounded-2xl bg-surface p-3.5">
                {[
                  [t("create_order_contract_service_type"), preview.category?.name],
                  [t("create_order_contract_master"), [preview.master?.name, preview.master?.surname].filter(Boolean).join(" ")],
                  [t("create_order_contract_price"), formatPrice(Number(preview.price))],
                  [t("create_order_contract_address"), address],
                  ...(comment ? [[t("create_order_contract_comment"), comment]] : []),
                ].map(([label, value]) => (
                  <View key={label} className="flex-row items-start justify-between gap-3">
                    <Text className="text-xs text-muted">{label}</Text>
                    <Text className="flex-1 text-right text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>

              {content ? (
                <View className="mb-2 gap-2.5 rounded-2xl bg-background p-3.5">
                  {content.header ? <Text className="text-xs text-muted">{content.header}</Text> : null}
                  {[1, 2].map((n) => {
                    const title = content[`title${n}` as keyof IAgreementContractContent];
                    const body = content[`body${n}` as keyof IAgreementContractContent];
                    if (!title && !body) return null;
                    return (
                      <View key={n} className="gap-0.5">
                        {title ? (
                          <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                            {title}
                          </Text>
                        ) : null}
                        {body ? (
                          <Text className="text-xs leading-5 text-muted" numberOfLines={3}>
                            {body}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View className="mt-3 flex-row gap-2.5">
                <View className="flex-1">
                  <Button variant="outline" onPress={() => setStep("form")}>
                    {t("common_back")}
                  </Button>
                </View>
                <View className="flex-1">
                  <Button loading={createOrderMutation.isPending} onPress={handleConfirm}>
                    {t("create_order_agree")}
                  </Button>
                </View>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      ) : null}
    </BottomSheetModal>
  );
});
