import { useColorScheme } from "nativewind";

// Mirrors src/styles/global.css's CSS custom properties and tailwind.config.js's
// static tokens — kept in JS too because a few things (Ionicons' `color` prop,
// RN's core Animated.View) can't consume Tailwind classes and need a literal
// hex. Keep these three in sync when a token's value changes.
const LIGHT = {
  background: "#F6F5FA",
  surface: "#FFFFFF",
  foreground: "#171421",
  muted: "#79748A",
  border: "#E8E6F0",
  primary: "#6C5CE7",
  accent: "#22C55E",
};

const DARK = {
  background: "#0F0D14",
  surface: "#1A1722",
  foreground: "#F0EFF5",
  muted: "#9C96AF",
  border: "#2A2636",
  primary: "#6C5CE7",
  accent: "#22C55E",
};

export type ThemeColorKey = keyof typeof LIGHT;

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? DARK : LIGHT;
}
