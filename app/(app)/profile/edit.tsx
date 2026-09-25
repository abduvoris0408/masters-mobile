import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { CardTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import {
  useCountriesQuery,
  useDistrictsQuery,
  useExperienceLevelsQuery,
  useJobsBaseCategoriesQuery,
  useJobsCategoriesQuery,
  useRegionsQuery,
  useUpdateMasterProfileMutation,
} from "@/services/master";
import { useUpdateOrganizationMutation } from "@/services/organization";
import { useUpdateUserProfileMutation } from "@/services/user";
import { useAuthStore } from "@/stores";
import { ELegalForm, EProfileType } from "@/types";
import { formatPhoneNumber } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const LEGAL_FORM_KEYS: Record<ELegalForm, string> = {
  [ELegalForm.MCHJ]: "legal_form_mchj",
  [ELegalForm.YATT]: "legal_form_yatt",
  [ELegalForm.XK]: "legal_form_xk",
  [ELegalForm.AJ]: "legal_form_aj",
  [ELegalForm.OTHER]: "legal_form_other",
};

// Mobile counterpart to the web project's profile-edit page — one screen
// branching by account kind instead of web's separate ClientEditView /
// MasterEditForm components, since RN doesn't need the route split. No
// profile-type switch here (that's what master-onboarding / organization-
// onboarding are for) — this only edits fields already established.
export default function ProfileEditScreen() {
  const { masterProfile, isWorker, isOrganization, organization, isLoading } = useProfilePerspective();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isOrganization) return <OrganizationEditView organizationGuid={organization?.guid ?? null} />;
  if (isWorker && masterProfile) return <MasterEditView profileGuid={masterProfile.guid} />;
  return <ClientEditView />;
}

function EditShell({ title, children }: { title: string; children: React.ReactNode }) {
  const headerHeight = useHeaderHeight();
  return (
    <View className="flex-1 bg-background">
      <Header title={title} onBackPress={() => router.back()} />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

function ClientEditView() {
  const { t } = useTranslation("profile");
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.first_name ?? "");
  const [surname, setSurname] = useState(user?.last_name ?? "");
  const [middleName, setMiddleName] = useState(user?.middle_name ?? "");

  const updateMutation = useUpdateUserProfileMutation();
  const canSubmit = name.trim() !== "" && surname.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await updateMutation.mutateAsync({ name: name.trim(), surname: surname.trim(), middle_name: middleName.trim() || undefined });
      showSuccess(t("edit_save_success"));
      router.back();
    } catch {
      showError(t("edit_save_error"));
    }
  };

  return (
    <EditShell title={t("edit_title")}>
      <TextField label={t("first_name")} placeholder={t("first_name_placeholder")} value={name} onChangeText={setName} />
      <TextField label={t("last_name")} placeholder={t("last_name_placeholder")} value={surname} onChangeText={setSurname} />
      <TextField label={t("middle_name_optional")} placeholder={t("middle_name_placeholder")} value={middleName} onChangeText={setMiddleName} />

      <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
        <Text className="text-sm text-muted">{t("phone_number")}</Text>
        <CardTitle>{formatPhoneNumber(user?.phone)}</CardTitle>
      </View>

      <Button className="mt-2" loading={updateMutation.isPending} disabled={!canSubmit} onPress={handleSubmit}>
        {t("save")}
      </Button>
    </EditShell>
  );
}

function MasterEditView({ profileGuid }: { profileGuid: string }) {
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

function OrganizationEditView({ organizationGuid }: { organizationGuid: string | null }) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const { organization } = useProfilePerspective();

  const [name, setName] = useState(organization?.name ?? "");
  const [legalForm, setLegalForm] = useState<ELegalForm | null>(organization?.legal_form ?? null);
  const [stir, setStir] = useState(organization?.stir ?? "");
  const [registeredAt, setRegisteredAt] = useState(organization?.registered_at ?? "");
  const [legalAddress, setLegalAddress] = useState(organization?.legal_address ?? "");
  const [directorFullName, setDirectorFullName] = useState(organization?.director_full_name ?? "");
  const [directorPhone, setDirectorPhone] = useState(organization?.director_phone ?? "");
  const [description, setDescription] = useState(organization?.description ?? "");
  const [baseCategoryGuid, setBaseCategoryGuid] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(organization?.categories[0]?.id ?? null);
  const [regionGuid, setRegionGuid] = useState<string | null>(null);
  const [districtGuid, setDistrictGuid] = useState<string | null>(null);

  const { data: countries } = useCountriesQuery();
  const { data: baseCategories, isLoading: baseCategoriesLoading } = useJobsBaseCategoriesQuery();
  const { data: categories, isLoading: categoriesLoading } = useJobsCategoriesQuery(baseCategoryGuid);
  const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
  const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(regionGuid);

  useEffect(() => {
    if (baseCategoryGuid) setCategoryId(null);
  }, [baseCategoryGuid]);

  // organization.regions/districts come back as either a plain display
  // string or an id-bearing ref array depending on the endpoint — this
  // screen only has the display-string shape available (from
  // useMyOrganizationQuery), so the region/district pickers start empty and
  // must be re-picked to change them, same limitation the onboarding
  // screen's simpler single-region model already has.
  const existingRegionLabel = typeof organization?.regions === "string" ? organization.regions : undefined;
  const existingDistrictLabel = typeof organization?.districts === "string" ? organization.districts : undefined;

  const updateMutation = useUpdateOrganizationMutation(organizationGuid ?? "");

  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === baseCategoryGuid);
  const selectedCategory =
    categories?.find((c) => c.id === categoryId) ??
    (categoryId ? organization?.categories.find((c) => c.id === categoryId) : undefined);
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
    !!organizationGuid;

  const handleSubmit = async () => {
    if (!canSubmit || !countries?.length || !organizationGuid) return;
    const regionId = regions?.find((r) => r.guid === regionGuid)?.id;
    const districtId = districts?.find((d) => d.guid === districtGuid)?.id;

    try {
      await updateMutation.mutateAsync({
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
          regions: regionId ? [regionId] : [],
          operates_districts: false,
          districts: districtId ? [districtId] : [],
          categories: categoryId ? [categoryId] : [],
        },
      });
      showSuccess(t("edit_org_updated"));
      router.back();
    } catch {
      showError(t("edit_save_error"));
    }
  };

  return (
    <EditShell title={t("edit_org_title")}>
      <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
        <Ionicons name="business-outline" size={16} color={colors.accent} />
        <Text className="flex-1 text-xs text-foreground">{t("edit_org_region_hint")}</Text>
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

      <TextField label={t("registered_at")} placeholder="2020-01-31" value={registeredAt} onChangeText={setRegisteredAt} />

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
        label={t("service_region")}
        placeholder={existingRegionLabel ?? t("region_placeholder")}
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
        placeholder={existingDistrictLabel ?? t("district_placeholder")}
        loading={districtsLoading}
        disabled={!regionGuid}
        value={selectedDistrict?.name ?? null}
        options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
        onSelect={setDistrictGuid}
      />

      <TextField
        label={t("description")}
        placeholder={t("org_description_placeholder")}
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
