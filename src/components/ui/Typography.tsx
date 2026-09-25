import { Text, type TextProps } from "react-native";

import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

// Shared text roles — every screen should compose these instead of inlining
// className="text-sm ..." + style={{ fontFamily: GOLOS_WEIGHTS.x }} ad-hoc.
// Fixing a role's size/weight here fixes it everywhere it's used.

// Full-screen title (used inside Header) and detail-page hero titles.
export function ScreenTitle({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-xl text-foreground ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.bold }, style]}
      {...rest}
    />
  );
}

// Section headings inside a screen (card/group titles like "Personal info").
export function SectionTitle({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-lg text-foreground ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.bold }, style]}
      {...rest}
    />
  );
}

// Primary label for a tappable row with a leading icon tile and trailing
// chevron (profile menu rows, MoreSheet rows, settings rows, list rows).
export function ListLabel({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-lg text-foreground ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.medium }, style]}
      {...rest}
    />
  );
}

// Card/item title (listing card, entity name) — one notch below ScreenTitle.
export function CardTitle({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-base text-foreground ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.bold }, style]}
      {...rest}
    />
  );
}

// Small badge/chip/tab-pill text.
export function BadgeLabel({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-sm ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.semibold }, style]}
      {...rest}
    />
  );
}

// Regular body copy.
export function Body({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-base text-foreground ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.regular }, style]}
      {...rest}
    />
  );
}

// Muted helper/caption text (field labels, secondary lines, hints).
export function Caption({ className, style, ...rest }: TextProps) {
  return (
    <Text
      className={`text-sm text-muted ${className ?? ""}`}
      style={[{ fontFamily: GOLOS_WEIGHTS.medium }, style]}
      {...rest}
    />
  );
}
