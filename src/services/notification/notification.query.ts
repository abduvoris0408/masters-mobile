import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, INotification, INotificationDetail } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const NOTIFICATION_KEYS = {
  list: (page: number, pageSize: number, type?: string) => ["notification", "list", page, pageSize, type ?? null],
  detail: (guid: string | null) => ["notification", "detail", guid],
  unreadCount: ["notification", "unread-count"],
};

export const useNotificationsQuery = (page: number, pageSize = 20, type?: string) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, pageSize, type),
    queryFn: (): Promise<IDjangoPaginated<INotification>> =>
      axiosInstance
        .get<IDjangoPaginated<INotification>>(ENDPOINTS.NOTIFICATIONS.LIST, {
          params: { page, page_size: pageSize, type: type || undefined },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useNotificationDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.detail(guid),
    queryFn: (): Promise<INotificationDetail> =>
      axiosInstance.get<INotificationDetail>(ENDPOINTS.NOTIFICATIONS.DETAIL(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });

// Powers the badge on the header bell icon.
export const useUnreadNotificationsCountQuery = (enabled = true) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: (): Promise<{ count: number }> =>
      axiosInstance.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT).then((r) => r.data),
    enabled,
  });

export const useMarkNotificationReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number): Promise<void> =>
      axiosInstance.post(ENDPOINTS.NOTIFICATIONS.READ, { notification_id: id }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification", "list"] });
      qc.setQueryData<{ count: number }>(NOTIFICATION_KEYS.unreadCount, (prev) =>
        prev ? { count: Math.max(0, prev.count - 1) } : prev,
      );
    },
  });
};
