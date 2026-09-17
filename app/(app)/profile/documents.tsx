import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useDocumentListQuery } from "@/services/document";
import { useMasterProfileQuery } from "@/services/master";
import type { IDocument } from "@/types";
import { formatDate } from "@/utils/format";

export default function ProfileDocumentsScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: documents, isLoading } = useDocumentListQuery("profile", profileGuid);

  return (
    <View className="flex-1 bg-background">
      <Header title="Hujjatlar" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !documents?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="document-attach-outline" title="Hujjatlar qo'shilmagan" />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item: IDocument) => item.guid}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => Linking.openURL(item.file)}
              className="flex-row items-center gap-3 rounded-3xl bg-surface p-4"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15">
                <Ionicons name="document-text-outline" size={20} color={colors.accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {item.issued_by} · {formatDate(item.issued_at)}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
