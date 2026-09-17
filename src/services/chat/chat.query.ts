import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IChatListItem, IChatMessage, IChatUnreadSummary, IDjangoPaginated } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const CHAT_KEYS = {
  list: (pageSize: number) => ["chat", "list", pageSize],
  messages: (guid: string, pageSize: number) => ["chat", "messages", guid, pageSize],
  unreadSummary: ["chat", "unread-summary"],
};

// Same "page 1, growing page_size" trick as the web project — no polling,
// freshness comes from cache invalidation (mutations + the WS handler both
// invalidate this key) rather than a refetch interval.
export const useChatListQuery = (pageSize: number, enabled = true) =>
  useQuery({
    queryKey: CHAT_KEYS.list(pageSize),
    queryFn: (): Promise<IDjangoPaginated<IChatListItem>> =>
      axiosInstance
        .get<IDjangoPaginated<IChatListItem>>(ENDPOINTS.CHAT.LIST, { params: { page: 1, page_size: pageSize } })
        .then((r) => r.data),
    enabled,
    placeholderData: (prev) => prev,
  });

export const useChatMessagesQuery = (guid: string | null, pageSize: number) =>
  useQuery({
    queryKey: CHAT_KEYS.messages(guid ?? "", pageSize),
    queryFn: (): Promise<IDjangoPaginated<IChatMessage>> =>
      axiosInstance
        .get<IDjangoPaginated<IChatMessage>>(ENDPOINTS.CHAT.MESSAGES(guid as string), {
          params: { page: 1, page_size: pageSize },
        })
        .then((r) => r.data),
    enabled: !!guid,
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[2] === guid ? prev : undefined),
  });

export const useChatUnreadSummaryQuery = (enabled = true) =>
  useQuery({
    queryKey: CHAT_KEYS.unreadSummary,
    queryFn: (): Promise<IChatUnreadSummary> =>
      axiosInstance.get<IChatUnreadSummary>(ENDPOINTS.CHAT.UNREAD_SUMMARY).then((r) => r.data),
    enabled,
  });
