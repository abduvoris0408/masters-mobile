import "@/lib/i18n/i18n";
import "@/lib/axios";
import "@/styles/global.css";

import {
  GolosText_400Regular,
  GolosText_500Medium,
  GolosText_600SemiBold,
  GolosText_700Bold,
  GolosText_800ExtraBold,
  GolosText_900Black,
  useFonts,
} from "@expo-google-fonts/golos-text";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Toast } from "@/components/Toast";
import { applyGolosAsDefaultFont } from "@/lib/theme/fonts";
import { ChatSocketProvider } from "@/providers/ChatSocketProvider";
// Temporarily disabled — @react-native-firebase is a native module and
// Expo Go can't load it (Metro can't resolve its native-module imports
// outside a custom dev-client/EAS build). Re-enable once testing moves to
// a dev-client/build instead of Expo Go.
// import { PushNotificationsProvider } from "@/providers/PushNotificationsProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep the native splash (app.config.js's expo-splash-screen block) up
// until fonts are ready, instead of hiding it on first frame and then
// showing a bare spinner screen behind it — that swap (native splash →
// spinner → real UI) reads as a stutter. Holding it through font load means
// the native splash dissolves straight into the real UI.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GolosText_400Regular,
    GolosText_500Medium,
    GolosText_600SemiBold,
    GolosText_700Bold,
    GolosText_800ExtraBold,
    GolosText_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  applyGolosAsDefaultFont();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <ActionSheetProvider>
              <BottomSheetModalProvider>
                <ChatSocketProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(onboarding)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" />
                  </Stack>
                  <Toast />
                </ChatSocketProvider>
              </BottomSheetModalProvider>
            </ActionSheetProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
