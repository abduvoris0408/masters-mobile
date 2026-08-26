export enum EChatMessageType {
  TEXT = "text",
  APPLICATION_INVITE = "application_invite",
  OFFER_INVITE = "offer_invite",
  ORDER_INVITE = "order_invite",
}

export interface IChatUser {
  id: number;
  guid: string;
  name: string | null;
  surname: string | null;
  phone: string;
  photo?: string | null;
}

// Party ref nested inside order/offer invites — a trimmed-down IChatUser
// (no `surname`/`photo` in the sample payload).
export interface IChatPartyRef {
  id: number;
  guid: string;
  name: string | null;
  phone?: string;
}

// The messages-list endpoint documents application/offer/order as bare
// "string" (SerializerMethodField with no type hint), but per the backend's
// own schema description they come back as the full nested object "for
// inline display in chat" — not just the id like MESSAGE_CREATE accepts.
export interface IChatOrderRef {
  id: number;
  guid: string;
  customer: IChatPartyRef | null;
  master: IChatPartyRef | null;
  price: string;
  address: string | null;
  comment: string | null;
  status: string;
  // Present once the order moves into the contract-acceptance step — the
  // customer accepts automatically when placing a direct order, the master
  // accepts separately via the contract agreement page.
  customer_agreement_accepted?: boolean;
  master_agreement_accepted?: boolean;
  created_at: string;
}

export interface IChatApplicationRef {
  id: number;
  guid: string;
  category: unknown;
  description: string;
  address: string | null;
  budget_from: string | null;
  budget_to: string | null;
  status: string;
  created_at: string;
}

export interface IChatOfferRef {
  id: number;
  guid: string;
  application_id: number;
  master: IChatPartyRef | null;
  price: string;
  comment: string | null;
  status: string;
  created_at: string;
}

// Response from POST /chat/image/create/ — one row per uploaded image, `id`
// is what MESSAGE_CREATE's `images` array references.
export interface IChatImage {
  id: number;
  image: string;
}

export interface IChatMessage {
  id: number;
  guid: string;
  sender: IChatUser;
  type: EChatMessageType;
  text: string | null;
  application: IChatApplicationRef | null;
  offer: IChatOfferRef | null;
  order: IChatOrderRef | null;
  images?: IChatImage[] | null;
  is_read: boolean | string;
  created_at: string;
  // Not documented in the messages schema, but the update endpoint may stamp
  // one of these — used to show Telegram's "edited" marker when present.
  updated_at?: string | null;
  is_edited?: boolean;
}

// `other_user` / `last_message` / `unread_count` come back from
// SerializerMethodFields the backend's OpenAPI schema can't type properly
// (it documents all three as bare "string"), so treat them as unknown at the
// wire boundary and normalize with the helpers in chat.utils.ts.
export interface IChatListItem {
  id: number;
  guid: string;
  other_user: unknown;
  last_message: unknown;
  unread_count: unknown;
  created_at: string;
}

export interface IChatUnreadSummary {
  [key: string]: unknown;
}

export interface ISendChatMessageRequest {
  chat: number;
  type?: EChatMessageType;
  text?: string;
  application?: number;
  offer?: number;
  order?: number;
  images?: number[];
}

export interface IUpdateChatMessageRequest {
  guid: string;
  text: string;
}
