import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import type {
  IApplicationCategoryRef,
  IApplicationTitleSuggestion,
  IDjangoPaginated,
  IJobsBaseCategory,
  IJobsCategory,
} from "@/types";
import type { SetWizardValue, WizardState } from "../types";

interface CategoryStepProps {
  values: WizardState;
  set: SetWizardValue;
  errors: Partial<Record<keyof WizardState, string>>;
  matchedCategory: IApplicationCategoryRef | null;
  setMatchedCategory: (category: IApplicationCategoryRef | null) => void;
  setTitleQuery: (query: string) => void;
  titleSuggestions?: IDjangoPaginated<IApplicationTitleSuggestion>;
  baseCategories?: IJobsBaseCategory[];
  baseCategoriesLoading: boolean;
  categories?: IJobsCategory[];
  categoriesLoading: boolean;
}

export function CategoryStep({
  values,
  set,
  errors,
  matchedCategory,
  setMatchedCategory,
  setTitleQuery,
  titleSuggestions,
  baseCategories,
  baseCategoriesLoading,
  categories,
  categoriesLoading,
}: CategoryStepProps) {
  const { t } = useTranslation("orders");
  const selectedBaseCategory = baseCategories?.find((bc) => bc.guid === values.base_category);
  const selectedCategory = categories?.find((c) => c.id === values.category);

  return (
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
  );
}
