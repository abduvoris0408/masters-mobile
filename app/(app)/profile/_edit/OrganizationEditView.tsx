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
import { useCountriesQuery, useDistrictsQuery, useJobsBaseCategoriesQuery, useJobsCategoriesQuery, useRegionsQuery } from "@/services/master";
import { useUpdateOrganizationMutation } from "@/services/organization";
import { ELegalForm } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { EditShell } from "./EditShell";

const LEGAL_FORM_KEYS: Record<ELegalForm, string> = {
  [ELegalForm.MCHJ]: "legal_form_mchj",
  [ELegalForm.YATT]: "legal_form_yatt",
  [ELegalForm.XK]: "legal_form_xk",
  [ELegalForm.AJ]: "legal_form_aj",
  [ELegalForm.OTHER]: "legal_form_other",
};

export function OrganizationEditView({ organizationGuid }: { organizationGuid: string | null }) {
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
