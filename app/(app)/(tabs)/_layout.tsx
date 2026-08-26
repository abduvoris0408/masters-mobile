import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import type { ColorValue } from "react-native";

import { AppSidebar } from "@/components/AppSidebar";
import { Drawer } from "@/components/ui/Drawer";
import { useThemeColors } from "@/lib/theme/colors";
import { DrawerProvider, useAppDrawer } from "@/providers/DrawerProvider";

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "home", inactive: "home-outline" },
  "masters-catalog": { active: "construct", inactive: "construct-outline" },
  orders: { active: "briefcase", inactive: "briefcase-outline" },
  chat: { active: "chatbubble", inactive: "chatbubble-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

function TabIcon({ route, focused, color }: { route: string; focused: boolean; color: ColorValue }) {
  return <Ionicons name={focused ? TAB_ICONS[route].active : TAB_ICONS[route].inactive} size={22} color={color} />;
}

function TabsWithDrawer() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors();
  const { visible, close } = useAppDrawer();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: isDark ? "#0F0D14" : "#FFFFFF",
            borderTopColor: isDark ? "#2A2636" : "#E8E6F0",
            height: 64,
            paddingTop: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Bosh sahifa", tabBarIcon: (p) => <TabIcon route="index" {...p} /> }}
        />
        <Tabs.Screen
          name="masters-catalog"
          options={{ title: "Mutaxassislar", tabBarIcon: (p) => <TabIcon route="masters-catalog" {...p} /> }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: "Buyurtmalar", tabBarIcon: (p) => <TabIcon route="orders" {...p} /> }}
        />
        <Tabs.Screen name="chat" options={{ title: "Xabarlar", tabBarIcon: (p) => <TabIcon route="chat" {...p} /> }} />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profil", tabBarIcon: (p) => <TabIcon route="profile" {...p} /> }}
        />
      </Tabs>
      <Drawer visible={visible} onClose={close}>
        <AppSidebar onNavigate={close} />
      </Drawer>
    </>
  );
}

// Placeholder tab bar for the foundation milestone — enough structure to
// navigate between the protected areas. Visual design follows the reference
// screens provided for the app (see AppSidebar/Header/ui components).
export default function TabsLayout() {
  return (
    <DrawerProvider>
      <TabsWithDrawer />
    </DrawerProvider>
  );
}
