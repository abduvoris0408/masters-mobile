import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoreSheet } from "@/components/MoreSheet";
import { Avatar } from "@/components/ui/Avatar";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useAuthStore } from "@/stores";

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "home", inactive: "home-outline" },
  orders: { active: "bag-handle", inactive: "bag-handle-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const TAB_LABELS: Record<string, string> = {
  index: "Asosiy",
  orders: "Buyurtmalarim",
  profile: "Profil",
};

// Suzuvchi (floating) pill tab bar per mobile-design.md §2a: 5 slots —
// Asosiy, Buyurtmalar, a raised "+" (create listing), Ko'proq (opens the
// MoreSheet — not a route, per the web project's MobileTabBar/MobileMoreSheet
// split), Profil. Only index/orders/profile are real Tabs.Screen routes;
// "+" and "Ko'proq" are plain buttons spliced into the render list at their
// designed positions so they don't need (and don't get) their own route.
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const [moreVisible, setMoreVisible] = useState(false);

  const routes = state.routes;
  const findRoute = (name: string) => routes.find((r: (typeof routes)[number]) => r.name === name);

  const renderTab = (route: (typeof routes)[number] | undefined) => {
    if (!route) return null;
    const index = routes.indexOf(route);
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const icons = TAB_ICONS[route.name] ?? TAB_ICONS.index;
    const label = (options.title as string) ?? TAB_LABELS[route.name] ?? route.name;
    const isProfile = route.name === "profile";

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable key={route.key} onPress={onPress} className="flex-1 items-center justify-center gap-1.5">
        {isFocused ? (
          <View
            className="absolute rounded-full bg-emerald-50"
            style={[styles.activePill, isDark && { backgroundColor: "rgba(52,211,153,0.16)" }]}
          />
        ) : null}
        {isProfile && user ? (
          <Avatar uri={undefined} name={user.first_name} size={22} />
        ) : (
          <Ionicons name={isFocused ? icons.active : icons.inactive} size={22} color={isFocused ? colors.accent : colors.muted} />
        )}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: isFocused ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.regular,
            fontSize: 10,
            color: isFocused ? colors.accent : colors.muted,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom - 4, 4) }]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 55 : 100}
          tint={isDark ? "dark" : "light"}
          style={[styles.pill, { backgroundColor: isDark ? "rgba(20,20,24,0.38)" : "rgba(255,255,255,0.4)" }]}
        >
          <View style={styles.pillRow}>
            {renderTab(findRoute("index"))}
            {renderTab(findRoute("orders"))}

            <View style={styles.addSlot}>
              <Pressable
                onPress={() => router.push("/applications/create")}
                className="items-center justify-center rounded-full bg-accent"
                style={styles.addButton}
              >
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable onPress={() => setMoreVisible(true)} className="flex-1 items-center justify-center gap-1.5">
              <Ionicons name="grid-outline" size={22} color={colors.muted} />
              <Text style={{ fontFamily: GOLOS_WEIGHTS.regular, fontSize: 10, color: colors.muted }}>Ko'proq</Text>
            </Pressable>

            {renderTab(findRoute("profile"))}
          </View>
        </BlurView>
      </View>

      <MoreSheet visible={moreVisible} onClose={() => setMoreVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 10,
    right: 10,
    alignItems: "center",
  },
  pill: {
    width: "100%",
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(15,23,42,1)",
        shadowOpacity: 0.16,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 12 },
    }),
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  addSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    shadowColor: "#059669",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  activePill: {
    width: 44,
    height: 30,
  },
});
