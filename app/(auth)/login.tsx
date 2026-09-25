import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { isAxiosError } from "axios";

import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TextField } from "@/components/ui/TextField";
import { useTelegramLoginFlow } from "@/hooks/useTelegramLoginFlow";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { buildSessionFromTokens, useLoginMutation } from "@/services/auth";
import { useAuthStore } from "@/stores";
import { showError } from "@/utils/toast";

const TELEGRAM_BLUE = "#229ED9";

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const loginMutation = useLoginMutation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = phone.length === 13 && password.length > 0 && !loginMutation.isPending;

  const onSubmit = async () => {
    try {
      await loginMutation.mutateAsync({ phone, password });
      router.replace("/");
    } catch (error) {
      // A missing response (network unreachable, wrong API URL, timeout)
      // isn't the same problem as a wrong phone/password — telling the user
      // "incorrect password" when the real issue is no server connection
      // sends them down the wrong troubleshooting path.
      const isNetworkError = isAxiosError(error) && !error.response;
      showError(isNetworkError ? t("error", { ns: "common" }) : t("login_error"));
    }
  };

  // Same deep-link + poll flow as the web app's LoginForm: once
  // telegram-login-status confirms, build the full session (fetch the
  // profile, call setAuth) instead of just stashing a token.
  const telegramLogin = useTelegramLoginFlow({
    onConfirmed: async (tokens) => {
      try {
        const user = await buildSessionFromTokens(tokens);
        useAuthStore.getState().setAuth(user, tokens);
        router.replace("/");
      } catch {
        showError(t("login_error"));
      }
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <Text className="text-center text-2xl font-bold text-foreground">{t("login_title")}</Text>
        <Text className="mb-8 mt-1.5 text-center text-sm text-muted">{t("login_subtitle")}</Text>

        <View className="gap-4">
          <PhoneInput label={t("phone")} value={phone} onChange={setPhone} />
          <TextField
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            secureToggle
            autoCapitalize="none"
          />

          <Link href="/forgot-password" asChild>
            <Pressable className="self-end">
              <Text className="text-sm font-medium text-primary">{t("forgot_password")}</Text>
            </Pressable>
          </Link>

          <Button loading={loginMutation.isPending} disabled={!canSubmit} onPress={onSubmit}>
            {t("login_submit")}
          </Button>

          <Pressable
            disabled={telegramLogin.isWaiting}
            onPress={() => telegramLogin.start()}
            className="h-13 flex-row items-center justify-center gap-2 rounded-full border-2 px-5"
            style={{ height: 52, borderColor: TELEGRAM_BLUE, opacity: telegramLogin.isWaiting ? 0.6 : 1 }}
          >
            {telegramLogin.isWaiting ? (
              <ActivityIndicator color={TELEGRAM_BLUE} />
            ) : (
              <>
                <Ionicons name="paper-plane" size={17} color={TELEGRAM_BLUE} />
                <Text className="text-base" style={{ fontFamily: GOLOS_WEIGHTS.bold, color: TELEGRAM_BLUE }}>
                  {t("telegram_login_btn")}
                </Text>
              </>
            )}
          </Pressable>

          {telegramLogin.isWaiting ? (
            <Text className="text-center text-xs text-muted">{t("telegram_login_pending_hint")}</Text>
          ) : null}

          {telegramLogin.isError ? (
            <Text className="text-center text-xs text-danger">{t("telegram_login_error")}</Text>
          ) : null}
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-sm text-muted">{t("no_account")} </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text className="text-sm font-bold text-primary">{t("register_link")}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
