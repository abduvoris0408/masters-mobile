import { router } from "expo-router";
import { Alert, View } from "react-native";

import { ApplicationWizard } from "@/components/wizard/ApplicationWizard";
import { Header } from "@/components/ui/Header";
import { useCreateApplicationMutation } from "@/services/application";

export default function CreateApplicationScreen() {
  const createMutation = useCreateApplicationMutation();

  return (
    <View className="flex-1 bg-background">
      <Header title="Elon berish" onBackPress={() => router.back()} />
      <ApplicationWizard
        submitting={createMutation.isPending}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values);
            router.replace("/");
          } catch {
            Alert.alert("Xatolik", "Elonni joylashda xatolik yuz berdi. Qayta urinib ko'ring.");
          }
        }}
      />
    </View>
  );
}
