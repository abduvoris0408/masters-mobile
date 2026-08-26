import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useLogoutMutation } from "@/services/auth";
import { useAuthStore } from "@/stores";
import { EUserType } from "@/types";
import { useAppDrawer } from "@/providers/DrawerProvider";

export default function ProfileScreen() {
  const { open } = useAppDrawer();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  return (
    <View className="flex-1 bg-background">
      <Header title="Profil" onMenuPress={open} />

      <View className="gap-4 px-4">
        <GradientCard style={{ alignItems: "center" }}>
          <Avatar uri={user?.avatar} name={user?.first_name} size={84} />
          <Text className="mt-3 text-xl text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {user ? `${user.first_name} ${user.last_name}` : ""}
          </Text>
          <Text className="mt-0.5 text-sm text-white/70">{user?.phone}</Text>
          {user ? (
            <View className="mt-3 rounded-full bg-white/20 px-4 py-1.5">
              <Text className="text-xs font-semibold text-white">
                {user.user_type === EUserType.WORKER ? "Mutaxassis" : "Buyurtmachi"}
              </Text>
            </View>
          ) : null}
        </GradientCard>

        <PressableCard
          className="flex-row items-center gap-3"
          onPress={() => logoutMutation.mutate()}
        >
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
            <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
          </View>
          <Text className="flex-1 text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {logoutMutation.isPending ? "Chiqilmoqda..." : "Chiqish"}
          </Text>
        </PressableCard>
      </View>
    </View>
  );
}
