import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { ApplicationWizard } from "@/components/wizard/ApplicationWizard";
import { Header } from "@/components/ui/Header";
import { useCreateApplicationMutation } from "@/services/application";

// "E'lon joylash" tab — the same wizard as /applications/create, hosted as
// a tab because native tabs can't run an action on press (the old custom
// tab bar's raised "+" pushed the create screen instead).
export default function CreateTabScreen() {
  const { t } = useTranslation("orders");
  const createMutation = useCreateApplicationMutation();
  // Tabs stay mounted, so a posted listing would otherwise leave the
  // finished wizard behind — bumping the key starts a fresh one.
  const [wizardKey, setWizardKey] = useState(0);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("create_application_header")} />
      <ApplicationWizard
        key={wizardKey}
        submitting={createMutation.isPending}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values);
            setWizardKey((k) => k + 1);
            router.navigate("/");
          } catch {
            Alert.alert(t("common_error_title"), t("create_application_error"));
          }
        }}
      />
    </View>
  );
}
