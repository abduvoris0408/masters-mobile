import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { useOtpVerifyMutation, useResendOtpMutation } from "@/services/auth";
import { showError, showSuccess, showWarning } from "@/utils/toast";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const { t } = useTranslation("auth");
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const otpMutation = useOtpVerifyMutation();
  const resendMutation = useResendOtpMutation();

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Reached without a phone (e.g. deep link) — nothing to verify.
  if (!phone) return <Redirect href="/register" />;

  const submit = async (value: string) => {
    if (value.length < OTP_LENGTH) {
      showWarning(t("otp_min_length"));
      return;
    }
    try {
      await otpMutation.mutateAsync({ phone, code: value });
      router.replace("/");
    } catch {
      showError(t("otp_error"));
      setCode("");
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resendMutation.isPending) return;
    try {
      await resendMutation.mutateAsync({ phone });
      showSuccess(t("otp_resent"));
      setCode("");
      setSecondsLeft(RESEND_SECONDS);
    } catch {
      showError(t("otp_resend_error"));
    }
  };

  return (
    <View className="flex-1 justify-center bg-background px-6">
      <Text className="text-center text-2xl font-bold text-foreground">{t("otp_title")}</Text>
      <Text className="mb-8 mt-1.5 text-center text-sm text-muted">{t("otp_subtitle", { phone })}</Text>

      <OtpInput value={code} onChange={setCode} length={OTP_LENGTH} autoFocus onComplete={submit} />

      <Button
        className="mt-8"
        loading={otpMutation.isPending}
        disabled={code.length < OTP_LENGTH}
        onPress={() => submit(code)}
      >
        {t("otp_submit")}
      </Button>

      <View className="mt-4 flex-row justify-center">
        <Text className="text-sm text-muted">{t("otp_resend_question")} </Text>
        {secondsLeft > 0 ? (
          <Text className="text-sm font-semibold text-muted">{t("otp_resend_wait", { seconds: secondsLeft })}</Text>
        ) : (
          <Pressable onPress={handleResend} disabled={resendMutation.isPending}>
            <Text className="text-sm font-semibold text-primary">{t("otp_resend_action")}</Text>
          </Pressable>
        )}
      </View>

      <Pressable className="mt-6 self-center" onPress={() => router.replace("/register")}>
        <Text className="text-sm text-muted">{t("otp_back")}</Text>
      </Pressable>
    </View>
  );
}
