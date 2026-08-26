import AsyncStorage from "@react-native-async-storage/async-storage";
import type { IAuthStore } from "@/types/stores";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface IAuthStoreRN extends IAuthStore {
  // AsyncStorage reads are async, unlike web's synchronous localStorage —
  // screens must wait for this before trusting `isAuth`/`accessToken` (see
  // app/(app)/_layout.tsx and app/(auth)/_layout.tsx).
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

// Ported from the web project's stores/auth/auth.store.ts. logout() no longer
// hard-redirects via window.location — the (app) layout's auth guard reacts
// to `isAuth` flipping false and redirects with expo-router's <Redirect>.
export const useAuthStore = create<IAuthStoreRN>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuth: false,
      isInitiated: true,
      hasHydrated: false,

      setAuth: (user, { access_token, refresh_token }) =>
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuth: true }),

      setToken: ({ access_token, refresh_token }) =>
        set({ accessToken: access_token, refreshToken: refresh_token }),

      setUser: (user) => set({ user }),
      setIsAuth: (isAuth) => set({ isAuth }),
      setIsInitiated: (isInitiated) => set({ isInitiated }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuth: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuth: state.isAuth,
      }),
    }
  )
);
