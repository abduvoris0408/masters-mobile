import Checkbox from "expo-checkbox";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { CardTitle, Caption } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import type { IJobsCategoryAdditionalWork } from "@/types";

interface AdditionalWorksChecklistProps {
  works?: IJobsCategoryAdditionalWork[];
  loading: boolean;
  selected: number[];
  onToggle: (id: number) => void;
  emptyText: string;
}

// Selectable list of category-scoped extra work items — mirrors the web
// wizard's AdditionalWorksChecklist (checkbox-card pattern, emerald active
// state) for the create-application wizard's optional additional-works step.
export function AdditionalWorksChecklist({ works, loading, selected, onToggle, emptyText }: AdditionalWorksChecklistProps) {
  const colors = useThemeColors();

  if (loading) return <ActivityIndicator color={colors.accent} className="py-6" />;

  if (!works || works.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-sm text-muted">{emptyText}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5">
      {works.map((work) => {
        const active = selected.includes(work.id);
        return (
          <Pressable
            key={work.id}
            onPress={() => onToggle(work.id)}
            className={`flex-row items-start gap-3 rounded-2xl border p-4 ${active ? "border-accent bg-emerald-50 dark:bg-accent/15" : "border-border bg-surface"}`}
          >
            <Checkbox
              value={active}
              onValueChange={() => onToggle(work.id)}
              color={active ? colors.accent : undefined}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1 gap-0.5">
              <CardTitle style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>{work.name}</CardTitle>
              {work.description ? <Caption className="leading-5">{work.description}</Caption> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
