import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  const { t } = useTranslation("common");
  return (
    <>
      <Stack.Screen options={{ title: t("not_found_title") }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-lg font-semibold text-foreground">{t("not_found_title")}</Text>
        <Link href="/" className="text-sm font-medium text-primary">
          {t("back_home")}
        </Link>
      </View>
    </>
  );
}
