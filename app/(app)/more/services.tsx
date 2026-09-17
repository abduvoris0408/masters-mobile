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
  const headerHeight = useHeaderHeight();
  return (
    <View className="flex-1 bg-background">
      <Header title="Katalog" onBackPress={() => router.back()} />
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        <EmptyState icon="pricetags-outline" title="Tez orada" description="Xizmatlar katalogi hozircha tayyor emas" />
      </View>
    </View>
  );
}
