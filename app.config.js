// Converted from app.json to app.config.js only so the Android Google Maps
// API key (react-native-maps' native dependency — no key, no tiles) can be
// read from .env at build/start time. Everything else is a literal port of
// the previous app.json's "expo" object, unchanged.
module.exports = {
  expo: {
    name: "masters-mobile",
    slug: "masters-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "mastersmobile",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "uz.masters.mobile",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      package: "uz.masters.mobile",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-status-bar",
      "expo-secure-store",
      "expo-localization",
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-image-picker",
        {
          photosPermission: "Rasm tanlash uchun galereyaga ruxsat kerak.",
        },
      ],
      "expo-video",
      "@react-native-community/datetimepicker",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 160,
          resizeMode: "contain",
          backgroundColor: "#F5F5F5",
          dark: {
            image: "./assets/splash-icon.png",
            backgroundColor: "#181B24",
          },
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Joriy joylashuvingizni xaritada ko'rsatish uchun ruxsat kerak.",
        },
      ],
      [
        "expo-build-properties",
        {
          // Preview/internal-test APKs only need to run on real, modern
          // phones — dropping armeabi-v7a/x86/x86_64 native libs (emulator +
          // legacy-device architectures) cuts the universal APK from ~110MB
          // down to roughly a quarter of that. Play Store release builds use
          // an .aab instead, which already splits per-ABI automatically, so
          // this filter only matters for the directly-installable APK.
          // NOTE: the expo-build-properties key is `buildArchs`, not
          // `abiFilters` — the latter is silently ignored (no error, no
          // effect), which is why earlier builds stayed at ~110MB despite
          // this block being present.
          android: {
            buildArchs: ["arm64-v8a"],
          },
          // @react-native-firebase v22+ requires static frameworks on iOS —
          // its Swift pods don't build against the default dynamic linking.
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "868fff5d-dac7-47fd-9fad-7651e5169f6a",
      },
    },
  },
};
