import { useColorScheme } from "nativewind";
import { useEffect, type PropsWithChildren } from "react";

import { useThemeStore } from "@/stores/theme.store";
import { ETheme } from "@/types";

// Web toggles dark mode by adding a `.dark` class to <html> (useDarkClass.ts)
// driven by the user's stored preference; NativeWind's setColorScheme does
// the same job here — SYSTEM defers to the OS scheme automatically.
export function ThemeProvider({ children }: PropsWithChildren) {
  const preference = useThemeStore((s) => s.preference);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(preference === ETheme.SYSTEM ? "system" : preference);
  }, [preference, setColorScheme]);

  return <>{children}</>;
}
