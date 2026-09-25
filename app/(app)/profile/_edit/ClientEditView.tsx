import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CardTitle } from "@/components/ui/Typography";
import { useUpdateUserProfileMutation } from "@/services/user";
import { useAuthStore } from "@/stores";
import { formatPhoneNumber } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";
import { EditShell } from "./EditShell";

export function ClientEditView() {
  const { t } = useTranslation("profile");
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.first_name ?? "");
  const [surname, setSurname] = useState(user?.last_name ?? "");
  const [middleName, setMiddleName] = useState(user?.middle_name ?? "");

  const updateMutation = useUpdateUserProfileMutation();
  const canSubmit = name.trim() !== "" && surname.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await updateMutation.mutateAsync({ name: name.trim(), surname: surname.trim(), middle_name: middleName.trim() || undefined });
      showSuccess(t("edit_save_success"));
      router.back();
    } catch {
      showError(t("edit_save_error"));
    }
  };

  return (
    <EditShell title={t("edit_title")}>
      <TextField label={t("first_name")} placeholder={t("first_name_placeholder")} value={name} onChangeText={setName} />
      <TextField label={t("last_name")} placeholder={t("last_name_placeholder")} value={surname} onChangeText={setSurname} />
      <TextField label={t("middle_name_optional")} placeholder={t("middle_name_placeholder")} value={middleName} onChangeText={setMiddleName} />

      <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
        <Text className="text-sm text-muted">{t("phone_number")}</Text>
        <CardTitle>{formatPhoneNumber(user?.phone)}</CardTitle>
      </View>

      <Button className="mt-2" loading={updateMutation.isPending} disabled={!canSubmit} onPress={handleSubmit}>
        {t("save")}
      </Button>
    </EditShell>
  );
}
