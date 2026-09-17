import { useColorScheme } from "nativewind";

// Mirrors src/styles/global.css's CSS custom properties and tailwind.config.js's
// static tokens — kept in JS too because a few things (Ionicons' `color` prop,
// RN's core Animated.View) can't consume Tailwind classes and need a literal
// hex. Keep these three in sync when a token's value changes.
//
// `accent` (emerald, #059669/#34d399) is the tab-bar/CTA "action" color from
// the reference screens — deliberately distinct from `primary`, which is a
// slightly darker green used for nav/active-state (mobile-design.md §3).
const LIGHT = {
  background: "#F5F5F5",
  surface: "#FFFFFF",
  foreground: "#171421",
  muted: "#79748A",
  border: "#E8E6F0",
  primary: "#16A34A",
  accent: "#059669",
  danger: "#DC2626",
};

const DARK = {
  background: "#181B24",
  surface: "#232733",
  foreground: "#F0EFF5",
  muted: "#9C96AF",
  border: "#2A2E3A",
  primary: "#22C55E",
  accent: "#34D399",
  danger: "#F87171",
};

export type ThemeColorKey = keyof typeof LIGHT;

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? DARK : LIGHT;
}
