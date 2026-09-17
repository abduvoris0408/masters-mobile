import { useEffect } from "react";
import type { PropsWithChildren } from "react";

import { connectChatSocket, disconnectChatSocket } from "@/lib/chat/chatSocket";
import { useAuthStore } from "@/stores";

// Mounted once at the app root — connects the one global chat WebSocket on
// login, disconnects on logout, mirroring the web project's useEffect tied
// to `isAuth` in its chat socket lifecycle.
export function ChatSocketProvider({ children }: PropsWithChildren) {
  const isAuth = useAuthStore((s) => s.isAuth);

  useEffect(() => {
    if (isAuth) {
      connectChatSocket();
    } else {
      disconnectChatSocket();
    }
    return () => disconnectChatSocket();
  }, [isAuth]);

  return <>{children}</>;
}
