import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";

type OrdersView = "worker" | "client";

export default function OrdersScreen() {
  const [view, setView] = useState<OrdersView>("client");
  const headerHeight = useHeaderHeight();

  return (
    <View className="flex-1 bg-background">
      <Header title="Buyurtmalarim" onBackPress={() => router.push("/")} />
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        <UnderlineTabs
          value={view}
          onChange={setView}
          options={[
            { value: "worker", label: "Ijrochi sifatida" },
            { value: "client", label: "Buyurtmachi sifatida" },
          ]}
        />
        <EmptyState
          icon="document-text-outline"
          title={view === "worker" ? "Hali birorta buyurtma qabul qilmadingiz" : "Hali birorta elon joylashtirmadingiz"}
        />
      </View>
    </View>
  );
}
