import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

interface CardProps extends ViewProps {}

// Base surface — flat rounded-3xl block in the grouped-cell color (white on
// the #F2F2F7 page, #1C1C1E on black), iOS-style: contrast comes from the
// fill alone, no drop shadow (shadows made the light theme look hazy). Every
// list-item/section card in the app composes this instead of repeating the
// same utility classes everywhere.
export function Card({ className, style, ...rest }: CardProps) {
  return <View className={`rounded-3xl bg-surface p-5 ${className ?? ""}`} style={style} {...rest} />;
}

interface PressableCardProps extends PressableProps {
  className?: string;
}

export function PressableCard({ className, style, ...rest }: PressableCardProps) {
  return (
    <Pressable
      className={`rounded-3xl bg-surface p-5 ${className ?? ""}`}
      style={style}
      {...rest}
    />
  );
}
