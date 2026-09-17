import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/FloatingTabBar";

// Bottom navigation follows mobile-design.md §2a: a floating glass pill with
// a raised center "+" action, rendered by FloatingTabBar instead of the
// default flush-to-edge tab bar. The sidebar drawer this layout used to own
// was retired along with the hamburger menu — every screen now uses a
// search icon (top-level catalog tabs) or a back button (everything else),
// per mobile-design.md's header spec.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Asosiy" }} />
      <Tabs.Screen name="orders" options={{ title: "Buyurtmalarim" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
