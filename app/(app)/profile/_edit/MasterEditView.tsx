import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import {
  useDistrictsQuery,
  useExperienceLevelsQuery,
  useJobsBaseCategoriesQuery,
  useJobsCategoriesQuery,
  useRegionsQuery,
  useUpdateMasterProfileMutation,
} from "@/services/master";
import { EProfileType } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { EditShell } from "./EditShell";

export function MasterEditView({ profileGuid }: { profileGuid: string }) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const { masterProfile } = useProfilePerspective();

  const [baseCategoryGuid, setBaseCategoryGuid] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(masterProfile?.categories[0]?.id ?? null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(masterProfile?.experience_level?.id ?? null);
  const [regionGuid, setRegionGuid] = useState<string | null>(masterProfile?.region?.guid ?? null);
  const [districtGuid, setDistrictGuid] = useState<string | null>(masterProfile?.district?.guid ?? null);
  const [description, setDescription] = useState(masterProfile?.description ?? "");

  const { data: baseCategories, isLoading: baseCategoriesLoading } = useJobsBaseCategoriesQuery();
  const { data: categories, isLoading: categoriesLoading } = useJobsCategoriesQuery(baseCategoryGuid);
  const { data: experienceLevels, isLoading: experienceLoading } = useExperienceLevelsQuery();
  const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
  const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(regionGuid);

  useEffect(() => {
    if (baseCategoryGuid) setCategoryId(null);
  }, [baseCategoryGuid]);

  const updateMutation = useUpdateMasterProfileMutation(profileGuid);

  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === baseCategoryGuid);
  // Falls back to the already-saved category's own name until a direction is
  // (re)picked and the category list for it loads — otherwise the picker
  // would show blank for a value that's actually already selected.
  const selectedCategory =
    categories?.find((c) => c.id === categoryId) ??
    (categoryId ? masterProfile?.categories.find((c) => c.id === categoryId) : undefined);
  const selectedExperience = experienceLevels?.find((e) => e.id === experienceLevelId);
  const selectedRegion = regions?.find((r) => r.guid === regionGuid) ?? (regionGuid ? masterProfile?.region : undefined);
  const selectedDistrict = districts?.find((d) => d.guid === districtGuid) ?? (districtGuid ? masterProfile?.district : undefined);

  const canSubmit = categoryId !== null && experienceLevelId !== null && regionGuid !== null && districtGuid !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !masterProfile) return;
    try {
      const regionId = regions?.find((r) => r.guid === regionGuid)?.id ?? masterProfile.region?.id ?? null;
      const districtId = districts?.find((d) => d.guid === districtGuid)?.id ?? masterProfile.district?.id ?? null;
      await updateMutation.mutateAsync({
        type: EProfileType.INDIVIDUAL,
        description: description.trim() || undefined,
        categories: categoryId ? [categoryId] : [],
        main_category: categoryId,
        experience_level: experienceLevelId,
        region: regionId,
        district: districtId,
      });
      showSuccess(t("edit_profile_updated"));
      router.back();
    } catch {
      showError(t("edit_save_error"));
    }
  };

  return (
    <EditShell title={t("edit_title")}>
      <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
        <Ionicons name="briefcase-outline" size={16} color={colors.accent} />
        <Text className="flex-1 text-xs text-foreground">
          {t("edit_master_category_hint")}
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

      <PickerField
        label={t("service_category")}
        placeholder={selectedCategory?.name ?? t("service_category_placeholder")}
        loading={categoriesLoading}
        disabled={!baseCategoryGuid}
        value={selectedCategory?.name ?? null}
        options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
        onSelect={(v) => setCategoryId(Number(v))}
      />

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

      <PickerField
        label={t("district")}
        placeholder={t("district_placeholder")}
        loading={districtsLoading}
        disabled={!regionGuid}
        value={selectedDistrict?.name ?? null}
        options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
        onSelect={setDistrictGuid}
      />

      <TextField
        label={t("about_yourself")}
        placeholder={t("about_yourself_placeholder")}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button className="mt-2" loading={updateMutation.isPending} disabled={!canSubmit} onPress={handleSubmit}>
        {t("save")}
      </Button>
    </EditShell>
  );
}
