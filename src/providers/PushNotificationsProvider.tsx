import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import { router } from "expo-router";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { registerDeviceToken } from "@/services/device-token";
import { useAuthStore } from "@/stores";

// The backend's FCM `data` payload shape isn't discoverable from this repo
// (the web project only ever reads `payload.notification` for display, never
// `payload.data`, and has no tap-navigation at all) — rather than guess field
// names that might not match, every tap just opens the in-app notifications
// list, which already knows how to resolve each notification via the REST
// API. Swap this for a direct deep-link once the backend's data field names
// are confirmed.
function goToNotifications() {
  router.push("/notifications");
}

// Android 13+ requires the runtime POST_NOTIFICATIONS permission (missing on
// iOS, where requestPermission() alone covers it) — without it the FCM
// token still resolves but no notification ever displays.
async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "android" && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const authStatus = await requestPermission(getMessaging());
  return authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
}

// Mirrors the web project's PushNotifications.tsx: registers this device's
// FCM token with the backend whenever the user is authenticated (not just at
// login, so a rotated token still gets re-registered on a later app open),
// and re-registers on token refresh. Foreground messages are handled by
// react-native-firebase's own system tray display — unlike the web project,
// which has to manually call `new Notification(...)` since a focused browser
// tab suppresses FCM's default display, RN has no such suppression.
export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const isAuth = useAuthStore((s) => s.isAuth);

  useEffect(() => {
    if (!isAuth) return;

    let cancelled = false;

    const register = async () => {
      const granted = await ensurePermission();
      if (!granted || cancelled) return;
      const token = await getToken(getMessaging());
      if (!cancelled) await registerDeviceToken(token);
    };

    register();
    const unsubscribeRefresh = onTokenRefresh(getMessaging(), (token) => {
      registerDeviceToken(token);
    });

    return () => {
      cancelled = true;
      unsubscribeRefresh();
    };
  }, [isAuth]);

  // Tap-to-open, independent of auth state — a tap while signed out still
  // routes to /notifications, which itself redirects through the normal
  // auth guard rather than assuming a session here.
  useEffect(() => {
    getInitialNotification(getMessaging()).then((message) => {
      if (message) goToNotifications();
    });
    return onNotificationOpenedApp(getMessaging(), () => goToNotifications());
  }, []);

  return <>{children}</>;
}
