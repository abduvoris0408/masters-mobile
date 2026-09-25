import { useEffect, useRef, useState } from "react";
import { Linking } from "react-native";

import { fetchTelegramLoginStatus, useTelegramLoginMutation } from "@/services/auth";
import type { ITokens } from "@/types";

const POLL_INTERVAL_MS = 2000;

type TFlowStatus = "idle" | "waiting" | "error";

interface UseTelegramLoginFlowOptions {
  /** Fires once telegram-login-status comes back "confirmed", with the token pair and the phone the visitor sent the bot. */
  onConfirmed: (tokens: ITokens, phone: string) => void;
}

// Mirrors the web project's useTelegramLoginFlow: start() asks the backend
// for a one-time token + bot deep link, opens the Telegram app directly
// (native has no "scan this QR on another device" case — the phone already
// has Telegram), then polls telegram-login-status with that token every
// POLL_INTERVAL_MS until the visitor confirms inside the bot. Polling stops
// on unmount, on confirmation, and can be cancelled early via reset().
export function useTelegramLoginFlow({ onConfirmed }: UseTelegramLoginFlowOptions) {
  const [status, setStatus] = useState<TFlowStatus>("idle");
  const loginMutation = useTelegramLoginMutation();
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  };

  useEffect(() => stopPolling, []);

  const start = async () => {
    stopPolling();
    setStatus("waiting");
    try {
      const { token, deep_link } = await loginMutation.mutateAsync();
      await Linking.openURL(deep_link);

      timerRef.current = setInterval(async () => {
        try {
          const result = await fetchTelegramLoginStatus(token);
          if (result.status === "confirmed" && result.access && result.refresh && result.phone) {
            stopPolling();
            setStatus("idle");
            onConfirmedRef.current({ access_token: result.access, refresh_token: result.refresh }, result.phone);
          }
        } catch {
          stopPolling();
          setStatus("error");
        }
      }, POLL_INTERVAL_MS);
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    stopPolling();
    setStatus("idle");
  };

  return { status, isWaiting: status === "waiting", isError: status === "error", start, reset };
}
