import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { PressableCard } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLogoutMutation } from "@/services/auth";
import { useAuthStore } from "@/stores";
import { formatPhoneNumber } from "@/utils/format";

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-center gap-3 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <View className="flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <PressableCard className="flex-row items-center gap-3" onPress={onPress}>
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-accent/15">
        <Ionicons name={icon} size={17} color={colors.accent} />
      </View>
      <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </PressableCard>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();
  const { masterProfile, isWorker, isOrganization, organization } = useProfilePerspective();

  const addressLabel = masterProfile
    ? [masterProfile.region?.name, masterProfile.district?.name].filter(Boolean).join(", ")
    : null;

  const displayName = isOrganization && organization ? organization.name : user ? `${user.first_name} ${user.last_name}` : "";

  const confirmLogout = () => {
    Alert.alert(t("logout_confirm_title"), t("logout_confirm_message"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("screen_title")} onBackPress={() => router.push("/")} />

      <ScrollView
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 140 }}
      >
        {/* Avatar */}
        <View className="items-center gap-3">
          <View>
            {isOrganization && organization?.logo ? (
              <Image source={{ uri: organization.logo }} style={{ width: 140, height: 140, borderRadius: 70 }} />
            ) : user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 140, height: 140, borderRadius: 70 }} />
            ) : (
              <View
                className="items-center justify-center rounded-full bg-emerald-100"
                style={{ width: 140, height: 140 }}
              >
                <Text className="text-5xl font-bold text-primary">
                  {(displayName.trim()?.[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push("/profile/edit")}
              hitSlop={8}
              className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-surface"
              style={{ shadowColor: "#0F172A", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}
            >
              <Ionicons name="pencil" size={17} color={colors.foreground} />
            </Pressable>
          </View>
          <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {displayName}
          </Text>
          {isOrganization ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-accent/15">
              <Ionicons name="business" size={13} color={colors.accent} />
              <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("organization_badge")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Level card */}
        {masterProfile?.level ? (
          <View className="gap-3 rounded-3xl bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15">
                <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">{t("master_level_label")}</Text>
                <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {masterProfile.level.current.name}
                </Text>
              </View>
            </View>
            {masterProfile.level.next ? (
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted">
                    {t("level_orders_count", { count: masterProfile.completed_orders_count, total: masterProfile.level.next.min_orders })}
                  </Text>
                  <Text className="text-xs text-muted">
                    {Math.min(
                      100,
                      Math.round((masterProfile.completed_orders_count / masterProfile.level.next.min_orders) * 100),
                    )}
                    %
                  </Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full bg-background">
                  <View
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((masterProfile.completed_orders_count / masterProfile.level.next.min_orders) * 100),
                      )}%`,
                    }}
                  />
                </View>
                <Text className="text-xs text-muted">
                  {t("level_remaining_orders", {
                    level: masterProfile.level.next.name,
                    count: Math.max(0, masterProfile.level.next.min_orders - masterProfile.completed_orders_count),
                  })}
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-muted">{t("level_max_reached")}</Text>
            )}
          </View>
        ) : null}

        {/* Personal info */}
        <View className="rounded-3xl bg-surface p-5">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {t("personal_info_title")}
            </Text>
            <Pressable
              onPress={() => router.push("/profile/edit")}
              hitSlop={8}
              className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-accent/15"
            >
              <Ionicons name="pencil" size={13} color={colors.accent} />
              <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("edit")}
              </Text>
            </Pressable>
          </View>
          <InfoRow icon="person-outline" label={t("name")} value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()} />
          <InfoRow icon="call-outline" label={t("phone_number")} value={formatPhoneNumber(user?.phone)} />
          {addressLabel ? (
            <InfoRow icon="location-outline" label={t("address")} value={addressLabel} isLast />
          ) : user?.email ? (
            <InfoRow icon="mail-outline" label={t("email")} value={user.email} isLast />
          ) : null}
        </View>

        {/* Worker / organization management shortcuts */}
        {masterProfile ? (
          <View className="gap-2.5">
            {isOrganization ? (
              <NavRow icon="people-outline" label={t("nav_specialists")} onPress={() => router.push("/profile/specialists")} />
            ) : null}
            <NavRow icon="images-outline" label={t("nav_portfolio")} onPress={() => router.push("/profile/portfolio")} />
            <NavRow icon="construct-outline" label={t("nav_services")} onPress={() => router.push("/profile/services")} />
            <NavRow
              icon="document-attach-outline"
              label={t("nav_documents")}
              onPress={() => router.push("/profile/documents")}
            />
            <NavRow
              icon="videocam-outline"
              label={t("nav_intro_video")}
              onPress={() => router.push("/profile/intro-video")}
            />
            <NavRow icon="wallet-outline" label={t("nav_balance")} onPress={() => router.push("/more/balance")} />
            <NavRow
              icon="paper-plane-outline"
              label={isOrganization ? t("nav_join_requests_org") : t("nav_join_requests_master")}
              onPress={() => router.push("/profile/join-requests")}
            />
          </View>
        ) : (
          <View className="gap-2.5">
            <NavRow icon="wallet-outline" label={t("nav_balance")} onPress={() => router.push("/more/balance")} />
          </View>
        )}

        {!isWorker ? (
          <View className="gap-2.5">
            <NavRow icon="construct-outline" label={t("nav_switch_to_master")} onPress={() => router.push("/master-onboarding")} />
            <NavRow
              icon="business-outline"
              label={t("nav_switch_to_organization")}
              onPress={() => router.push("/organization-onboarding")}
            />
          </View>
        ) : null}

        <PressableCard className="flex-row items-center gap-3" onPress={confirmLogout} disabled={logoutMutation.isPending}>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-danger/15">
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
          </View>
          <Text className="flex-1 text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {logoutMutation.isPending ? t("logging_out") : t("logout")}
          </Text>
        </PressableCard>
      </ScrollView>
    </View>
  );
}
