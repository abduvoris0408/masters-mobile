import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TextField } from "@/components/ui/TextField";
import { BadgeLabel, ScreenTitle, SectionTitle } from "@/components/ui/Typography";
import { USER_ROLE_ID } from "@/constants";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useRegisterSimpleMutation } from "@/services/auth";
import { getPasswordStrength, type PasswordStrength } from "@/utils/password";
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

const STEPS = ["role", "details"] as const;
type TStep = (typeof STEPS)[number];

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: "#DC2626",
  medium: "#D97706",
  strong: "#16A34A",
};

const STRENGTH_FILL: Record<PasswordStrength, number> = {
  weak: 1 / 3,
  medium: 2 / 3,
  strong: 1,
};

function SectionHeading({ children }: { children: string }) {
  return <BadgeLabel className="uppercase tracking-wide text-muted">{children}</BadgeLabel>;
}

export default function RegisterScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const registerSimpleMutation = useRegisterSimpleMutation();

  const [stepIndex, setStepIndex] = useState(0);
  const step: TStep = STEPS[stepIndex];

  const [userType, setUserType] = useState<ERegisterIntent | null>(null);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const userTypeOptions: { type: ERegisterIntent; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
    { type: "CLIENT", icon: "person-outline", label: t("client_label"), desc: t("client_desc") },
    { type: "WORKER", icon: "construct-outline", label: t("worker_label"), desc: t("worker_desc") },
    { type: "ORGANIZATION", icon: "business-outline", label: t("organization_label"), desc: t("organization_desc") },
  ];

  const strength = getPasswordStrength(password);
  const passwordsFilled = password.length > 0 && confirm.length > 0;
  const passwordsMatch = password === confirm;

  const canSubmit =
    name.length > 0 && surname.length > 0 && phone.length === 13 && password.length >= 6 && !registerSimpleMutation.isPending;

  // Progress tracks actual field completion, not just which step we're on —
  // each field (starting with role selection) adds its own share once the
  // user fills it in.
  const PROGRESS_FIELDS = 6;
  const filledCount =
    (userType ? 1 : 0) +
    (name.length > 0 ? 1 : 0) +
    (surname.length > 0 ? 1 : 0) +
    (phone.length === 13 ? 1 : 0) +
    (password.length >= 6 ? 1 : 0) +
    (passwordsMatch && confirm.length > 0 ? 1 : 0);
  const percent = Math.round((filledCount / PROGRESS_FIELDS) * 100);

  const progressAnim = useRef(new Animated.Value(percent)).current;
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: percent, duration: 280, useNativeDriver: false }).start();
  }, [percent, progressAnim]);

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

  const onBackPress = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const onContinue = () => {
    if (step === "role") {
      if (!userType) return;
      setStepIndex(1);
      return;
    }
    onSubmit();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <View className="gap-4 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center">
          <Pressable
            onPress={onBackPress}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </Pressable>
          <ScreenTitle pointerEvents="none" className="absolute left-0 right-0 text-center text-xl">
            {t("register_title")}
          </ScreenTitle>
        </View>

        <View className="flex-row items-center gap-2.5">
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <Animated.View
              className="h-full rounded-full bg-accent"
              style={{
                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              }}
            />
          </View>
          <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {percent}%
          </Text>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-6 pt-8" keyboardShouldPersistTaps="handled">
        {step === "role" ? (
          <>
            <Text className="mb-5 text-center text-sm text-muted">
              O'zingizga kerakli hisob turini tanlab ro'yxatdan o'ting
            </Text>
            <View className="gap-3">
            {userTypeOptions.map((item) => {
              const active = userType === item.type;
              return (
                <Pressable
                  key={item.type}
                  onPress={() => setUserType(item.type)}
                  className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 ${
                    active ? "border-accent bg-emerald-50 dark:bg-accent/15" : "border-border bg-surface"
                  }`}
                >
                  <View
                    className={`h-12 w-12 shrink-0 items-center justify-center rounded-full ${active ? "bg-accent" : "bg-background"}`}
                  >
                    <Ionicons name={item.icon} size={22} color={active ? "#FFFFFF" : colors.muted} />
                  </View>
                  <View className="flex-1 gap-0.5 pr-1">
                    <SectionTitle
                      className={active ? "text-accent" : "text-foreground"}
                      numberOfLines={1}
                    >
                      {item.label}
                    </SectionTitle>
                    <Text className="text-sm text-muted" numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <View className="h-6 w-6 shrink-0 items-center justify-center">
                    {active ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
                  </View>
                </Pressable>
              );
            })}
            </View>
          </>
        ) : (
          <>
            <SectionHeading>{t("section_personal_info")}</SectionHeading>
            <View className="mb-6 mt-2.5 gap-4">
              <TextField label={t("first_name")} value={name} onChangeText={setName} placeholder="Jasur" />
              <TextField label={t("last_name")} value={surname} onChangeText={setSurname} placeholder="Toshmatov" />
              <TextField
                label={t("middle_name")}
                value={middleName}
                onChangeText={setMiddleName}
                placeholder="Akramovich"
              />
            </View>

            <SectionHeading>{t("section_login_info")}</SectionHeading>
            <View className="mt-2.5 gap-4">
              <PhoneInput label={t("phone")} value={phone} onChange={setPhone} />

              <View className="gap-1.5">
                <TextField label={t("password")} value={password} onChangeText={setPassword} secureToggle autoCapitalize="none" />
                {strength ? (
                  <View className="gap-1">
                    <View className="h-1.5 flex-row gap-1">
                      {(["weak", "medium", "strong"] as PasswordStrength[]).map((level, i) => {
                        const filled = i < Math.round(STRENGTH_FILL[strength] * 3);
                        return (
                          <View
                            key={level}
                            className="h-full flex-1 rounded-full"
                            style={{ backgroundColor: filled ? STRENGTH_COLOR[strength] : colors.border }}
                          />
                        );
                      })}
                    </View>
                    <Text className="text-xs" style={{ color: STRENGTH_COLOR[strength] }}>
                      {t(`password_strength_${strength}`)}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs text-muted">{t("password_hint")}</Text>
                )}
              </View>

              <View className="gap-1.5">
                <TextField
                  label={t("confirm_password")}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureToggle
                  autoCapitalize="none"
                />
                {passwordsFilled ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                      size={13}
                      color={passwordsMatch ? "#16A34A" : "#DC2626"}
                    />
                    <Text className="text-xs" style={{ color: passwordsMatch ? "#16A34A" : "#DC2626" }}>
                      {passwordsMatch ? t("password_match") : t("password_no_match")}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        )}

        <Button
          className="mt-6"
          loading={step === "details" && registerSimpleMutation.isPending}
          disabled={step === "role" ? !userType : !canSubmit}
          onPress={onContinue}
        >
          {step === "role" ? t("continue") : t("register_submit")}
        </Button>

        {step === "role" ? (
          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-muted">{t("have_account")} </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-sm font-bold text-primary">{t("login_link")}</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
