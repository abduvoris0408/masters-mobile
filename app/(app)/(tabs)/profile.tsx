import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { PressableCard } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { USER_ROLE_ID } from "@/constants";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLogoutMutation, useRoleUpdateMutation } from "@/services/auth";
import { useMasterProfileQuery } from "@/services/master";
import { useAuthStore } from "@/stores";
import { EUserType } from "@/types";
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
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();
  const roleUpdateMutation = useRoleUpdateMutation();
  const { data: profile } = useMasterProfileQuery();
  const masterProfile = profile?.master_profile ? profile : null;
  const isWorker = user?.user_type === EUserType.WORKER;

  const addressLabel = masterProfile
    ? [masterProfile.region?.name, masterProfile.district?.name].filter(Boolean).join(", ")
    : null;

  const confirmLogout = () => {
    Alert.alert("Chiqish", "Hisobingizdan chiqishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Chiqish", style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  const confirmSwitchRole = () => {
    const nextRole = isWorker ? EUserType.CLIENT : EUserType.WORKER;
    const roleIds = nextRole === EUserType.WORKER ? [USER_ROLE_ID.MASTER] : [USER_ROLE_ID.CLIENT];
    const title = isWorker ? "Mijoz profiliga qaytish" : "Mutaxassis profiliga o'tish";
    Alert.alert(title, "Rolingizni o'zgartirishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Tasdiqlash", onPress: () => roleUpdateMutation.mutate({ role: roleIds }) },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Profil" onBackPress={() => router.push("/")} />

      <ScrollView
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 140 }}
      >
        {/* Avatar */}
        <View className="items-center gap-3">
          <View>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 140, height: 140, borderRadius: 70 }} />
            ) : (
              <View
                className="items-center justify-center rounded-full bg-emerald-100"
                style={{ width: 140, height: 140 }}
              >
                <Text className="text-5xl font-bold text-primary">
                  {(user?.first_name?.trim()?.[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View
              className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-surface"
              style={{ shadowColor: "#0F172A", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}
            >
              <Ionicons name="pencil" size={17} color={colors.foreground} />
            </View>
          </View>
          <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {user ? `${user.first_name} ${user.last_name}` : ""}
          </Text>
        </View>

        {/* Level card */}
        {masterProfile?.level ? (
          <View className="gap-3 rounded-3xl bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15">
                <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">Mutaxassis darajasi</Text>
                <Text className="text-base text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {masterProfile.level.current.name}
                </Text>
              </View>
            </View>
            {masterProfile.level.next ? (
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted">
                    {masterProfile.completed_orders_count}/{masterProfile.level.next.min_orders} buyurtma
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
                  "{masterProfile.level.next.name}" darajasigacha yana{" "}
                  {Math.max(0, masterProfile.level.next.min_orders - masterProfile.completed_orders_count)} ta buyurtma
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-muted">Eng yuqori daraja qo'lga kiritildi</Text>
            )}
          </View>
        ) : null}

        {/* Personal info */}
        <View className="rounded-3xl bg-surface p-5">
          <Text className="mb-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            Shaxsiy ma'lumotlarim
          </Text>
          <InfoRow icon="person-outline" label="Ism" value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()} />
          <InfoRow icon="call-outline" label="Telefon raqam" value={formatPhoneNumber(user?.phone)} />
          {addressLabel ? (
            <InfoRow icon="location-outline" label="Manzil" value={addressLabel} isLast />
          ) : user?.email ? (
            <InfoRow icon="mail-outline" label="Email" value={user.email} isLast />
          ) : null}
        </View>

        {/* Worker management shortcuts */}
        {masterProfile ? (
          <View className="gap-2.5">
            <NavRow icon="images-outline" label="Portfolio" onPress={() => router.push("/profile/portfolio")} />
            <NavRow icon="construct-outline" label="Xizmatlar" onPress={() => router.push("/profile/services")} />
            <NavRow icon="document-attach-outline" label="Hujjatlar" onPress={() => router.push("/profile/documents")} />
            <NavRow icon="videocam-outline" label="Tanishtiruv video" onPress={() => router.push("/profile/intro-video")} />
            <NavRow icon="wallet-outline" label="Hisobim" onPress={() => router.push("/more/balance")} />
            <NavRow icon="paper-plane-outline" label="Tashkilotga so'rovlarim" onPress={() => router.push("/profile/join-requests")} />
          </View>
        ) : null}

        <NavRow
          icon={isWorker ? "person-outline" : "construct-outline"}
          label={isWorker ? "Mijoz profiliga qaytish" : "Mutaxassis profiliga o'tish"}
          onPress={confirmSwitchRole}
        />

        <PressableCard className="flex-row items-center gap-3" onPress={confirmLogout} disabled={logoutMutation.isPending}>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-danger/15">
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
          </View>
          <Text className="flex-1 text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {logoutMutation.isPending ? "Chiqilmoqda..." : "Chiqish"}
          </Text>
        </PressableCard>
      </ScrollView>
    </View>
  );
}
