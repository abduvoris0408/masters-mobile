import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppLanguage = "uz" | "ru" | "en";

// The app's UI (screenshots, copy, every ported screen) is designed uz-first —
// unlike the device locale, which on an English-language iPhone would otherwise
// silently flip every screen to the en/*.json fallback strings. Persisted so a
// choice made in Settings survives restarts instead of resetting to "uz" each launch.
interface ILanguageStore {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<ILanguageStore>()(
  persist(
    (set) => ({
      language: "uz",
      setLanguage: (language) => set({ language }),
    }),
    { name: "language-storage", storage: createJSONStorage(() => AsyncStorage) }
  )
);
