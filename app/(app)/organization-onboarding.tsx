import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useRoleUpdateMutation } from "@/services/auth";
import { useCreateMasterProfileMutation, useCountriesQuery, useDistrictsQuery, useJobsBaseCategoriesQuery, useJobsCategoriesQuery, useRegionsQuery } from "@/services/master";
import { useCreateOrganizationMutation } from "@/services/organization";
import { useAuthStore } from "@/stores";
import { USER_ROLE_ID } from "@/constants";
import { ELegalForm, EProfileType, EUserType } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

const LEGAL_FORM_KEYS: Record<ELegalForm, string> = {
  [ELegalForm.MCHJ]: "legal_form_mchj",
  [ELegalForm.YATT]: "legal_form_yatt",
  [ELegalForm.XK]: "legal_form_xk",
  [ELegalForm.AJ]: "legal_form_aj",
  [ELegalForm.OTHER]: "legal_form_other",
};

// Mobile counterpart to the web project's organization-onboarding page —
// simplified to a single region/district (not the web form's multi-select +
// "operates everywhere" toggle) to keep the first mobile pass usable; can be
// widened to match web exactly later without touching the API layer. Same
// sequence as web: role-update → createOrganization → createMasterProfile
// (type: ORGANIZATION, categories: []) — an organization's own service
// offering lives on the organization record itself, not on this profile.
export default function OrganizationOnboardingScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [legalForm, setLegalForm] = useState<ELegalForm | null>(null);
  const [stir, setStir] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [directorFullName, setDirectorFullName] = useState("");
  const [directorPhone, setDirectorPhone] = useState("");
  const [description, setDescription] = useState("");
  const [baseCategoryGuid, setBaseCategoryGuid] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [regionGuid, setRegionGuid] = useState<string | null>(null);
  const [districtGuid, setDistrictGuid] = useState<string | null>(null);

  const { data: countries } = useCountriesQuery();
  const { data: baseCategories, isLoading: baseCategoriesLoading } = useJobsBaseCategoriesQuery();
  const { data: categories, isLoading: categoriesLoading } = useJobsCategoriesQuery(baseCategoryGuid);
  const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
  const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(regionGuid);

  useEffect(() => {
    setCategoryId(null);
  }, [baseCategoryGuid]);

  const roleUpdateMutation = useRoleUpdateMutation();
  const createOrganizationMutation = useCreateOrganizationMutation();
  const createProfileMutation = useCreateMasterProfileMutation();
  const isSaving = roleUpdateMutation.isPending || createOrganizationMutation.isPending || createProfileMutation.isPending;

  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === baseCategoryGuid);
  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const selectedRegion = regions?.find((r) => r.guid === regionGuid);
  const selectedDistrict = districts?.find((d) => d.guid === districtGuid);

  const canSubmit =
    name.trim() !== "" &&
    legalForm !== null &&
    stir.trim() !== "" &&
    /^\d{4}-\d{2}-\d{2}$/.test(registeredAt) &&
    legalAddress.trim() !== "" &&
    directorFullName.trim() !== "" &&
    directorPhone.trim().length > 3 &&
    categoryId !== null &&
    regionGuid !== null &&
    districtGuid !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !countries?.length) return;
    const regionId = regions?.find((r) => r.guid === regionGuid)?.id;
    const districtId = districts?.find((d) => d.guid === districtGuid)?.id;
    if (!regionId || !districtId) return;

    try {
      await roleUpdateMutation.mutateAsync({ role: [USER_ROLE_ID.MASTER, USER_ROLE_ID.ORGANIZATION] });
      await createOrganizationMutation.mutateAsync({
        data: {
          name: name.trim(),
          legal_form: legalForm as ELegalForm,
          description: description.trim() || undefined,
          stir: stir.trim(),
          registered_at: registeredAt,
          legal_address: legalAddress.trim(),
          director_full_name: directorFullName.trim(),
          director_phone: directorPhone.trim(),
          country: countries[0].id,
          operates_regions: false,
          regions: [regionId],
          operates_districts: false,
          districts: [districtId],
          categories: categoryId ? [categoryId] : [],
        },
      });
      await createProfileMutation.mutateAsync({ type: EProfileType.ORGANIZATION, categories: [] });
      if (user) setUser({ ...user, user_type: EUserType.WORKER });
      showSuccess(t("org_onboarding_success"));
      router.replace("/(app)/(tabs)/profile");
    } catch {
      showError(t("onboarding_save_error"));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("org_onboarding_title")} onBackPress={() => router.back()} />

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
          <Ionicons name="business-outline" size={16} color={colors.accent} />
          <Text className="flex-1 text-xs text-foreground">
            {t("org_onboarding_hint")}
          </Text>
        </View>

        <TextField label={t("org_name")} placeholder={t("org_name_placeholder")} value={name} onChangeText={setName} />

        <PickerField
          label={t("legal_form")}
          placeholder={t("select")}
          value={legalForm ? t(LEGAL_FORM_KEYS[legalForm]) : null}
          options={Object.values(ELegalForm).map((v) => ({ value: v, label: t(LEGAL_FORM_KEYS[v]) }))}
          onSelect={(v) => setLegalForm(v as ELegalForm)}
        />

        <TextField label={t("stir")} placeholder="123456789" value={stir} onChangeText={setStir} keyboardType="number-pad" />

        <TextField
          label={t("registered_at")}
          placeholder="2020-01-31"
          value={registeredAt}
          onChangeText={setRegisteredAt}
        />

        <TextField label={t("legal_address")} placeholder={t("legal_address_placeholder")} value={legalAddress} onChangeText={setLegalAddress} />

        <TextField label={t("director_full_name")} placeholder={t("director_full_name_placeholder")} value={directorFullName} onChangeText={setDirectorFullName} />

        <TextField
          label={t("director_phone")}
          placeholder="+998901234567"
          value={directorPhone}
          onChangeText={setDirectorPhone}
          keyboardType="phone-pad"
        />

        <PickerField
          label={t("activity_direction")}
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
            value={selectedCategory?.name ?? null}
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            onSelect={(v) => setCategoryId(Number(v))}
          />
        ) : null}

        <PickerField
          label={t("service_region")}
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
            value={selectedDistrict?.name ?? null}
            options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
            onSelect={setDistrictGuid}
          />
        ) : null}

        <TextField
          label={t("description_optional")}
          placeholder={t("org_description_placeholder")}
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
