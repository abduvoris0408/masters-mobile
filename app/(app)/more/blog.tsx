import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useBlogListQuery } from "@/services/blog";
import type { IBlogListItem } from "@/types";
import { appendUniquePage } from "@/utils/pagination";
import { formatDate } from "@/utils/format";

const PAGE_SIZE_STEP = 12;

function BlogRow({ item }: { item: IBlogListItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/blog/${item.guid}`)}
      className="gap-2.5 overflow-hidden rounded-3xl bg-surface p-3"
    >
      {item.image ? (
        <Image source={{ uri: item.image }} className="rounded-2xl" style={{ width: "100%", height: 160 }} resizeMode="cover" />
      ) : (
        <View className="items-center justify-center rounded-2xl bg-background" style={{ width: "100%", height: 160 }}>
          <Ionicons name="newspaper-outline" size={32} color="#94A3B8" />
        </View>
      )}
      <View className="gap-1 px-1">
        <Text className="text-xs text-muted">{formatDate(item.created_at)}</Text>
        <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-sm text-muted" numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BlogScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, refetch } = useBlogListQuery(1, pageSize);

  const posts = data?.results ?? [];
  const hasMore = (data?.count ?? 0) > posts.length;
  const filtered = search.trim()
    ? posts.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(search.trim().toLowerCase()))
    : posts;

  return (
    <View className="flex-1 bg-background">
      <Header title="Blog" onBackPress={() => router.back()} />

      <View className="px-4 pb-2" style={{ paddingTop: headerHeight }}>
        <SearchBar placeholder="Qidiruv..." value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="newspaper-outline"
          title={search ? "Hech narsa topilmadi" : "Hozircha maqolalar yo'q"}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4 pb-6"
          renderItem={({ item }) => <BlogRow item={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPageSize((p) => p + PAGE_SIZE_STEP)}
          ListFooterComponent={isFetching && pageSize > PAGE_SIZE_STEP ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={<RefreshControl refreshing={isFetching && pageSize === PAGE_SIZE_STEP} onRefresh={() => refetch()} />}
        />
      )}
    </View>
  );
}
