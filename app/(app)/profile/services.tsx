import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterProfileQuery, useUpdateUserServiceMutation, useUserServicesQuery } from "@/services/master";
import type { IUserService, IUserServiceCategoryRef } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

function ServiceRow({ service, profileGuid }: { service: IUserService; profileGuid: string | null }) {
  const colors = useThemeColors();
  const [price, setPrice] = useState(service.price ? String(Math.round(Number(service.price))) : "");
  const [isPublished, setIsPublished] = useState(service.is_published);
  const [unitGuid, setUnitGuid] = useState<string | undefined>(service.pricing_units[0]?.guid);
  const updateMutation = useUpdateUserServiceMutation(profileGuid);

  const dirty =
    price !== (service.price ? String(Math.round(Number(service.price))) : "") ||
    isPublished !== service.is_published ||
    unitGuid !== service.pricing_units[0]?.guid;

  const handleSave = async (nextPublished = isPublished, nextUnitGuid = unitGuid) => {
    const numericPrice = Number(price);
    if (nextPublished && (!price || Number.isNaN(numericPrice) || numericPrice < 0)) {
      showError("Narxni to'g'ri kiriting");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        guid: service.guid,
        data: { price: price || "0", is_published: nextPublished, pricing_unit: nextUnitGuid },
      });
      showSuccess("Xizmat yangilandi");
    } catch {
      showError("Saqlashda xatolik yuz berdi");
    }
  };

  return (
    <View className="gap-3 rounded-3xl bg-surface p-4">
      {service.service_name ? (
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
          {service.service_name}
        </Text>
      ) : null}

      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm text-muted">Katalogda ko'rsatish</Text>
        <Switch
          value={isPublished}
          onValueChange={(next) => {
            setIsPublished(next);
            handleSave(next);
          }}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <TextField
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Narx"
            editable={isPublished}
          />
        </View>
        {service.pricing_units.length > 0 ? (
          <Text className="text-xs text-muted">/ {service.pricing_units.find((u) => u.guid === unitGuid)?.name ?? service.pricing_units[0].name}</Text>
        ) : null}
      </View>

      {dirty ? (
        <Pressable
          onPress={() => handleSave()}
          disabled={updateMutation.isPending}
          className="flex-row items-center justify-center gap-2 rounded-full bg-accent py-2.5"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
              Saqlash
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function CategoryGroup({
  category,
  services,
  profileGuid,
}: {
  category: IUserServiceCategoryRef;
  services: IUserService[];
  profileGuid: string | null;
}) {
  return (
    <View className="gap-2.5">
      <Text className="px-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
        {category.name}
      </Text>
      {services.map((service) => (
        <ServiceRow key={service.guid} service={service} profileGuid={profileGuid} />
      ))}
    </View>
  );
}

export default function ProfileServicesScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: services, isLoading } = useUserServicesQuery(profileGuid);

  const groups = useMemo(() => {
    if (!services) return [];
    const map = new Map<string, { category: IUserServiceCategoryRef; services: IUserService[] }>();
    for (const service of services) {
      const key = service.category.guid;
      if (!map.has(key)) map.set(key, { category: service.category, services: [] });
      map.get(key)!.services.push(service);
    }
    return Array.from(map.values());
  }, [services]);

  return (
    <View className="flex-1 bg-background">
      <Header title="Xizmatlar" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !services?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState icon="construct-outline" title="Xizmatlar qo'shilmagan" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        >
          <View className="flex-row items-center gap-2 rounded-2xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/15">
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text className="flex-1 text-xs text-foreground">
              Narxlarni va katalogda ko'rinish holatini shu yerdan boshqarasiz
            </Text>
          </View>

          {groups.map(({ category, services: categoryServices }) => (
            <CategoryGroup key={category.guid} category={category} services={categoryServices} profileGuid={profileGuid} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
