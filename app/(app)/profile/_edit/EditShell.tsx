import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";

export function EditShell({ title, children }: { title: string; children: React.ReactNode }) {
  const headerHeight = useHeaderHeight();
  return (
    <View className="flex-1 bg-background">
      <Header title={title} onBackPress={() => router.back()} />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
