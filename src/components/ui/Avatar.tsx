import { Image, Text, View } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <View
      className="items-center justify-center rounded-full bg-emerald-100"
      style={{ width: size, height: size }}
    >
      <Text className="font-semibold text-primary" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
