import { Pressable, Text, View } from "react-native";

interface UnderlineTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// "Я исполнитель / Я заказчик" pattern — underline indicator instead of a
// filled pill, used where the two tabs are peers of a page title rather than
// a filter (e.g. Orders' worker/client view switch).
export function UnderlineTabs<T extends string>({ options, value, onChange }: UnderlineTabsProps<T>) {
  return (
    <View className="flex-row border-b border-border">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center border-b-2 py-3 ${active ? "border-accent" : "border-transparent"}`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted"}`}>
              {opt.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
