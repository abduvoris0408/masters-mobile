import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";

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

// Selectable list of category-scoped extra work items for the
// create-application wizard's optional additional-works step. Each row ends
// in a native switch (UISwitch on iOS, Material switch on Android), like a
// Settings list; tapping anywhere on the row toggles it too.
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
            accessibilityRole="switch"
            accessibilityState={{ checked: active }}
            className={`flex-row items-center gap-3 rounded-2xl border p-4 ${active ? "border-accent bg-emerald-50 dark:bg-accent/15" : "border-border bg-surface"}`}
          >
            <View className="flex-1 gap-0.5">
              <CardTitle style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>{work.name}</CardTitle>
              {work.description ? <Caption className="leading-5">{work.description}</Caption> : null}
            </View>
            <Switch value={active} onValueChange={() => onToggle(work.id)} trackColor={{ true: colors.accent }} />
          </Pressable>
        );
      })}
    </View>
  );
}
