// Mirrors the web project's src/constants/routes.ts, trimmed to the screens
// that exist in this app so far and adapted to Expo Router paths (route
// groups like `(auth)`/`(app)` don't appear in the URL). Extend this as each
// further milestone (catalog, orders, chat, ...) adds its own screens.
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  OTP: "/otp",
  FORGOT_PASSWORD: "/forgot-password",

  MASTERS_CATALOG: "/masters-catalog",
  ORDERS: "/orders",
  CHAT: "/chat",
  PROFILE: "/profile",
} as const;
