import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientCard } from "@/components/ui/GradientCard";
import { Header } from "@/components/ui/Header";
import { Rating } from "@/components/ui/Rating";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterCatalogDetailQuery } from "@/services/master";

export default function MasterDetailScreen() {
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError } = useMasterCatalogDetailQuery(guid ?? null);

  return (
    <View className="flex-1 bg-background">
      <Header title="Mutaxassis" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : isError || !data ? (
        <EmptyState icon="alert-circle-outline" title="Mutaxassis topilmadi" />
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4">
          <GradientCard style={{ alignItems: "center" }} colors={["#8B7CF6", "#6C5CE7"]}>
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
      )}
    </View>
  );
}
