import { EChatMessageType, type IChatUser } from "@/types";

// Backend's OpenAPI schema mistypes other_user/last_message/unread_count as
// bare "string" (SerializerMethodFields) — ported unchanged from the web
// project's chat.utils.ts, which treats them as `unknown` at the wire
// boundary and normalizes defensively rather than trusting the schema.
export function normalizeChatUser(value: unknown): IChatUser | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "number" || typeof v.guid !== "string") return null;
  return {
    id: v.id,
    guid: v.guid,
    name: typeof v.name === "string" ? v.name : null,
    surname: typeof v.surname === "string" ? v.surname : null,
    phone: typeof v.phone === "string" ? v.phone : "",
    photo: typeof v.photo === "string" ? v.photo : null,
  };
}

export function chatUserDisplayName(user: IChatUser | null): string {
  if (!user) return "";
  const full = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
  return full || user.phone || "";
}

export interface INormalizedLastMessage {
  text: string | null;
  type?: EChatMessageType;
  hasImages: boolean;
  created_at?: string;
}

export function normalizeLastMessage(value: unknown): INormalizedLastMessage | null {
  if (value == null) return null;
  if (typeof value === "string") return { text: value, hasImages: false };
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    return {
      text: typeof v.text === "string" ? v.text : null,
      type: v.type as EChatMessageType | undefined,
      hasImages: Array.isArray(v.images) && v.images.length > 0,
      created_at: typeof v.created_at === "string" ? v.created_at : undefined,
    };
  }
  return null;
}

export function toUnreadCount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

export function toReadBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

// /chat/start/'s response shape is undocumented by the backend — try the
// object directly, then common nesting keys, same defensiveness as web.
function pickNested(value: unknown, key: string): unknown {
  if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
    return (value as Record<string, unknown>)[key];
  }
  return undefined;
}

export function extractChatId(value: unknown): number | null {
  for (const candidate of [value, pickNested(value, "chat"), pickNested(value, "data"), pickNested(value, "result")]) {
    if (candidate && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).id === "number") {
      return (candidate as Record<string, unknown>).id as number;
    }
  }
  return null;
}

export function extractChatGuid(value: unknown): string | null {
  for (const candidate of [value, pickNested(value, "chat"), pickNested(value, "data"), pickNested(value, "result")]) {
    if (candidate && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).guid === "string") {
      return (candidate as Record<string, unknown>).guid as string;
    }
  }
  return null;
}

// /chat/unread-summary/'s shape is undocumented — try the field names the
// web project's getChatUnreadTotal() tries, in order.
export function getChatUnreadTotal(summary: Record<string, unknown> | undefined): number {
  if (!summary) return 0;
  for (const key of ["unread_count", "count", "total"]) {
    if (typeof summary[key] === "number") return summary[key] as number;
  }
  return summary.has_unread ? 1 : 0;
}

export const CHAT_INVITE_LABEL: Partial<Record<EChatMessageType, string>> = {
  [EChatMessageType.ORDER_INVITE]: "Yangi buyurtma yaratildi",
  [EChatMessageType.APPLICATION_INVITE]: "Yangi elon yuborildi",
  [EChatMessageType.OFFER_INVITE]: "Taklif yuborildi",
};
