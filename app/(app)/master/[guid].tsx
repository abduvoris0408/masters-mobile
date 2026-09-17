import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { Rating } from "@/components/ui/Rating";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterCatalogDetailQuery } from "@/services/master";
import { extractChatGuid, extractChatId, useStartChatMutation } from "@/services/chat";
import { showError } from "@/utils/toast";

export default function MasterDetailScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useMasterCatalogDetailQuery(guid ?? null);
  const startChatMutation = useStartChatMutation();

  const handleContact = async () => {
    if (!data) return;
    try {
      const result = await startChatMutation.mutateAsync({ user: Number(data.user_id) });
      const chatGuid = extractChatGuid(result);
      const chatId = extractChatId(result);
      if (!chatGuid || !chatId) {
        showError("Suhbatni ochishda xatolik yuz berdi");
        return;
      }
      router.push({ pathname: "/chat/[guid]", params: { guid: chatGuid, id: String(chatId) } });
    } catch {
      showError("Suhbatni ochishda xatolik yuz berdi");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Mutaxassis" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator className="mt-10" color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="alert-circle-outline" title="Mutaxassis topilmadi" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerClassName="gap-4 p-4"
            contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 100 }}
          >
            <GradientCard style={{ alignItems: "center" }}>
              <Avatar uri={data.photo} name={data.name} size={84} />
              <Text className="mt-3 text-xl text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                {data.name} {data.surname}
              </Text>
              {data.region ? (
                <Text className="mt-0.5 text-sm text-white/70">
                  {data.region.name}
                  {data.district ? `, ${data.district.name}` : ""}
                </Text>
              ) : null}
              {data.rating != null ? (
                <View className="mt-3 flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
                  <Rating value={data.rating} size={13} />
                </View>
              ) : null}
            </GradientCard>

            {data.description ? (
              <Card className="gap-2">
                <Text className="text-sm font-medium text-muted">O'zi haqida</Text>
                <Text className="text-base text-foreground">{data.description}</Text>
              </Card>
            ) : null}

            {data.services.length > 0 ? (
              <Card className="gap-3">
                <Text className="text-sm font-medium text-muted">Xizmatlar</Text>
                {data.services.map((service, index) => (
                  <View
                    key={service.guid}
                    className={`flex-row items-center justify-between ${index > 0 ? "border-t border-border pt-3" : ""}`}
                  >
                    <Text className="flex-1 text-base text-foreground">{service.service_name ?? service.category.name}</Text>
                    <Text className="text-base text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
                      {service.price} so'm
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {data.organization ? (
              <Card className="flex-row items-center gap-3">
                <Avatar uri={data.organization.logo} name={data.organization.name} size={40} />
                <Text className="flex-1 text-base text-foreground">{data.organization.name}</Text>
              </Card>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={handleContact}
            disabled={startChatMutation.isPending}
            className="absolute inset-x-4 flex-row items-center justify-center gap-2 rounded-2xl bg-accent"
            style={{ bottom: 24, height: 56 }}
          >
            {startChatMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                <Text className="text-base text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Murojaat qilish
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}
