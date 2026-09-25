import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// @react-native-community/datetimepicker is a native module — it isn't
// bundled inside Expo Go, so a static top-level import throws at module
// load and takes the whole file down with it (surfaces as unrelated errors
// like "Property 'DatePickerField' doesn't exist"). Loaded lazily and
// guarded so Expo Go falls back to a plain text field below, while a
// dev-client/production build gets the real native picker.
type DateTimePickerModule = typeof import("@react-native-community/datetimepicker");
let dateTimePickerModule: DateTimePickerModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dateTimePickerModule = require("@react-native-community/datetimepicker");
} catch {
  dateTimePickerModule = null;
}

import { MapLocationPicker } from "@/components/MapLocationPicker";
import { Button } from "@/components/ui/Button";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { BadgeLabel, Caption, ScreenTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useApplicationTitleSuggestionsQuery } from "@/services/application";
import {
  useDistrictsQuery,
  useJobsBaseCategoriesQuery,
  useJobsCategoriesQuery,
  useJobsCategoryAdditionalWorksQuery,
  useRegionsQuery,
} from "@/services/master";
import type { IApplicationCategoryRef, ICreateApplicationRequest, TPaymentType } from "@/types";
import { formatDate, formatPrice } from "@/utils/format";
import { AdditionalWorksChecklist } from "./AdditionalWorksChecklist";
import { ChoiceCard } from "./ChoiceCard";
import { PaymentTypeOption } from "./PaymentTypeOption";
import { WizardStepImages, type IPendingApplicationImage } from "./WizardStepImages";

const DATE_FORMAT = "YYYY-MM-DD";

export const STEP_KEYS = [
  "category",
  "description",
  "additional_works",
  "location",
  "timing",
  "budget",
  "images",
  "review",
] as const;
type TStepKey = (typeof STEP_KEYS)[number];

interface WizardState {
  title: string;
  base_category: string | null;
  category: number | null;
  description: string;
  region: string | null;
  district: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  budget_from: string;
  budget_to: string;
  is_urgent: boolean | null;
  date_from: string | null;
  date_to: string | null;
  payment_type: TPaymentType;
  additional_works: number[];
}

const INITIAL_STATE: WizardState = {
  title: "",
  base_category: null,
  category: null,
  description: "",
  region: null,
  district: null,
  address: "",
  latitude: null,
  longitude: null,
  budget_from: "",
  budget_to: "",
  is_urgent: null,
  date_from: null,
  date_to: null,
  payment_type: "escrow",
  additional_works: [],
};

const BUDGET_PRESETS = [80_000, 150_000, 300_000, 600_000];

interface ApplicationWizardProps {
  onFinish: (values: ICreateApplicationRequest) => void | Promise<void>;
  submitting?: boolean;
}

// RN port of the web project's ApplicationWizard (src/pages/applications/create
// in the ustabor-front repo) — same 8-step flow and field set, minus antd
// Form/Tour/tips-panel scaffolding this platform doesn't have. The location
// step uses MapLocationPicker (react-native-maps for the tile layer, since
// Yandex's JS SDK is web-only, + the same Yandex Geocoder REST calls the web
// app uses for search/reverse-geocode) — see src/components/MapLocationPicker.tsx.
export function ApplicationWizard({ onFinish, submitting = false }: ApplicationWizardProps) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [values, setValues] = useState<WizardState>(INITIAL_STATE);
  const [matchedCategory, setMatchedCategory] = useState<IApplicationCategoryRef | null>(null);
  const [titleQuery, setTitleQuery] = useState("");
  const [pendingImages, setPendingImages] = useState<IPendingApplicationImage[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardState, string>>>({});

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const { data: baseCategories, isLoading: baseCategoriesLoading } = useJobsBaseCategoriesQuery();
  const { data: categories, isLoading: categoriesLoading } = useJobsCategoriesQuery(values.base_category);
  const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
  const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(values.region);
  const { data: titleSuggestions } = useApplicationTitleSuggestionsQuery(titleQuery.trim());

  const categoryGuid = matchedCategory?.guid ?? categories?.find((c) => c.id === values.category)?.guid ?? null;
  const { data: additionalWorks, isLoading: additionalWorksLoading } = useJobsCategoryAdditionalWorksQuery(categoryGuid);

  const stepKey = STEP_KEYS[stepIndex];
  const totalSteps = STEP_KEYS.length;
  const percent = Math.round((stepIndex / (totalSteps - 1)) * 100);

  const goToStep = (index: number) => {
    setVisitedSteps((prev) => new Set(prev).add(index));
    setStepIndex(index);
  };

  const validateStep = (): boolean => {
    const nextErrors: Partial<Record<keyof WizardState, string>> = {};
    if (stepKey === "category") {
      if (!values.title.trim()) nextErrors.title = t("wizard_error_title_required");
      if (!matchedCategory) {
        if (!values.base_category) nextErrors.base_category = t("wizard_error_base_category_required");
        if (!values.category) nextErrors.category = t("wizard_error_category_required");
      }
    } else if (stepKey === "description") {
      if (!values.description.trim()) nextErrors.description = t("wizard_error_description_required");
    } else if (stepKey === "location") {
      if (!values.address.trim()) nextErrors.address = t("wizard_error_address_required");
    } else if (stepKey === "budget") {
      if (!values.budget_from) nextErrors.budget_from = t("wizard_error_budget_from_required");
      if (!values.budget_to) nextErrors.budget_to = t("wizard_error_budget_to_required");
      else if (Number(values.budget_to) < Number(values.budget_from || 0)) {
        nextErrors.budget_to = t("wizard_error_budget_to_min");
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = async () => {
    if (stepKey === "review") {
      const region = regions?.find((r) => r.guid === values.region);
      const district = districts?.find((d) => d.guid === values.district);
      await onFinish({
        title: values.title,
        category: (matchedCategory?.id ?? values.category) as number,
        description: values.description,
        address: values.address,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        region: region?.id,
        district: district?.id,
        budget_from: Number(values.budget_from),
        budget_to: Number(values.budget_to),
        is_urgent: !!values.is_urgent,
        payment_type: values.payment_type,
        date_from: values.date_from ?? undefined,
        date_to: values.date_to ?? undefined,
        additional_works: values.additional_works,
        images: pendingImages.filter((img) => img.serverId != null).map((img) => img.serverId as number),
      });
      return;
    }
    if (!validateStep()) return;
    goToStep(stepIndex + 1);
  };

  const handleBack = () => goToStep(Math.max(0, stepIndex - 1));

  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === values.base_category);
  const selectedCategory = categories?.find((c) => c.id === values.category);
  const selectedRegion = regions?.find((r) => r.guid === values.region);
  const selectedDistrict = districts?.find((d) => d.guid === values.district);

  const stepMeta: Record<TStepKey, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = useMemo(
    () => ({
      category: { title: t("wizard_step_category_title"), subtitle: t("wizard_step_category_subtitle"), icon: "text-outline" },
      description: { title: t("wizard_step_description_title"), subtitle: t("wizard_step_description_subtitle"), icon: "document-text-outline" },
      additional_works: { title: t("wizard_step_additional_works_title"), subtitle: t("wizard_step_additional_works_subtitle"), icon: "list-outline" },
      location: { title: t("wizard_step_location_title"), subtitle: t("wizard_step_location_subtitle"), icon: "location-outline" },
      timing: { title: t("wizard_step_timing_title"), subtitle: t("wizard_step_timing_subtitle"), icon: "calendar-outline" },
      budget: { title: t("wizard_step_budget_title"), subtitle: t("wizard_step_budget_subtitle"), icon: "wallet-outline" },
      images: { title: t("wizard_step_images_title"), subtitle: t("wizard_step_images_subtitle"), icon: "image-outline" },
      review: { title: t("wizard_step_review_title"), subtitle: t("wizard_step_review_subtitle"), icon: "checkmark-circle-outline" },
    }),
    [t],
  );
  const meta = stepMeta[stepKey];

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="gap-3 px-4 pt-3" style={{ paddingTop: headerHeight + 12 }}>
        <View className="flex-row items-center gap-2.5">
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <View className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </View>
          <BadgeLabel className="text-accent">{percent}%</BadgeLabel>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 py-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-2">
          <Ionicons name={meta.icon} size={18} color={colors.accent} />
          <ScreenTitle>{meta.title}</ScreenTitle>
        </View>
        <Text className="-mt-2 text-sm text-muted">{meta.subtitle}</Text>

        {stepKey === "category" && (
          <View className="gap-3">
            <TextField
              label={t("wizard_job_title_label")}
              placeholder={t("wizard_job_title_placeholder")}
              value={values.title}
              onChangeText={(v) => {
                set("title", v);
                setTitleQuery(v);
                if (matchedCategory) {
                  setMatchedCategory(null);
                  set("category", null);
                }
              }}
              error={errors.title}
            />

            {titleSuggestions && titleSuggestions.results.length > 0 && !matchedCategory ? (
              <View className="gap-1.5 rounded-2xl bg-surface p-2">
                {titleSuggestions.results.slice(0, 5).map((s) => (
                  <Pressable
                    key={s.guid}
                    onPress={() => {
                      set("title", s.title);
                      set("category", s.category.id);
                      setMatchedCategory(s.category);
                    }}
                    className="flex-row items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                  >
                    <Text className="flex-1 text-sm text-foreground">{s.title}</Text>
                    <View className="rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-accent/15">
                      <Text className="text-xs text-accent">{s.category.name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {matchedCategory ? (
              <View className="flex-row items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
                <Text className="flex-1 text-sm text-foreground">
                  {t("wizard_matched_category_label")} <Text style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>{matchedCategory.name}</Text>
                </Text>
                <Pressable
                  onPress={() => {
                    setMatchedCategory(null);
                    set("category", null);
                  }}
                >
                  <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                    {t("wizard_change_button")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                <Text className="text-xs text-muted">{t("wizard_no_title_match")}</Text>
                <PickerField
                  label={t("wizard_direction_label")}
                  placeholder={t("wizard_direction_placeholder")}
                  loading={baseCategoriesLoading}
                  value={selectedBaseCategory?.name ?? null}
                  options={(baseCategories ?? []).map((bc) => ({ value: bc.guid, label: bc.name }))}
                  onSelect={(guid) => {
                    set("base_category", guid);
                    set("category", null);
                  }}
                  error={errors.base_category}
                />
                {values.base_category ? (
                  <PickerField
                    label={t("wizard_category_label")}
                    placeholder={t("wizard_category_placeholder")}
                    loading={categoriesLoading}
                    value={selectedCategory?.name ?? null}
                    options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
                    onSelect={(v) => set("category", Number(v))}
                    error={errors.category}
                  />
                ) : null}
              </View>
            )}
          </View>
        )}

        {visitedSteps.has(1) && stepKey === "description" && (
          <TextField
            placeholder={t("wizard_description_placeholder")}
            value={values.description}
            onChangeText={(v) => set("description", v)}
            multiline
            numberOfLines={5}
            style={{ height: 120, textAlignVertical: "top", paddingTop: 12 }}
            error={errors.description}
          />
        )}

        {visitedSteps.has(2) && stepKey === "additional_works" && (
          <AdditionalWorksChecklist
            works={additionalWorks}
            loading={additionalWorksLoading}
            selected={values.additional_works}
            onToggle={(id) =>
              set(
                "additional_works",
                values.additional_works.includes(id)
                  ? values.additional_works.filter((v) => v !== id)
                  : [...values.additional_works, id],
              )
            }
            emptyText={t("wizard_additional_works_empty")}
          />
        )}

        {visitedSteps.has(3) && stepKey === "location" && (
          <View className="gap-3">
            <MapLocationPicker
              value={values.latitude != null && values.longitude != null ? { lat: values.latitude, lng: values.longitude } : null}
              onChange={({ lat, lng }) => {
                set("latitude", lat);
                set("longitude", lng);
              }}
              onAddressResolved={(resolved) => {
                if (resolved.address) set("address", resolved.address);
                const matchedRegion = regions?.find((r) => r.name === resolved.regionName);
                if (matchedRegion) {
                  set("region", matchedRegion.guid);
                  set("district", null);
                }
              }}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <PickerField
                  label={t("wizard_region_label")}
                  placeholder={t("wizard_select_placeholder")}
                  loading={regionsLoading}
                  value={selectedRegion?.name ?? null}
                  options={(regions ?? []).map((r) => ({ value: r.guid, label: r.name }))}
                  onSelect={(guid) => {
                    set("region", guid);
                    set("district", null);
                  }}
                />
              </View>
              <View className="flex-1">
                <PickerField
                  label={t("wizard_district_label")}
                  placeholder={t("wizard_select_placeholder")}
                  loading={districtsLoading}
                  disabled={!values.region}
                  value={selectedDistrict?.name ?? null}
                  options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
                  onSelect={(guid) => set("district", guid)}
                />
              </View>
            </View>
            <TextField
              label={t("field_address")}
              placeholder={t("wizard_address_placeholder")}
              value={values.address}
              onChangeText={(v) => set("address", v)}
              error={errors.address}
            />
          </View>
        )}

        {visitedSteps.has(4) && stepKey === "timing" && (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <ChoiceCard
                active={values.is_urgent === true}
                icon={<Ionicons name="flash" size={18} color={colors.accent} />}
                title={t("field_urgent")}
                description={t("wizard_urgent_description")}
                onPress={() => {
                  set("is_urgent", true);
                  set("date_from", null);
                  set("date_to", null);
                }}
              />
              <ChoiceCard
                active={values.is_urgent === false}
                icon={<Ionicons name="calendar-outline" size={18} color={colors.accent} />}
                title={t("wizard_scheduled_title")}
                description={t("wizard_scheduled_description")}
                onPress={() => set("is_urgent", false)}
              />
            </View>

            {values.is_urgent === false ? (
              <View className="gap-3">
                <View className="flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={() => {
                      const today = dayjs().format(DATE_FORMAT);
                      set("date_from", today);
                      set("date_to", today);
                    }}
                    className="rounded-full bg-surface px-3.5 py-2"
                  >
                    <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                      {t("wizard_date_today")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const tomorrow = dayjs().add(1, "day").format(DATE_FORMAT);
                      set("date_from", tomorrow);
                      set("date_to", tomorrow);
                    }}
                    className="rounded-full bg-surface px-3.5 py-2"
                  >
                    <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                      {t("wizard_date_tomorrow")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      set("date_from", dayjs().format(DATE_FORMAT));
                      set("date_to", dayjs().add(6, "day").format(DATE_FORMAT));
                    }}
                    className="rounded-full bg-surface px-3.5 py-2"
                  >
                    <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                      {t("wizard_date_this_week")}
                    </Text>
                  </Pressable>
                </View>

                <DatePickerField
                  label={t("wizard_date_from_label")}
                  value={values.date_from}
                  minimumDate={new Date()}
                  onChange={(date) => set("date_from", date)}
                />
                <DatePickerField
                  label={t("wizard_date_to_label")}
                  value={values.date_to}
                  minimumDate={values.date_from ? dayjs(values.date_from).toDate() : new Date()}
                  onChange={(date) => set("date_to", date)}
                />
              </View>
            ) : null}
          </View>
        )}

        {visitedSteps.has(5) && stepKey === "budget" && (
          <View className="gap-4">
            <View className="flex-row gap-3">
              <TextField
                className="flex-1"
                label={t("field_budget_from")}
                placeholder="100 000"
                keyboardType="number-pad"
                value={values.budget_from}
                onChangeText={(v) => set("budget_from", v.replace(/[^0-9]/g, ""))}
                error={errors.budget_from}
              />
              <TextField
                className="flex-1"
                label={t("field_budget_to")}
                placeholder="200 000"
                keyboardType="number-pad"
                value={values.budget_to}
                onChangeText={(v) => set("budget_to", v.replace(/[^0-9]/g, ""))}
                error={errors.budget_to}
              />
            </View>

            <View className="flex-row flex-wrap gap-2">
              {BUDGET_PRESETS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => {
                    set("budget_from", String(amount));
                    set("budget_to", String(Math.round(amount * 1.5)));
                  }}
                  className="rounded-full bg-surface px-3.5 py-2"
                >
                  <Text className="text-xs text-foreground">{formatPrice(amount)}</Text>
                </Pressable>
              ))}
            </View>

            <View className="gap-2.5">
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("field_payment_type")}
              </Text>
              <PaymentTypeOption
                active={values.payment_type === "escrow"}
                title={t("payment_escrow_title")}
                badge={t("payment_recommended_badge")}
                description={t("wizard_payment_escrow_description")}
                onPress={() => set("payment_type", "escrow")}
              />
              <PaymentTypeOption
                active={values.payment_type === "direct"}
                title={t("payment_direct_title")}
                description={t("wizard_payment_direct_description")}
                onPress={() => set("payment_type", "direct")}
              />
            </View>
          </View>
        )}

        {visitedSteps.has(6) && stepKey === "images" && (
          <WizardStepImages images={pendingImages} onChange={setPendingImages} />
        )}

        {stepKey === "review" && (
          <View className="overflow-hidden rounded-2xl border border-border">
            <ReviewRow icon="text-outline" label={t("field_title")} value={values.title || "—"} onEdit={() => goToStep(0)} />
            <ReviewRow
              icon="pricetags-outline"
              label={t("wizard_category_label")}
              value={
                matchedCategory?.name ??
                ([selectedBaseCategory?.name, selectedCategory?.name].filter(Boolean).join(" — ") || "—")
              }
              onEdit={() => goToStep(0)}
            />
            <ReviewRow icon="document-text-outline" label={t("field_description")} value={values.description || "—"} onEdit={() => goToStep(1)} />
            <ReviewRow
              icon="location-outline"
              label={t("field_address")}
              value={[selectedRegion?.name, selectedDistrict?.name, values.address].filter(Boolean).join(", ") || "—"}
              onEdit={() => goToStep(3)}
            />
            <ReviewRow
              icon="calendar-outline"
              label={t("wizard_step_timing_title")}
              value={
                values.is_urgent
                  ? t("field_urgent")
                  : values.date_from && values.date_to
                    ? `${values.date_from} — ${values.date_to}`
                    : t("deadline_negotiable")
              }
              onEdit={() => goToStep(4)}
            />
            <ReviewRow
              icon="wallet-outline"
              label={t("field_budget")}
              value={values.budget_from && values.budget_to ? `${formatPrice(Number(values.budget_from))} — ${formatPrice(Number(values.budget_to))}` : "—"}
              onEdit={() => goToStep(5)}
            />
            <ReviewRow
              icon="shield-checkmark-outline"
              label={t("field_payment_type")}
              value={values.payment_type === "direct" ? t("payment_direct_title") : t("payment_escrow_title")}
              onEdit={() => goToStep(5)}
            />
            <ReviewRow
              icon="image-outline"
              label={t("wizard_step_images_title")}
              value={pendingImages.length > 0 ? t("wizard_images_count", { count: pendingImages.length }) : t("wizard_no_images")}
              onEdit={() => goToStep(6)}
              last
            />
          </View>
        )}

        <View className="flex-row gap-3 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
          {stepIndex > 0 ? (
            <Pressable
              onPress={handleBack}
              className="h-13 flex-row items-center justify-center gap-1.5 rounded-full bg-surface px-5"
              style={{ height: 52 }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.foreground} />
              <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                {t("common_back")}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleContinue}
            disabled={stepKey === "review" && submitting}
            className={`h-13 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-accent ${stepKey === "review" && submitting ? "opacity-60" : ""}`}
            style={{ height: 52 }}
          >
            {stepKey === "review" && submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                  {stepKey === "review" ? t("wizard_submit_button") : t("common_continue")}
                </Text>
                <Ionicons name={stepKey === "review" ? "paper-plane-outline" : "arrow-forward"} size={16} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  onEdit,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onEdit: () => void;
  last?: boolean;
}) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-start gap-3 bg-surface p-3.5 ${last ? "" : "border-b border-border"}`}>
      <Ionicons name={icon} size={16} color={colors.accent} style={{ marginTop: 2 }} />
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {value}
        </Text>
      </View>
      <Pressable onPress={onEdit}>
        <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
          {t("common_edit")}
        </Text>
      </Pressable>
    </View>
  );
}

// Android shows its date dialog imperatively (no inline mode); iOS renders
// the wheel inline inside a dismissible sheet so the user sees the picker
// without leaving the field, matching PickerField's own dropdown pattern.
function DatePickerField({
  label,
  value,
  minimumDate,
  onChange,
}: {
  label: string;
  value: string | null;
  minimumDate?: Date;
  onChange: (date: string) => void;
}) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const dateValue = value ? dayjs(value).toDate() : new Date();

  // No native module (Expo Go) — fall back to a plain YYYY-MM-DD text field
  // instead of crashing the whole wizard.
  if (!dateTimePickerModule) {
    return (
      <TextField
        label={`${label} (YYYY-MM-DD)`}
        placeholder={dayjs().format(DATE_FORMAT)}
        value={value ?? ""}
        onChangeText={(v) => onChange(v)}
      />
    );
  }

  const DateTimePicker = dateTimePickerModule.default;
  const { DateTimePickerAndroid } = dateTimePickerModule;

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: "date",
        minimumDate,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) onChange(dayjs(selected).format(DATE_FORMAT));
        },
      });
    } else {
      setIosPickerOpen((o) => !o);
    }
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
        {label}
      </Text>
      <Pressable
        onPress={open}
        className="h-13 flex-row items-center justify-between rounded-2xl bg-surface px-4"
        style={{ height: 52 }}
      >
        <Text className={value ? "text-base text-foreground" : "text-base text-muted"}>
          {value ? formatDate(value) : t("wizard_select_date")}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>

      {Platform.OS === "ios" && iosPickerOpen ? (
        <View className="overflow-hidden rounded-2xl bg-surface">
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            accentColor={colors.accent}
            onChange={(_, selected) => {
              if (selected) onChange(dayjs(selected).format(DATE_FORMAT));
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
