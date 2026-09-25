import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { BadgeLabel, CardTitle, Caption, ScreenTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { useOrganizationCatalogDetailQuery } from "@/services/organization";
import { useCreateJoinRequestMutation } from "@/services/organization-join-request";
import { formatDate, formatPhoneNumber } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const LEGAL_FORM_KEY: Record<string, string> = {
  mchj: "mchj",
  yatt: "yatt",
  xk: "xk",
  aj: "aj",
  other: "other",
};

export default function OrganizationDetailScreen() {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError, refetch } = useOrganizationCatalogDetailQuery(guid ?? null);
  const { isIndividualMaster } = useProfilePerspective();
  const createJoinRequestMutation = useCreateJoinRequestMutation();

  const handleSendJoinRequest = () => {
    if (!data) return;
    Alert.alert(t("org_detail_join_request_title"), t("org_detail_join_request_message"), [
      { text: t("common_cancel"), style: "cancel" },
      {
        text: t("org_detail_join_request_send"),
        onPress: async () => {
          try {
            await createJoinRequestMutation.mutateAsync({ organization: data.id });
            showSuccess(t("org_detail_join_request_success"));
          } catch {
            showError(t("org_detail_join_request_error"));
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("org_detail_title")} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="alert-circle-outline"
            title={t("org_detail_not_found")}
            description={t("common_retry_description")}
            actionLabel={t("common_retry_action")}
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-4"
          contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 32 }}
        >
          <Card className="items-center gap-2">
            <Avatar uri={data.logo} name={data.name} size={72} />
            <ScreenTitle className="text-xl" numberOfLines={2}>
              {data.name}
            </ScreenTitle>
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-background px-3 py-1">
                <Caption>
                  {LEGAL_FORM_KEY[data.legal_form] ? t(`org_detail_legal_form_${LEGAL_FORM_KEY[data.legal_form]}`) : data.legal_form}
                </Caption>
              </View>
              {data.is_verified ? (
                <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 dark:bg-accent/15">
                  <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                  <BadgeLabel className="text-accent">{t("org_detail_verified")}</BadgeLabel>
                </View>
              ) : null}
            </View>
          </Card>

          {data.description ? (
            <Card className="gap-2">
              <Caption className="text-sm">{t("org_detail_about_label")}</Caption>
              <Text className="text-base leading-6 text-foreground">{data.description}</Text>
            </Card>
          ) : null}

          {data.categories.length > 0 ? (
            <Card className="gap-3">
              <Caption className="text-sm">{t("org_detail_categories_label")}</Caption>
              <View className="flex-row flex-wrap gap-2">
                {data.categories.map((category) => (
                  <Chip key={category.guid} label={category.name} />
                ))}
              </View>
            </Card>
          ) : null}

          <Card className="gap-3">
            <Caption className="text-sm">{t("org_detail_info_label")}</Caption>
            <View className="gap-2.5">
              {(data.operates_regions && data.regions) || (data.operates_districts && data.districts) ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="location-outline" size={16} color={colors.muted} />
                  <Text className="flex-1 text-sm text-foreground">
                    {[
                      data.operates_regions && data.regions ? data.regions : null,
                      data.operates_districts && data.districts ? data.districts : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              ) : null}
              {data.director_phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${data.director_phone}`)}
                  className="flex-row items-center gap-2"
                >
                  <Ionicons name="call-outline" size={16} color={colors.accent} />
                  <CardTitle className="flex-1 text-accent">{formatPhoneNumber(data.director_phone)}</CardTitle>
                </Pressable>
              ) : null}
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                <Text className="flex-1 text-sm text-foreground">
                  {t("org_detail_on_platform_since", { date: formatDate(data.created_at) })}
                </Text>
              </View>
            </View>
          </Card>

          {data.intro_videos.length > 0 ? (
            <Card className="gap-3">
              <Caption className="text-sm">{t("org_detail_intro_videos_label")}</Caption>
              {data.intro_videos.map((url) => (
                <Pressable
                  key={url}
                  onPress={() => Linking.openURL(url)}
                  className="flex-row items-center gap-2 rounded-2xl bg-background px-3.5 py-3"
                >
                  <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                  <Caption className="flex-1 text-sm text-foreground">{t("org_detail_watch_video")}</Caption>
                  <Ionicons name="open-outline" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </Card>
          ) : null}

          {isIndividualMaster ? (
            <Button loading={createJoinRequestMutation.isPending} onPress={handleSendJoinRequest}>
              {t("org_detail_send_join_request")}
            </Button>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
