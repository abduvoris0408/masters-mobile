import { Pressable, Text, View } from "react-native";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Pill switcher — "Все / Рекомендованные" pattern. Generic over the option
// value type so it works for any two/three-way toggle in the app.
export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <View className="flex-row rounded-full bg-surface p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center rounded-full py-2.5 ${active ? "bg-primary" : ""}`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-primary-foreground" : "text-muted"}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
