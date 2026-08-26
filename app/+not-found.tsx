import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Sahifa topilmadi" }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-lg font-semibold text-foreground">Sahifa topilmadi</Text>
        <Link href="/" className="text-sm font-medium text-primary">
          Bosh sahifaga qaytish
        </Link>
      </View>
    </>
  );
}
