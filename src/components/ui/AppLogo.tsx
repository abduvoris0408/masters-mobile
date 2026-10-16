import { Image, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

// The app icon (green tile with the hammer) — same artwork as the launcher
// icon in app.config.js.
export function AppLogo({ size = 30 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      accessibilityIgnoresInvertColors
    />
  );
}

// Logo + "Masters" wordmark for the header's left slot on Asosiy. The brand
// name isn't translated.
export function AppBrand() {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2" accessible accessibilityLabel="Masters">
      <AppLogo />
      <Text style={{ fontFamily: GOLOS_WEIGHTS.bold, fontSize: 18, color: colors.foreground }}>Masters</Text>
    </View>
  );
}
