import { useAuthStore, useOnboardingStore } from "@/stores";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuth = useAuthStore((s) => s.isAuth);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  if (!authHydrated || !onboardingHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  // First launch (unauthenticated + onboarding never completed) lands on the
  // onboarding carousel instead of jumping straight to /login.
  if (!isAuth && !hasSeenOnboarding) return <Redirect href="/(onboarding)" />;

  if (!isAuth) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
