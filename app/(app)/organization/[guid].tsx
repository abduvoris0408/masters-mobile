import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useOrganizationCatalogDetailQuery } from "@/services/organization";
import { formatDate, formatPhoneNumber } from "@/utils/format";

const LEGAL_FORM_LABEL: Record<string, string> = {
  mchj: "MChJ",
  yatt: "YaTT",
  xk: "XK",
  aj: "AJ",
  other: "Boshqa",
};

export default function OrganizationDetailScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError, refetch } = useOrganizationCatalogDetailQuery(guid ?? null);

  return (
    <View className="flex-1 bg-background">
      <Header title="Tashkilot" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : isError || !data ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Tashkilot topilmadi"
            description="Qayta urinib ko'ring"
            actionLabel="Qayta urinish"
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-4"
          contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 32 }}
        >
          <Card className="items-center gap-2">
            <Avatar uri={data.logo} name={data.name} size={72} />
            <Text className="text-xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }} numberOfLines={2}>
              {data.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-background px-3 py-1">
                <Text className="text-xs text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                  {LEGAL_FORM_LABEL[data.legal_form] ?? data.legal_form}
                </Text>
              </View>
              {data.is_verified ? (
                <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 dark:bg-accent/15">
                  <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                  <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    Tekshirilgan
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {data.description ? (
            <Card className="gap-2">
              <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                Tashkilot haqida
              </Text>
              <Text className="text-base leading-6 text-foreground">{data.description}</Text>
            </Card>
          ) : null}

          {data.categories.length > 0 ? (
            <Card className="gap-3">
              <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                Yo'nalishlar
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {data.categories.map((category) => (
                  <Chip key={category.guid} label={category.name} />
                ))}
              </View>
            </Card>
          ) : null}

          <Card className="gap-3">
            <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
              Ma'lumot
            </Text>
            <View className="gap-2.5">
              {data.country ? (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="location-outline" size={16} color={colors.muted} />
                  <Text className="flex-1 text-sm text-foreground">
                    {data.country}
                    {data.operates_regions && data.regions ? `, ${data.regions}` : ""}
                    {data.operates_districts && data.districts ? `, ${data.districts}` : ""}
                  </Text>
                </View>
              ) : null}
              {data.director_phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${data.director_phone}`)}
                  className="flex-row items-center gap-2"
                >
                  <Ionicons name="call-outline" size={16} color={colors.accent} />
                  <Text className="flex-1 text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    {formatPhoneNumber(data.director_phone)}
                  </Text>
                </Pressable>
              ) : null}
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                <Text className="flex-1 text-sm text-foreground">
                  {formatDate(data.created_at)} sanasidan buyon platformada
                </Text>
              </View>
            </View>
          </Card>

          {data.intro_videos.length > 0 ? (
            <Card className="gap-3">
              <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                Tanishtiruv videolari
              </Text>
              {data.intro_videos.map((url) => (
                <Pressable
                  key={url}
                  onPress={() => Linking.openURL(url)}
                  className="flex-row items-center gap-2 rounded-2xl bg-background px-3.5 py-3"
                >
                  <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                  <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                    Videoni ko'rish
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </Card>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
