import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, Text, type GestureResponderEvent, type PressableProps } from "react-native";

import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: string;
  loading?: boolean;
  /** solid = filled pill (the one main CTA per screen), outline = bordered, ghost = text-only. */
  variant?: "solid" | "outline" | "ghost";
  /** Which brand color a solid/outline button uses. Reference screens keep this
   *  rule strictly: accent (emerald) is the primary action, primary (a
   *  slightly darker green) is reserved for nav/tab/badge — never both as
   *  competing CTAs on one screen. */
  color?: "accent" | "primary";
}

const SPINNER_COLOR: Record<NonNullable<ButtonProps["color"]>, string> = {
  accent: "#FFFFFF",
  primary: "#FFFFFF",
};

export function Button({
  children,
  loading,
  disabled,
  variant = "solid",
  color = "accent",
  className,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const colorClass = color === "accent" ? "bg-accent" : "bg-primary";
  const textColorClass = color === "accent" ? "text-accent" : "text-primary";

  const styles =
    variant === "solid"
      ? colorClass
      : variant === "outline"
        ? `border-2 ${color === "accent" ? "border-accent" : "border-primary"} bg-transparent`
        : "bg-transparent";

  // Every Button tap fires the platform's native tap haptic (iOS Taptic
  // Engine / Android Vibrator) before the caller's own onPress — centralized
  // here so every CTA in the app gets it for free instead of each call site
  // wiring Haptics.impactAsync itself.
  const handlePress = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress?.(e);
  };

  return (
    <Pressable
      disabled={isDisabled}
      onPress={handlePress}
      className={`h-13 items-center justify-center rounded-full px-5 ${styles} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
      style={{ height: 52 }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "solid" ? SPINNER_COLOR[color] : "#16A34A"} />
      ) : (
        <Text
          className={`text-base ${variant === "solid" ? "text-white" : textColorClass}`}
          style={{ fontFamily: GOLOS_WEIGHTS.bold }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
