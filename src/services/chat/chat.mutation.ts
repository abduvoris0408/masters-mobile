import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores";
import { EChatMessageType } from "@/types";
import type { IChatImage, IChatMessage, IDjangoPaginated, ISendChatMessageRequest, IUpdateChatMessageRequest } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CHAT_KEYS } from "./chat.query";
import { extractChatGuid, extractChatId } from "./chat.utils";

export interface IStartChatTarget {
  user?: number;
  order?: number;
  application?: number;
  offer?: number;
  silentError?: boolean;
}

export const useStartChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ silentError, ...target }: IStartChatTarget): Promise<unknown> =>
      axiosInstance.post(ENDPOINTS.CHAT.START, target, { silentError }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "list"] }),
  });
};

// RN's expo-image-picker asset comes back as a local `{ uri, type, name }`
// triple, same FormData shape used by application.mutation.ts's image
// upload — not web's raw File.
export interface IPickedChatImageAsset {
  uri: string;
  type?: string | null;
  name?: string | null;
}

const IMAGE_FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

export const useUploadChatImageMutation = () =>
  useMutation({
    mutationFn: (asset: IPickedChatImageAsset): Promise<IChatImage> => {
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.name || "photo.jpg",
      } as unknown as Blob);
      return axiosInstance.post(ENDPOINTS.CHAT.IMAGE_CREATE, formData, IMAGE_FORM_DATA_CONFIG).then((r) => r.data);
    },
  });

// Optimistic send: injects a synthetic message into every cached messages
// page for this chat before the server responds, ported from the web
// project's onMutate/onError rollback/onSuccess-invalidate pattern.
export const useSendChatMessageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ISendChatMessageRequest & { silentError?: boolean }): Promise<IChatMessage> => {
      const { silentError, ...body } = data;
      return axiosInstance.post(ENDPOINTS.CHAT.MESSAGE_CREATE, body, { silentError }).then((r) => r.data);
    },
    onMutate: async (data) => {
      const currentUser = useAuthStore.getState().user;
      const optimistic: IChatMessage = {
        id: -Date.now(),
        guid: `optimistic-${Date.now()}`,
        sender: {
          id: currentUser?.id ?? 0,
          guid: currentUser?.guid ?? "",
          name: currentUser?.first_name ?? null,
          surname: currentUser?.last_name ?? null,
          phone: currentUser?.phone ?? "",
          photo: currentUser?.avatar ?? null,
        },
        type: data.type ?? EChatMessageType.TEXT,
        text: data.text ?? null,
        application: null,
        offer: null,
        order: null,
        images: null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const queries = qc.getQueriesData<IDjangoPaginated<IChatMessage>>({ queryKey: ["chat", "messages"] });
      const snapshots = queries.map(([key, value]) => ({ key, value }));
      for (const [key, value] of queries) {
        if (!value) continue;
        qc.setQueryData<IDjangoPaginated<IChatMessage>>(key, {
          ...value,
          count: value.count + 1,
          results: [...value.results, optimistic],
        });
      }
      return { snapshots };
    },
    onError: (_err, _data, context) => {
      context?.snapshots.forEach(({ key, value }) => qc.setQueryData(key, value));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "messages"] });
      qc.invalidateQueries({ queryKey: ["chat", "list"] });
    },
  });
};

export const useUpdateChatMessageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, text }: IUpdateChatMessageRequest): Promise<IChatMessage> =>
      axiosInstance.patch(ENDPOINTS.CHAT.MESSAGE_UPDATE(guid), { text }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "messages"] }),
  });
};

export const useDeleteChatMessageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> => axiosInstance.delete(ENDPOINTS.CHAT.MESSAGE_DELETE(guid)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "messages"] }),
  });
};

export const useDeleteChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> => axiosInstance.delete(ENDPOINTS.CHAT.DELETE(guid)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "list"] }),
  });
};

// Fires once per opened chat (guarded by the caller with a ref) — read
// state is whole-chat, not per-message, matching the web project.
export const useMarkChatReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> => axiosInstance.post(ENDPOINTS.CHAT.READ(guid)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "list"] });
      qc.invalidateQueries({ queryKey: CHAT_KEYS.unreadSummary });
    },
  });
};

// Best-effort side-effect used by order/offer flows to silently start-or-
// reuse a chat and drop an invite message — both calls pass silentError so
// a chat hiccup never blocks the order/offer success flow it's attached to.
export function useSendChatInvite() {
  const startChat = useStartChatMutation();
  const sendMessage = useSendChatMessageMutation();
  return async (target: IStartChatTarget, invite: Omit<ISendChatMessageRequest, "chat">) => {
    const chat = await startChat.mutateAsync({ ...target, silentError: true });
    const chatId = extractChatId(chat);
    if (chatId) await sendMessage.mutateAsync({ chat: chatId, ...invite, silentError: true });
  };
}

export { extractChatGuid, extractChatId };
