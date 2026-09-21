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
    },
    android: {
      package: "uz.masters.mobile",
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
      [
        "expo-image-picker",
        {
          photosPermission: "Rasm tanlash uchun galereyaga ruxsat kerak.",
        },
      ],
      "expo-video",
      "@react-native-community/datetimepicker",
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Joriy joylashuvingizni xaritada ko'rsatish uchun ruxsat kerak.",
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
