import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

interface PillTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Segmented-control tab switch — a filled rounded pill on the active tab
// inside a lighter track, no underline. Used where the tabs are peers of a
// page title (e.g. Orders' worker/client view switch) and the reference
// design shows a soft pill group rather than an underline indicator.
export function PillTabs<T extends string>({ options, value, onChange }: PillTabsProps<T>) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-1 rounded-2xl bg-surface p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-emerald-50 dark:bg-accent/15" : ""}`}
          >
            <Text
              className="text-sm"
              style={{
                fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium,
                color: active ? colors.accent : colors.muted,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
