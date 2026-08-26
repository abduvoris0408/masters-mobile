import { useState } from "react";
import { View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { UnderlineTabs } from "@/components/ui/UnderlineTabs";
import { useAppDrawer } from "@/providers/DrawerProvider";

type OrdersView = "worker" | "client";

export default function OrdersScreen() {
  const { open } = useAppDrawer();
  const [view, setView] = useState<OrdersView>("client");

  return (
    <View className="flex-1 bg-background">
      <Header title="Buyurtmalarim" onMenuPress={open} />
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
  );
}
