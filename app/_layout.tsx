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
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GolosText_400Regular,
    GolosText_500Medium,
    GolosText_600SemiBold,
    GolosText_700Bold,
    GolosText_800ExtraBold,
    GolosText_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

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
