import { ENDPOINTS } from "@/constants";
import i18n from "@/lib/i18n/i18n";
import { useAuthStore } from "@/stores";
import { extractFirstFieldError } from "@/utils/errors";
import { showError } from "@/utils/toast";
import type { InternalAxiosRequestConfig } from "axios";
import { axiosInstance } from "./axios";

// Ported unchanged from the web project's lib/axios/interceptors.ts — same
// refresh/401 concurrency logic (queueing, single in-flight refresh, public
// auth 401s never trigger logout). Only the error-surfacing call site changed
// (@/utils/toast instead of @/utils/messages, an antd-App-context toast).
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function notifyApiError(error: unknown, config?: RetryConfig) {
  const method = config?.method?.toLowerCase();
  if (!method || method === "get") return;
  if (config?.url === ENDPOINTS.AUTH.REFRESH) return;
  if (config?.silentError) return;
  showError(extractFirstFieldError(error, i18n.t("error", { ns: "common" })));
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushQueue(token: string | null, error: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)));
  pendingQueue = [];
}

const PUBLIC_AUTH_URLS: string[] = [
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REGISTER,
  ENDPOINTS.AUTH.REFRESH,
  ENDPOINTS.AUTH.OTP_VERIFY,
  ENDPOINTS.AUTH.OTP_RESEND,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.RESET_PASSWORD,
];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryConfig | undefined;

    if (config?.url && PUBLIC_AUTH_URLS.includes(config.url)) {
      notifyApiError(error, config);
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      config.url === ENDPOINTS.AUTH.REFRESH
    ) {
      if (error.response?.status === 401 && useAuthStore.getState().isAuth) {
        useAuthStore.getState().logout();
      } else {
        notifyApiError(error, config);
      }
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      if (useAuthStore.getState().isAuth) useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            config._retry = true;
            config.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(config));
          },
          reject,
        });
      });
    }

    config._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axiosInstance.post<{ access: string; refresh?: string }>(
        ENDPOINTS.AUTH.REFRESH,
        { refresh: refreshToken }
      );
      useAuthStore.getState().setToken({
        access_token: data.access,
        refresh_token: data.refresh ?? refreshToken,
      });
      flushQueue(data.access, null);
      config.headers.Authorization = `Bearer ${data.access}`;
      return axiosInstance(config);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
