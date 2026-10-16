import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, View, type GestureResponderEvent, type PressableProps } from "react-native";

interface HeaderIconButtonProps extends PressableProps {
  children: ReactNode;
}

// Plain icon button for the native header's left/right slots (search, menu,
// settings, notification bell). No border or fill of its own — iOS 26 wraps
// header items in Liquid Glass itself, and the Material top bar on Android
// uses bare icons too.
export function HeaderIconButton({ children, style, onPress, ...rest }: HeaderIconButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress?.(e);
  };

  return (
    <Pressable
      hitSlop={8}
      onPress={handlePress}
      className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
      style={style}
      {...rest}
    >
      <View>{children}</View>
    </Pressable>
  );
}
