import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useRoleUpdateMutation } from "@/services/auth";
import {
  useCreateMasterProfileMutation,
  useDistrictsQuery,
  useExperienceLevelsQuery,
  useJobsBaseCategoriesQuery,
  useJobsCategoriesQuery,
  useRegionsQuery,
} from "@/services/master";
import { useAuthStore } from "@/stores";
import { EProfileType, EUserType } from "@/types";
import { USER_ROLE_ID } from "@/constants";
import { showError, showSuccess } from "@/utils/toast";

// Mobile counterpart to the web project's master-onboarding page, trimmed to
// a single screen (no step wizard) since the field set is small: category,
// experience, address, description. Individual masters only — organization
// sign-ups go through organization-onboarding.tsx instead, since none of
// these fields (services, experience, work address) apply to an org profile.
export default function MasterOnboardingScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [baseCategoryGuid, setBaseCategoryGuid] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [regionGuid, setRegionGuid] = useState<string | null>(null);
  const [districtGuid, setDistrictGuid] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const { data: baseCategories, isLoading: baseCategoriesLoading } = useJobsBaseCategoriesQuery();
  const { data: categories, isLoading: categoriesLoading } = useJobsCategoriesQuery(baseCategoryGuid);
  const { data: experienceLevels, isLoading: experienceLoading } = useExperienceLevelsQuery();
  const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
  const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(regionGuid);

  const roleUpdateMutation = useRoleUpdateMutation();
  const createProfileMutation = useCreateMasterProfileMutation();
  const isSaving = roleUpdateMutation.isPending || createProfileMutation.isPending;

  useEffect(() => {
    setCategoryId(null);
  }, [baseCategoryGuid]);

  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === baseCategoryGuid);
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const selectedExperience = experienceLevels?.find((e) => e.id === experienceLevelId);
  const selectedRegion = regions?.find((r) => r.guid === regionGuid);
  const selectedDistrict = districts?.find((d) => d.guid === districtGuid);

  const canSubmit = categoryId !== null && experienceLevelId !== null && regionGuid !== null && districtGuid !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      // Role first, then the profile record itself — mirrors the web flow's
      // ordering (role-update → createMasterProfile). Without this, the
      // "switch role" toggle used to grant WORKER with no profile behind it,
      // silently stranding the user.
      if (user?.user_type !== EUserType.WORKER) {
        await roleUpdateMutation.mutateAsync({ role: [USER_ROLE_ID.MASTER] });
      }
      await createProfileMutation.mutateAsync({
        type: EProfileType.INDIVIDUAL,
        description: description.trim() || undefined,
        categories: categoryId ? [categoryId] : [],
        main_category: categoryId,
        experience_level: experienceLevelId,
        region: regions?.find((r) => r.guid === regionGuid)?.id ?? null,
        district: districts?.find((d) => d.guid === districtGuid)?.id ?? null,
      });
      if (user) setUser({ ...user, user_type: EUserType.WORKER });
      showSuccess(t("master_onboarding_success"));
      router.replace("/(app)/(tabs)/profile");
    } catch {
      showError(t("onboarding_save_error"));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("master_onboarding_title")} onBackPress={() => router.back()} />

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
          <Ionicons name="briefcase-outline" size={16} color={colors.accent} />
          <Text className="flex-1 text-xs text-foreground">
            {t("master_onboarding_hint")}
          </Text>
        </View>

        <PickerField
          label={t("direction")}
          placeholder={t("direction_placeholder")}
          loading={baseCategoriesLoading}
          value={selectedBaseCategory?.name ?? null}
          options={(baseCategories ?? []).map((bc) => ({ value: bc.guid, label: bc.name }))}
          onSelect={setBaseCategoryGuid}
        />

        {baseCategoryGuid ? (
          <PickerField
            label={t("service_category")}
            placeholder={t("service_category_placeholder")}
            loading={categoriesLoading}
            disabled={!baseCategoryGuid}
            value={selectedCategory?.name ?? null}
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            onSelect={(v) => setCategoryId(Number(v))}
          />
        ) : null}

        <PickerField
          label={t("experience_level")}
          placeholder={t("experience_level_placeholder")}
          loading={experienceLoading}
          value={selectedExperience?.name ?? null}
          options={(experienceLevels ?? []).map((e) => ({ value: String(e.id), label: e.name }))}
          onSelect={(v) => setExperienceLevelId(Number(v))}
        />

        <PickerField
          label={t("region")}
          placeholder={t("region_placeholder")}
          loading={regionsLoading}
          value={selectedRegion?.name ?? null}
          options={(regions ?? []).map((r) => ({ value: r.guid, label: r.name }))}
          onSelect={(guid) => {
            setRegionGuid(guid);
            setDistrictGuid(null);
          }}
        />

        {regionGuid ? (
          <PickerField
            label={t("district")}
            placeholder={t("district_placeholder")}
            loading={districtsLoading}
            disabled={!regionGuid}
            value={selectedDistrict?.name ?? null}
            options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
            onSelect={setDistrictGuid}
          />
        ) : null}

        <TextField
          label={t("about_yourself_optional")}
          placeholder={t("about_yourself_placeholder")}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
        />

        <Button className="mt-2" loading={isSaving} disabled={!canSubmit} onPress={handleSubmit}>
          {t("finish")}
        </Button>
      </ScrollView>
    </View>
  );
}
