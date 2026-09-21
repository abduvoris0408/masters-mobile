import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Gates the one-time onboarding carousel shown before the auth stack. Persisted
// so a user who already swiped through it never sees it again after restart,
// mirroring auth.store's hasHydrated pattern (root layout waits for hydration
// before deciding whether to redirect into onboarding).
interface IOnboardingStore {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  setHasSeenOnboarding: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useOnboardingStore = create<IOnboardingStore>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasHydrated: false,
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
    }
  )
);
