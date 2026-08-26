import axios from "axios";

// Same opt-out as the web project's lib/axios/axios.ts — set on requests that
// are best-effort/background by design, so a failure there doesn't surface
// the global error toast for something the user didn't directly trigger.
declare module "axios" {
  export interface AxiosRequestConfig {
    silentError?: boolean;
  }
}

// Expo inlines `EXPO_PUBLIC_*` env vars into the bundle at build time — the
// RN equivalent of Vite's `import.meta.env.APP_API_URL` on web.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
