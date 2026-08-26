import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TextField } from "@/components/ui/TextField";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/services/auth";
import { showError, showSuccess, showWarning } from "@/utils/toast";

const CODE_LENGTH = 6;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation("auth");
  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const onSendCode = async () => {
    try {
      await forgotMutation.mutateAsync({ phone });
      setStep(1);
    } catch {
      showError(t("forgot_error"));
    }
  };

  const onConfirmCode = (value: string = code) => {
    if (value.length < CODE_LENGTH) {
      showWarning(t("otp_min_length"));
      return;
    }
    setStep(2);
  };

  const onResetPassword = async () => {
    if (newPassword !== newPassword2) {
      showWarning(t("password_mismatch"));
      return;
    }
    try {
      await resetMutation.mutateAsync({ phone, code, new_password: newPassword, new_password2: newPassword2 });
      showSuccess(t("forgot_success"));
      router.replace("/login");
    } catch {
      showError(t("forgot_reset_error"));
      setCode("");
      setStep(1);
    }
  };

  return (
    <View className="flex-1 justify-center bg-background px-6">
      <Text className="text-center text-2xl font-bold text-foreground">{t("forgot_title")}</Text>
      <Text className="mb-8 mt-1.5 text-center text-sm text-muted">
        {step === 0 ? t("forgot_subtitle") : step === 1 ? t("forgot_sms_sent", { phone }) : t("forgot_new_password_hint")}
      </Text>

      {step === 0 ? (
        <View className="gap-4">
          <PhoneInput label={t("phone")} value={phone} onChange={setPhone} />
          <Button loading={forgotMutation.isPending} disabled={phone.length !== 13} onPress={onSendCode}>
            {t("forgot_send_code")}
          </Button>
        </View>
      ) : null}

      {step === 1 ? (
        <View className="gap-6">
          <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} autoFocus onComplete={onConfirmCode} />
          <Button disabled={code.length < CODE_LENGTH} onPress={() => onConfirmCode()}>
            {t("forgot_confirm_code")}
          </Button>
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-4">
          <TextField label={t("forgot_new_password")} value={newPassword} onChangeText={setNewPassword} secureToggle autoCapitalize="none" />
          <TextField label={t("confirm_password")} value={newPassword2} onChangeText={setNewPassword2} secureToggle autoCapitalize="none" />
          <Button loading={resetMutation.isPending} onPress={onResetPassword}>
            {t("forgot_change_password")}
          </Button>
        </View>
      ) : null}

      <Pressable className="mt-6 self-center" onPress={() => router.replace("/login")}>
        <Text className="text-sm font-semibold text-primary">← {t("forgot_back_to_login")}</Text>
      </Pressable>
    </View>
  );
}
