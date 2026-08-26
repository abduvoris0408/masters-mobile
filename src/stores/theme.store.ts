import AsyncStorage from "@react-native-async-storage/async-storage";
import { ETheme } from "@/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Preference the user picked (mirrors web's useThemeDetector/ThemeSwitcher).
// SYSTEM defers to the OS via useColorScheme() — see ThemeProvider, which is
// what actually applies `preference` to NativeWind's color scheme.
interface IThemeStore {
  preference: ETheme;
  setPreference: (p: ETheme) => void;
}

export const useThemeStore = create<IThemeStore>()(
  persist(
    (set) => ({
      preference: ETheme.SYSTEM,
      setPreference: (preference) => set({ preference }),
    }),
    { name: "theme-storage", storage: createJSONStorage(() => AsyncStorage) }
  )
);
