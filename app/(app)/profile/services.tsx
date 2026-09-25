import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { CardTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useMasterProfileQuery, useUpdateUserServiceMutation, useUserServicesQuery } from "@/services/master";
import type { IUserService, IUserServiceCategoryRef } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

function ServiceRow({ service, profileGuid }: { service: IUserService; profileGuid: string | null }) {
  const { t } = useTranslation("profile");
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
      showError(t("services_enter_valid_price"));
      return;
    }
    try {
      await updateMutation.mutateAsync({
        guid: service.guid,
        data: { price: price || "0", is_published: nextPublished, pricing_unit: nextUnitGuid },
      });
      showSuccess(t("services_updated"));
    } catch {
      showError(t("edit_save_error"));
    }
  };

  return (
    <View className="gap-3 rounded-3xl bg-surface p-4">
      {service.service_name ? <CardTitle>{service.service_name}</CardTitle> : null}

      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm text-muted">{t("services_show_in_catalog")}</Text>
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
            placeholder={t("services_price")}
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
            <CardTitle className="text-white">{t("save")}</CardTitle>
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
      <CardTitle className="px-1">{category.name}</CardTitle>
      {services.map((service) => (
        <ServiceRow key={service.guid} service={service} profileGuid={profileGuid} />
      ))}
    </View>
  );
}

export default function ProfileServicesScreen() {
  const { t } = useTranslation("profile");
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
      <Header title={t("services_title")} onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !services?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="construct-outline"
            title={t("services_empty_title")}
            description={t("services_empty_description")}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        >
          <View className="flex-row items-center gap-2 rounded-2xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/15">
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text className="flex-1 text-xs text-foreground">
              {t("services_manage_hint")}
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
