import { useOnboardingStore } from "@/stores";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function OnboardingLayout() {
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (hasSeenOnboarding) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
