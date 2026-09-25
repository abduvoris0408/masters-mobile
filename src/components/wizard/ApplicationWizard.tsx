import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { TextField } from "@/components/ui/TextField";
import { BadgeLabel, ScreenTitle } from "@/components/ui/Typography";
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
import type { IApplicationCategoryRef, ICreateApplicationRequest } from "@/types";
import { AdditionalWorksChecklist } from "./AdditionalWorksChecklist";
import { BudgetStep } from "./steps/BudgetStep";
import { CategoryStep } from "./steps/CategoryStep";
import { LocationStep } from "./steps/LocationStep";
import { ReviewStep } from "./steps/ReviewStep";
import { TimingStep } from "./steps/TimingStep";
import { INITIAL_WIZARD_STATE, STEP_KEYS, type TStepKey, type WizardState } from "./types";
import { WizardStepImages, type IPendingApplicationImage } from "./WizardStepImages";

interface ApplicationWizardProps {
  onFinish: (values: ICreateApplicationRequest) => void | Promise<void>;
  submitting?: boolean;
}

// RN port of the web project's ApplicationWizard (src/pages/applications/create
// in the ustabor-front repo) — same 8-step flow and field set, minus antd
// Form/Tour/tips-panel scaffolding this platform doesn't have. Each step's
// body lives in ./steps/*Step.tsx; this file only owns the shared wizard
// state, validation, and step navigation/animation shell.
export function ApplicationWizard({ onFinish, submitting = false }: ApplicationWizardProps) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [values, setValues] = useState<WizardState>(INITIAL_WIZARD_STATE);
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

  // Content used to just swap instantly on stepIndex change, which felt
  // flat/dry next to the animated progress bar. Fade + rise the whole step
  // body back in each time stepIndex changes, mirroring OnboardingSlide's
  // treatment in app/(onboarding)/index.tsx.
  const stepProgress = useSharedValue(0);
  useEffect(() => {
    stepProgress.value = 0;
    stepProgress.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [stepIndex, stepProgress]);
  const stepAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepProgress.value,
    transform: [{ translateY: (1 - stepProgress.value) * 14 }],
  }));

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
        <Animated.View style={[{ gap: 16 }, stepAnimatedStyle]}>
          <View className="flex-row items-center gap-2">
            <Ionicons name={meta.icon} size={18} color={colors.accent} />
            <ScreenTitle>{meta.title}</ScreenTitle>
          </View>
          <Text className="-mt-2 text-sm text-muted">{meta.subtitle}</Text>

          {stepKey === "category" && (
            <CategoryStep
              values={values}
              set={set}
              errors={errors}
              matchedCategory={matchedCategory}
              setMatchedCategory={setMatchedCategory}
              setTitleQuery={setTitleQuery}
              titleSuggestions={titleSuggestions}
              baseCategories={baseCategories}
              baseCategoriesLoading={baseCategoriesLoading}
              categories={categories}
              categoriesLoading={categoriesLoading}
            />
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
            <LocationStep
              values={values}
              set={set}
              errors={errors}
              regions={regions}
              regionsLoading={regionsLoading}
              districts={districts}
              districtsLoading={districtsLoading}
            />
          )}

          {visitedSteps.has(4) && stepKey === "timing" && <TimingStep values={values} set={set} />}

          {visitedSteps.has(5) && stepKey === "budget" && <BudgetStep values={values} set={set} errors={errors} />}

          {visitedSteps.has(6) && stepKey === "images" && (
            <WizardStepImages images={pendingImages} onChange={setPendingImages} />
          )}

          {stepKey === "review" && (
            <ReviewStep
              values={values}
              matchedCategory={matchedCategory}
              selectedBaseCategory={selectedBaseCategory}
              selectedCategory={selectedCategory}
              selectedRegion={selectedRegion}
              selectedDistrict={selectedDistrict}
              pendingImages={pendingImages}
              goToStep={goToStep}
            />
          )}
        </Animated.View>

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
