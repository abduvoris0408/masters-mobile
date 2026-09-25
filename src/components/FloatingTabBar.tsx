import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { MoreSheet, type MoreSheetHandle } from "@/components/MoreSheet";
import { Avatar } from "@/components/ui/Avatar";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useAuthStore } from "@/stores";

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "home", inactive: "home-outline" },
  orders: { active: "bag-handle", inactive: "bag-handle-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const SLOT_COUNT = 5;

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
  const moreSheetRef = useRef<MoreSheetHandle>(null);
  const { t } = useTranslation("common");

  const TAB_LABELS: Record<string, string> = {
    index: t("tab_home"),
    orders: t("my_orders"),
    profile: t("profile"),
  };

  const routes = state.routes;
  const findRoute = (name: string) => routes.find((r: (typeof routes)[number]) => r.name === name);

  // Drag-to-select across the pill (iOS Photos/Camera-style continuous
  // touch): press down anywhere on the bar — no long-press delay, the hit
  // test fires immediately on touch-down — and slide across slots without
  // lifting; whichever slot is under the finger highlights live, a
  // selection haptic fires once per new slot crossed (not every frame), and
  // releasing over a slot activates it exactly like tapping it would.
  //
  // Slot x-ranges and the current hover index live in UI-thread shared
  // values (not useRef) so the whole hit-test + highlight loop runs natively
  // via useAnimatedStyle, with zero JS-thread round trips while dragging.
  // useRef would get captured as a frozen snapshot the first time a worklet
  // closes over it — shared values are the mechanism Reanimated actually
  // supports for cross-thread reads/writes.
  const slotStarts = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const slotEnds = useSharedValue<number[]>(new Array(SLOT_COUNT).fill(0));
  const hoverIndex = useSharedValue<number>(-1);

  // Plain JS, invoked via runOnJS only at meaningful transitions (a new slot
  // hovered, or the finger lifted) — not on every onUpdate tick — so the
  // JS/native bridge only carries the two events a native switcher actually
  // triggers on: a haptic per crossing, and the final activation.
  const slotActions = useRef<(() => void)[]>([]);
  const fireHaptic = () => Haptics.selectionAsync().catch(() => undefined);
  const activate = (index: number) => slotActions.current[index]?.();

  // Plain JS — onLayout fires on the JS thread. Shared values are safe to
  // write from either thread (that's their purpose), so no "worklet" here.
  const registerSlotLayout = (slotIndex: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    const starts = [...slotStarts.value];
    starts[slotIndex] = x;
    slotStarts.value = starts;
    const ends = [...slotEnds.value];
    ends[slotIndex] = x + width;
    slotEnds.value = ends;
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      "worklet";
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (e.x >= slotStarts.value[i] && e.x < slotEnds.value[i]) {
          hoverIndex.value = i;
          runOnJS(fireHaptic)();
          return;
        }
      }
      hoverIndex.value = -1;
    })
    .onUpdate((e) => {
      "worklet";
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (e.x >= slotStarts.value[i] && e.x < slotEnds.value[i]) {
          if (hoverIndex.value !== i) {
            hoverIndex.value = i;
            runOnJS(fireHaptic)();
          }
          return;
        }
      }
      hoverIndex.value = -1;
    })
    .onEnd((e) => {
      "worklet";
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (e.x >= slotStarts.value[i] && e.x < slotEnds.value[i]) {
          runOnJS(activate)(i);
          break;
        }
      }
      hoverIndex.value = -1;
    })
    .onFinalize(() => {
      "worklet";
      hoverIndex.value = -1;
    });

  const usePillStyle = (slotIndex: number, isFocused: boolean) =>
    useAnimatedStyle(() => ({
      opacity: isFocused || hoverIndex.value === slotIndex ? 1 : 0,
    }));

  const renderTab = (route: (typeof routes)[number] | undefined, slotIndex: number) => {
    if (!route) return null;
    const index = routes.indexOf(route);
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const icons = TAB_ICONS[route.name] ?? TAB_ICONS.index;
    const label = (options.title as string) ?? TAB_LABELS[route.name] ?? route.name;
    const isProfile = route.name === "profile";
    // eslint-disable-next-line react-hooks/rules-of-hooks -- slotIndex/isFocused are stable per render position, not a runtime-varying list
    const pillStyle = usePillStyle(slotIndex, isFocused);

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        Haptics.selectionAsync().catch(() => undefined);
        navigation.navigate(route.name);
      }
    };
    slotActions.current[slotIndex] = onPress;

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLayout={registerSlotLayout(slotIndex)}
        className="flex-1 items-center justify-center"
      >
        <View className="items-center justify-center">
          <Animated.View
            pointerEvents="none"
            className="absolute rounded-full bg-emerald-50"
            style={[styles.activePill, pillStyle, isDark && { backgroundColor: "rgba(52,211,153,0.16)" }]}
          />
          <View className="items-center justify-center gap-1.5 px-2.5 py-1.5">
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
          </View>
        </View>
      </Pressable>
    );
  };

  const moreHoverStyle = usePillStyle(3, false);

  slotActions.current[2] = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    router.push("/applications/create");
  };
  slotActions.current[3] = () => {
    Haptics.selectionAsync().catch(() => undefined);
    moreSheetRef.current?.present();
  };

  const tabRow = (
    <View style={styles.pillRow}>
      {renderTab(findRoute("index"), 0)}
      {renderTab(findRoute("orders"), 1)}

      <View style={styles.addSlot} onLayout={registerSlotLayout(2)}>
        <Pressable
          onPress={slotActions.current[2]}
          className="items-center justify-center rounded-full bg-accent"
          style={styles.addButton}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <Pressable
        onPress={slotActions.current[3]}
        onLayout={registerSlotLayout(3)}
        className="flex-1 items-center justify-center"
      >
        <View className="items-center justify-center">
          <Animated.View
            pointerEvents="none"
            className="absolute rounded-full bg-emerald-50"
            style={[styles.activePill, moreHoverStyle, isDark && { backgroundColor: "rgba(52,211,153,0.16)" }]}
          />
          <View className="items-center justify-center gap-1.5 px-2.5 py-1.5">
            <Ionicons name="grid-outline" size={22} color={colors.muted} />
            <Text style={{ fontFamily: GOLOS_WEIGHTS.regular, fontSize: 10, color: colors.muted }}>{t("more_sheet_title")}</Text>
          </View>
        </View>
      </Pressable>

      {renderTab(findRoute("profile"), 4)}
    </View>
  );

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom - 4, 4) }]}>
        {/* Android: expo-blur's blur only works when the blurred content is
            wrapped in a <BlurTargetView>, which isn't wired up here — without
            it BlurView just renders as a plain translucent layer, i.e. a
            washed-out bar. A solid tinted pill sidesteps that. */}
        {Platform.OS === "android" ? (
          <View style={[styles.pill, { backgroundColor: isDark ? "rgba(20,20,24,0.96)" : "rgba(255,255,255,0.96)" }]}>
            <GestureDetector gesture={panGesture}>{tabRow}</GestureDetector>
          </View>
        ) : (
          <BlurView
            intensity={55}
            tint={isDark ? "dark" : "light"}
            style={[styles.pill, { backgroundColor: isDark ? "rgba(20,20,24,0.38)" : "rgba(255,255,255,0.4)" }]}
          >
            <GestureDetector gesture={panGesture}>{tabRow}</GestureDetector>
          </BlurView>
        )}
      </View>

      <MoreSheet ref={moreSheetRef} />
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
    minWidth: 68,
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
