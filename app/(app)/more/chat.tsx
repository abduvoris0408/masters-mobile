import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  CHAT_INVITE_LABEL,
  chatUserDisplayName,
  normalizeChatUser,
  normalizeLastMessage,
  toUnreadCount,
  useChatListQuery,
} from "@/services/chat";
import type { IChatListItem } from "@/types";
import { fromNow } from "@/utils/format";

const PAGE_SIZE_STEP = 20;

function ChatRow({ chat }: { chat: IChatListItem }) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const otherUser = normalizeChatUser(chat.other_user);
  const lastMessage = normalizeLastMessage(chat.last_message);
  const unreadCount = toUnreadCount(chat.unread_count);
  const name = chatUserDisplayName(otherUser) || t("chat_default_user");

  const preview = lastMessage?.type && CHAT_INVITE_LABEL[lastMessage.type]
    ? CHAT_INVITE_LABEL[lastMessage.type]
    : lastMessage?.text
      ? lastMessage.text
      : lastMessage?.hasImages
        ? t("chat_image_preview")
        : " ";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/chat/[guid]", params: { guid: chat.guid, id: String(chat.id) } })}
      className="flex-row items-center gap-3 rounded-2xl px-2 py-3"
    >
      <View>
        <Avatar uri={otherUser?.photo} name={name} size={46} />
        {unreadCount > 0 ? (
          <View className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-accent" />
        ) : null}
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="flex-1 text-sm text-foreground"
            style={{ fontFamily: unreadCount > 0 ? GOLOS_WEIGHTS.bold : GOLOS_WEIGHTS.semibold }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text className="text-xs text-muted">{fromNow(lastMessage?.created_at ?? chat.created_at)}</Text>
        </View>
        <Text className="text-sm text-muted" numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {unreadCount > 0 ? (
        <View className="h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5">
          <Text className="text-[11px] text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ChatListScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, refetch } = useChatListQuery(pageSize);

  const chats = data?.results ?? [];
  const hasMore = (data?.count ?? 0) > chats.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => {
      const user = normalizeChatUser(chat.other_user);
      const name = chatUserDisplayName(user).toLowerCase();
      return name.includes(q) || (user?.phone ?? "").includes(q);
    });
  }, [chats, search]);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("chat_list_header")} onBackPress={() => router.back()} />

      <View className="px-4 pb-2" style={{ paddingTop: headerHeight }}>
        <SearchBar placeholder={t("chat_search_placeholder")} value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.accent} />
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState icon="search-outline" title={t("chat_no_matching_chat")} />
        ) : (
          <EmptyState icon="chatbubble-outline" title={t("chat_no_chats")} />
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-1 px-4 pb-6"
          renderItem={({ item }) => <ChatRow chat={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPageSize((p) => p + PAGE_SIZE_STEP)}
          refreshControl={<RefreshControl refreshing={isFetching && pageSize === PAGE_SIZE_STEP} onRefresh={() => refetch()} />}
          ListFooterComponent={isFetching && pageSize > PAGE_SIZE_STEP ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
        />
      )}
    </View>
  );
}
