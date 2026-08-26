import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

const SHADOW = {
  shadowColor: "#171421",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

interface CardProps extends ViewProps {}

// Base elevated surface — white rounded-3xl block, softly shadowed, on the
// tinted page background. Every list-item/section card in the app composes
// this instead of repeating the same utility classes everywhere.
export function Card({ className, style, ...rest }: CardProps) {
  return <View className={`rounded-3xl bg-surface p-5 ${className ?? ""}`} style={[SHADOW, style]} {...rest} />;
}

interface PressableCardProps extends PressableProps {
  className?: string;
}

export function PressableCard({ className, style, ...rest }: PressableCardProps) {
  return (
    <Pressable
      className={`rounded-3xl bg-surface p-5 ${className ?? ""}`}
      style={[SHADOW, style as object]}
      {...rest}
    />
  );
}
