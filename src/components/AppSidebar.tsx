import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { useLogoutMutation } from "@/services/auth";
import { useAuthStore } from "@/stores";

const MENU_ITEMS: { href: "/" | "/masters-catalog" | "/orders" | "/chat" | "/profile"; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: "/", label: "Bosh sahifa", icon: "home-outline" },
  { href: "/masters-catalog", label: "Mutaxassislar", icon: "construct-outline" },
  { href: "/orders", label: "Buyurtmalar", icon: "briefcase-outline" },
  { href: "/chat", label: "Xabarlar", icon: "chatbubble-outline" },
  { href: "/profile", label: "Profil", icon: "person-outline" },
];

interface AppSidebarProps {
  onNavigate: () => void;
}

// Sidebar content shown inside the shared <Drawer/> (see DrawerProvider) —
// mirrors the reference app's menu pattern: avatar/identity up top, plain
// menu list, sign-out pinned at the bottom.
export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const logoutMutation = useLogoutMutation();

  const go = (href: (typeof MENU_ITEMS)[number]["href"]) => {
    router.push(href);
    onNavigate();
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center gap-3 px-5 pb-6">
        <Avatar name={user?.first_name} size={52} />
        <View>
          <Text className="text-base font-semibold text-white">
            {user ? `${user.first_name} ${user.last_name}` : ""}
          </Text>
          <Text className="text-sm text-white/60">{user?.phone}</Text>
        </View>
      </View>

      <View className="border-t border-white/10 pt-2">
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Pressable
              key={item.href}
              onPress={() => go(item.href)}
              className={`flex-row items-center gap-3 px-5 py-3.5 ${active ? "bg-white/10" : ""}`}
            >
              <Ionicons name={item.icon} size={20} color={active ? "#FFFFFF" : "rgba(255,255,255,0.7)"} />
              <Text className={`text-base ${active ? "font-semibold text-white" : "text-white/80"}`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <Pressable
        className="flex-row items-center gap-3 px-5 py-3.5"
        onPress={() => {
          onNavigate();
          logoutMutation.mutate();
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
        <Text className="text-base text-white/80">Chiqish</Text>
      </Pressable>
    </View>
  );
}
