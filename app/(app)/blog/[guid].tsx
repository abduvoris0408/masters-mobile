import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useBlogDetailQuery } from "@/services/blog";
import type { IBlogContentBlock } from "@/types";
import { formatDate } from "@/utils/format";

function ContentBlock({ block }: { block: IBlogContentBlock }) {
  if (block.type === "image" && block.image) {
    return <Image source={{ uri: block.image }} className="rounded-2xl" style={{ width: "100%", height: 200 }} resizeMode="cover" />;
  }
  if (block.type === "video" || !block.text) return null;

  const paragraphs = block.text.split(/\n\s*\n/).filter(Boolean);
  return (
    <View className="gap-3">
      {paragraphs.map((p, i) => {
        const isQuote = /^["«"]/.test(p.trim());
        return isQuote ? (
          <View key={i} className="rounded-2xl border-l-4 border-accent bg-emerald-50 px-4 py-3 dark:bg-accent/10">
            <Text className="text-sm italic leading-6 text-foreground">{p.trim()}</Text>
          </View>
        ) : (
          <Text key={i} className="text-sm leading-6 text-foreground">
            {p.trim()}
          </Text>
        );
      })}
    </View>
  );
}

export default function BlogDetailScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useBlogDetailQuery(guid ?? null);

  return (
    <View className="flex-1 bg-background">
      <Header title="Blog" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Maqola topilmadi" description="Ehtimol o'chirilgan yoki mavjud emas" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-10" contentContainerStyle={{ paddingTop: headerHeight + 12 }}>
          <Image source={{ uri: data.image }} className="rounded-3xl" style={{ width: "100%", height: 200 }} resizeMode="cover" />

          <View className="gap-2">
            <Text className="text-xs text-muted">{formatDate(data.created_at)}</Text>
            <Text className="text-xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
              {data.title}
            </Text>
            <Text className="text-base leading-6 text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              {data.description}
            </Text>
          </View>

          {[...data.contents]
            .sort((a, b) => a.order - b.order)
            .map((block) => <ContentBlock key={block.guid} block={block} />)}
        </ScrollView>
      )}
    </View>
  );
}
