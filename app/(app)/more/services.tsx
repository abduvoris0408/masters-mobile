import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";

// No GET endpoint for the plain services catalog exists in ENDPOINTS yet
// (IService's shape is typed, but nothing serves it) — kept as a route +
// empty state so the More sheet's structure matches the web app's, ready to
// wire up once the backend exposes a services/list endpoint.
export default function ServicesScreen() {
  const { t } = useTranslation("catalog");
  const headerHeight = useHeaderHeight();
  return (
    <View className="flex-1 bg-background">
      <Header title={t("services_title")} onBackPress={() => router.back()} />
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        <EmptyState icon="pricetags-outline" title={t("services_coming_soon_title")} description={t("services_coming_soon_description")} />
      </View>
    </View>
  );
}
