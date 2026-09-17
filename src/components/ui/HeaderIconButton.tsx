import { useColorScheme } from "nativewind";
import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";

interface HeaderIconButtonProps extends PressableProps {
  children: ReactNode;
}

// Shared "glass pill" circular button used for every Header slot (back,
// search, menu, notification bell) so they all render at the same size and
// visual weight instead of the bell looking like a bare icon next to a
// bordered back button.
export function HeaderIconButton({ children, style, ...rest }: HeaderIconButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      hitSlop={8}
      className={`h-11 w-11 items-center justify-center rounded-full border ${isDark ? "border-white/10 bg-white/10" : "border-white/60 bg-white/55"}`}
      style={style}
      {...rest}
    >
      <View>{children}</View>
    </Pressable>
  );
}
