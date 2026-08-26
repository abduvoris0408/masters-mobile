import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { Rating } from "@/components/ui/Rating";
import { useApplicationPublicDetailQuery } from "@/services/application";
import { formatDate, formatPrice } from "@/utils/format";

export default function ListingDetailScreen() {
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useApplicationPublicDetailQuery(guid ?? null);

  return (
    <View className="flex-1 bg-background">
      <Header title="Elon" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : isError || !data ? (
        <EmptyState icon="alert-circle-outline" title="Elon topilmadi" />
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4">
          <GradientCard>
            <Text className="text-sm font-medium text-white/70">{data.category.name}</Text>
            <Text className="mt-1 text-xl font-bold text-white">{data.title}</Text>
            <Text className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              {data.budget_from === data.budget_to
                ? formatPrice(Number(data.budget_from))
                : `${formatPrice(Number(data.budget_from))} – ${formatPrice(Number(data.budget_to))}`}
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {data.is_urgent ? (
                <View className="rounded-full bg-white/20 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-white">Tezkor</Text>
                </View>
              ) : null}
              <View className="rounded-full bg-white/20 px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">
                  {data.offers_count > 0 ? `${data.offers_count} ta taklif` : "Takliflar yo'q"}
                </Text>
              </View>
            </View>
          </GradientCard>

          <Card className="gap-2">
            <Text className="text-sm font-medium text-muted">Manzil</Text>
            <Text className="text-base text-foreground">{data.address || "Ko'rsatilmagan"}</Text>
          </Card>

          {data.date_from ? (
            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">Ish muddati</Text>
              <Text className="text-base text-foreground">
                {formatDate(data.date_from)}
                {data.date_to && data.date_to !== data.date_from ? ` – ${formatDate(data.date_to)}` : ""}
              </Text>
            </Card>
          ) : null}

          <Card className="gap-2">
            <Text className="text-sm font-medium text-muted">Tavsif</Text>
            <Text className="text-base text-foreground">{data.description}</Text>
          </Card>

          <Card className="flex-row items-center gap-3">
            <Avatar name={data.customer.name} size={48} />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground">
                {data.customer.name} {data.customer.surname}
              </Text>
              <View className="flex-row items-center gap-2">
                <Rating value={data.customer.rating} />
                <Text className="text-sm text-muted">· {data.customer.applications_count} ta elon</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}
