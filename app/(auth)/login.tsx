import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TextField } from "@/components/ui/TextField";
import { useLoginMutation } from "@/services/auth";
import { showError } from "@/utils/toast";

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
    } catch {
      showError(t("login_error"));
    }
  };

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
