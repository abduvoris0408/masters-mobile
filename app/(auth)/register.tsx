import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TextField } from "@/components/ui/TextField";
import { USER_ROLE_ID } from "@/constants";
import { useRegisterSimpleMutation } from "@/services/auth";
import { showError, showWarning } from "@/utils/toast";

type ERegisterIntent = "CLIENT" | "WORKER" | "ORGANIZATION";

interface IFieldErrors {
  phone?: string[];
  password?: string[];
  password2?: string[];
  name?: string[];
  surname?: string[];
}

// TEMP (testing only, mirrors the web project's RegisterForm): register-simple
// skips SMS OTP and logs the user in immediately. Flip to false once the real
// OTP flow (app/(auth)/otp.tsx) should run instead, and once master/organization
// onboarding screens exist to redirect WORKER/ORGANIZATION signups into.
const USE_SIMPLE_REGISTER = true;

export default function RegisterScreen() {
  const { t } = useTranslation("auth");
  const registerSimpleMutation = useRegisterSimpleMutation();

  const [userType, setUserType] = useState<ERegisterIntent>("CLIENT");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const userTypeOptions: { type: ERegisterIntent; label: string }[] = [
    { type: "CLIENT", label: t("client_label") },
    { type: "WORKER", label: t("worker_label") },
    { type: "ORGANIZATION", label: t("organization_label") },
  ];

  const canSubmit =
    name.length > 0 && surname.length > 0 && phone.length === 13 && password.length >= 6 && !registerSimpleMutation.isPending;

  const onSubmit = async () => {
    if (password !== confirm) {
      showWarning(t("password_mismatch"));
      return;
    }
    const role =
      userType === "ORGANIZATION"
        ? [USER_ROLE_ID.MASTER, USER_ROLE_ID.ORGANIZATION]
        : userType === "WORKER"
          ? [USER_ROLE_ID.MASTER]
          : [USER_ROLE_ID.CLIENT];

    try {
      if (USE_SIMPLE_REGISTER) {
        await registerSimpleMutation.mutateAsync({
          name,
          surname,
          middle_name: middleName || undefined,
          phone,
          password,
          password2: confirm,
          role,
        });
        router.replace("/");
        return;
      }
      router.push({ pathname: "/otp", params: { phone } });
    } catch (e) {
      if (isAxiosError<IFieldErrors>(e) && e.response?.data) {
        const first = Object.values(e.response.data).flat()[0];
        showError(first || t("register_error"));
      } else {
        showError(t("register_error"));
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 py-10" keyboardShouldPersistTaps="handled">
        <Text className="text-center text-2xl font-bold text-foreground">{t("register_title")}</Text>
        <Text className="mb-6 mt-1.5 text-center text-sm text-muted">{t("register_subtitle")}</Text>

        <View className="mb-6 flex-row gap-3">
          {userTypeOptions.map((item) => {
            const active = userType === item.type;
            return (
              <Pressable
                key={item.type}
                onPress={() => setUserType(item.type)}
                className={`flex-1 items-center rounded-xl border-2 py-3 ${
                  active ? "border-primary bg-primary/10" : "border-border bg-surface"
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-4">
          <TextField label={t("first_name")} value={name} onChangeText={setName} placeholder="Jasur" />
          <TextField label={t("last_name")} value={surname} onChangeText={setSurname} placeholder="Toshmatov" />
          <TextField
            label={t("middle_name")}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="Akramovich"
          />
          <PhoneInput label={t("phone")} value={phone} onChange={setPhone} />
          <TextField label={t("password")} value={password} onChangeText={setPassword} secureToggle autoCapitalize="none" />
          <TextField
            label={t("confirm_password")}
            value={confirm}
            onChangeText={setConfirm}
            secureToggle
            autoCapitalize="none"
          />

          <Button
            className="mt-2"
            loading={registerSimpleMutation.isPending}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            {t("register_submit")}
          </Button>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-sm text-muted">{t("have_account")} </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-sm font-bold text-primary">{t("login_link")}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
