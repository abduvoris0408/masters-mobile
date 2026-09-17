import { queryClient } from "@/providers/QueryProvider";
import { useAuthStore } from "@/stores";

// Ported from the web project's src/lib/chatSocket.ts — one WebSocket per
// signed-in account (not per-room), auth'd via the same JWT access token
// used for REST calls, passed as a query string param (no separate WS
// handshake auth flow on this backend).
function wsUrlFromApi(accessToken: string): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  const wsBase = apiUrl.replace(/^http/, "ws");
  return `${wsBase}/ws/chat/?token=${accessToken}`;
}

type Listener = (message: unknown) => void;
const listeners = new Set<Listener>();

export function onIncomingChatMessage(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let openedAt = 0;
let backoffMs = 1000;
const MAX_BACKOFF_MS = 15000;

// Backend quirk: the connection is forcibly dropped by the server at ~5s.
// Treat that as expected, not an error — only back off if the connection
// died before staying open 3s; otherwise reconnect immediately at the floor.
function scheduleReconnect() {
  if (reconnectTimer) return;
  const stayedOpenMs = openedAt ? Date.now() - openedAt : 0;
  backoffMs = stayedOpenMs > 3000 ? 1000 : Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectChatSocket();
  }, backoffMs);
}

const seenMessageKeys: string[] = [];
const MAX_SEEN_MESSAGE_KEYS = 200;
function alreadySeen(key: string): boolean {
  if (seenMessageKeys.includes(key)) return true;
  seenMessageKeys.push(key);
  if (seenMessageKeys.length > MAX_SEEN_MESSAGE_KEYS) seenMessageKeys.shift();
  return false;
}

function pickMessageCandidate(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (v.message && typeof v.message === "object") return v.message as Record<string, unknown>;
  return v;
}

function extractChatRef(msg: Record<string, unknown>): string | null {
  if (typeof msg.chat_guid === "string") return msg.chat_guid;
  if (typeof msg.chat === "string") return msg.chat;
  return null;
}

function extractSenderId(msg: Record<string, unknown>): number | null {
  const sender = msg.sender;
  if (sender && typeof sender === "object" && typeof (sender as Record<string, unknown>).id === "number") {
    return (sender as Record<string, unknown>).id as number;
  }
  return null;
}

function looksLikeMessage(msg: Record<string, unknown>): boolean {
  return typeof msg.id !== "undefined" || typeof msg.guid === "string";
}

function handleSocketEvent(raw: unknown) {
  const msg = pickMessageCandidate(raw);
  if (!msg || !looksLikeMessage(msg)) return;

  const dedupeKey = typeof msg.guid === "string" ? msg.guid : String(msg.id);
  if (alreadySeen(dedupeKey)) return;

  const senderId = extractSenderId(msg);
  const currentUserId = useAuthStore.getState().user?.id;
  // The sending device already updates its own cache via the mutation's
  // onSuccess — re-invalidating here too would double the request volume
  // for every message the user sends themselves.
  if (senderId != null && senderId === currentUserId) return;

  const chatGuid = extractChatRef(msg);
  if (chatGuid) {
    queryClient.invalidateQueries({ queryKey: ["chat", "messages", chatGuid] });
  } else {
    queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
  }
  queryClient.invalidateQueries({ queryKey: ["chat", "list"] });
  queryClient.invalidateQueries({ queryKey: ["chat", "unread-summary"] });

  listeners.forEach((cb) => cb(msg));
}

export function connectChatSocket() {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken || socket) return;

  try {
    socket = new WebSocket(wsUrlFromApi(accessToken));
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    openedAt = Date.now();
  };

  socket.onmessage = (event) => {
    try {
      handleSocketEvent(JSON.parse(event.data));
    } catch {
      // Non-JSON frame — ignore.
    }
  };

  socket.onclose = () => {
    socket = null;
    if (useAuthStore.getState().isAuth) scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

export function disconnectChatSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
  backoffMs = 1000;
}
