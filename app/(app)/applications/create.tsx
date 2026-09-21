import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { ApplicationWizard } from "@/components/wizard/ApplicationWizard";
import { Header } from "@/components/ui/Header";
import { useCreateApplicationMutation } from "@/services/application";

export default function CreateApplicationScreen() {
  const { t } = useTranslation("orders");
  const createMutation = useCreateApplicationMutation();

  return (
    <View className="flex-1 bg-background">
      <Header title={t("create_application_header")} onBackPress={() => router.back()} />
      <ApplicationWizard
        submitting={createMutation.isPending}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values);
            router.replace("/");
          } catch {
            Alert.alert(t("common_error_title"), t("create_application_error"));
          }
        }}
      />
    </View>
  );
}
