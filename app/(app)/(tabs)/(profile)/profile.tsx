import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Card, PressableCard } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionTitle } from "@/components/ui/Typography";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLogoutMutation } from "@/services/auth";
import { useAuthStore } from "@/stores";
import { formatPhoneNumber } from "@/utils/format";
import { ProfileAvatar, useAvatarPicker } from "./_profile/ProfileAvatar";
import { InfoRow, NavRow } from "./_profile/ProfileRows";

export default function ProfileScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();
  const { masterProfile, isWorker, isOrganization, isIndividualMaster, organization, isLoading } = useProfilePerspective();

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

  const avatarPicker = useAvatarPicker();
  const fullName = [user?.last_name, user?.first_name, user?.middle_name].filter(Boolean).join(" ");

  // At most 4 rows, in priority order, skipping empty ones — a master sees
  // name/phone/address/experience; a client (no address or experience) gets
  // email/account status in those slots instead.
  const INFO_ROW_LIMIT = 4;
  const infoRows = (
    [
      { key: "name", icon: "person-outline", label: t("full_name"), value: fullName },
      { key: "phone", icon: "call-outline", label: t("phone_number"), value: formatPhoneNumber(user?.phone) },
      { key: "address", icon: "location-outline", label: t("address"), value: addressLabel ?? "" },
      {
        key: "experience",
        icon: "briefcase-outline",
        label: t("experience_level"),
        value: masterProfile?.experience_level?.name ?? "",
      },
      { key: "email", icon: "mail-outline", label: t("email"), value: user?.email ?? "" },
      {
        key: "status",
        icon: user?.is_verified ? "shield-checkmark-outline" : "shield-outline",
        label: t("account_status"),
        value: user ? (user.is_verified ? t("account_verified") : t("account_not_verified")) : "",
      },
    ] satisfies { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[]
  )
    .filter((row) => row.value.trim() !== "")
    .slice(0, INFO_ROW_LIMIT);

  const level = masterProfile?.level ?? null;
  const levelPercent =
    level?.next && level.next.min_orders > 0
      ? Math.min(100, Math.round((masterProfile!.completed_orders_count / level.next.min_orders) * 100))
      : 100;

  const roleBadge = isOrganization
    ? { icon: "business" as const, label: t("organization_badge"), accent: true }
    : isIndividualMaster
      ? { icon: "construct" as const, label: t("master_badge"), accent: true }
      : { icon: "person" as const, label: t("client_badge"), accent: false };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("screen_title")} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
      >
        {isLoading ? (
          <>
            <View className="flex-row items-center gap-4 rounded-3xl bg-surface p-4">
              <Skeleton width={88} height={88} radius={44} />
              <View className="flex-1 gap-2">
                <Skeleton width="70%" height={18} />
                <Skeleton width="40%" height={14} />
              </View>
            </View>
            <Skeleton height={96} radius={24} />
            <Skeleton height={130} radius={24} />
            <Skeleton height={260} radius={24} />
          </>
        ) : (
          <>
        {/* Identity — avatar beside the name, like the account card at the
            top of iOS Settings. Nothing is drawn over the photo: tapping it
            or "Rasmni o'zgartirish" opens the picker. */}
        <Card className="flex-row items-center gap-4" style={{ padding: 20 }}>
          <ProfileAvatar
            displayName={displayName}
            isOrganization={isOrganization}
            organizationLogo={organization?.logo}
            onPress={isOrganization ? undefined : avatarPicker.open}
            pending={avatarPicker.isPending}
          />
          <View className="flex-1 gap-2">
            <SectionTitle numberOfLines={2}>{displayName}</SectionTitle>
            <View className="flex-row">
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${roleBadge.accent ? "bg-emerald-50 dark:bg-accent/15" : "bg-background"}`}
              >
                <Ionicons name={roleBadge.icon} size={12} color={roleBadge.accent ? colors.accent : colors.muted} />
                <Text
                  className={`text-xs ${roleBadge.accent ? "text-accent" : "text-muted"}`}
                  style={{ fontFamily: GOLOS_WEIGHTS.semibold }}
                >
                  {roleBadge.label}
                </Text>
              </View>
            </View>
            {!isOrganization ? (
              <Pressable
                onPress={avatarPicker.open}
                disabled={avatarPicker.isPending}
                hitSlop={6}
                className="flex-row items-center gap-1.5"
              >
                <Ionicons name="camera-outline" size={15} color={colors.accent} />
                <Text className="text-[13px] text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  {t("change_photo")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Card>

        {/* Master level — the level name and the % to the next one are the
            two numbers that matter, so they get the weight. */}
        {level ? (
          <Card className="gap-3" style={{ padding: 16 }}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-accent/15">
                <Ionicons name="shield-checkmark" size={19} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">{t("master_level_label")}</Text>
                <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {level.current.name}
                </Text>
              </View>
              {level.next ? (
                <Text className="text-lg text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {levelPercent}%
                </Text>
              ) : (
                <Ionicons name="trophy" size={20} color="#F59E0B" />
              )}
            </View>
            {level.next ? (
              <>
                <View className="h-2 overflow-hidden rounded-full bg-background">
                  <View className="h-full rounded-full bg-accent" style={{ width: `${levelPercent}%` }} />
                </View>
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs text-muted">
                    {t("level_orders_count", { count: masterProfile!.completed_orders_count, total: level.next.min_orders })}
                  </Text>
                  <Text className="flex-1 text-right text-xs text-muted" numberOfLines={1}>
                    {t("level_remaining_orders", {
                      level: level.next.name,
                      count: Math.max(0, level.next.min_orders - masterProfile!.completed_orders_count),
                    })}
                  </Text>
                </View>
              </>
            ) : (
              <Text className="text-xs text-muted">{t("level_max_reached")}</Text>
            )}
          </Card>
        ) : null}

        {/* Personal info — the name is already in the card above. */}
        <Card className="px-4 pb-1 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
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
          {infoRows.map((row, i) => (
            <InfoRow key={row.key} icon={row.icon} label={row.label} value={row.value} isLast={i === infoRows.length - 1} />
          ))}
        </Card>

        {/* Worker / organization management shortcuts */}
        {masterProfile ? (
          <Card>
            {isOrganization ? (
              <NavRow
                icon="people-outline"
                label={t("nav_specialists")}
                onPress={() => router.push("/profile/specialists")}
                color="#5AC8FA"
              />
            ) : null}
            <NavRow
              icon="images-outline"
              label={t("nav_portfolio")}
              onPress={() => router.push("/profile/portfolio")}
              color="#FF9500"
            />
            <NavRow
              icon="construct-outline"
              label={t("nav_services")}
              onPress={() => router.push("/profile/services")}
              color="#34C759"
            />
            <NavRow
              icon="document-attach-outline"
              label={t("nav_documents")}
              onPress={() => router.push("/profile/documents")}
              color="#5856D6"
            />
            <NavRow
              icon="videocam-outline"
              label={t("nav_intro_video")}
              onPress={() => router.push("/profile/intro-video")}
              color="#FF2D55"
            />
            <NavRow
              icon="wallet-outline"
              label={t("nav_balance")}
              onPress={() => router.push("/more/balance")}
              color="#30B0C7"
            />
            <NavRow
              icon="paper-plane-outline"
              label={isOrganization ? t("nav_join_requests_org") : t("nav_join_requests_master")}
              onPress={() => router.push("/profile/join-requests")}
              color="#AF52DE"
              isLast
            />
          </Card>
        ) : (
          <Card>
            <NavRow
              icon="wallet-outline"
              label={t("nav_balance")}
              onPress={() => router.push("/more/balance")}
              color="#30B0C7"
              isLast
            />
          </Card>
        )}

        {!isWorker ? (
          <Card>
            <NavRow
              icon="construct-outline"
              label={t("nav_switch_to_master")}
              onPress={() => router.push("/master-onboarding")}
              color="#34C759"
            />
            <NavRow
              icon="business-outline"
              label={t("nav_switch_to_organization")}
              onPress={() => router.push("/organization-onboarding")}
              color="#5AC8FA"
              isLast
            />
          </Card>
        ) : null}

        <PressableCard className="flex-row items-center gap-3" onPress={confirmLogout} disabled={logoutMutation.isPending}>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-danger/15">
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
          </View>
          <Text className="flex-1 text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {logoutMutation.isPending ? t("logging_out") : t("logout")}
          </Text>
        </PressableCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}
