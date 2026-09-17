import { Pressable, ScrollView, Text } from "react-native";

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Horizontal scrollable pill row — "Barchasi / AKPP va MKPP ta'mirlash /
// Auditor" pattern from the Elonlar feed screenshot. Unlike SegmentedTabs
// (fixed-width, 2-3 options filling the row) this scrolls when there are
// more options than fit on screen.
export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`items-center justify-center rounded-full px-4 py-2.5 ${active ? "bg-accent" : "bg-surface"}`}
          >
            <Text className={`text-sm ${active ? "text-white" : "text-foreground"}`} style={{ fontWeight: active ? "700" : "500" }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
