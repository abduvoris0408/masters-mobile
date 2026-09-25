import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

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
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = Math.min(260, Math.round(SCREEN_HEIGHT * 0.32));

// Fades + rises in once, on mount — the form used to just appear fully
// formed, which read as flat next to the hero. Not reused as a hook since
// nothing else on this screen needs staged reveal.
function useRevealStyle(delay: number) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));
}

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const insets = useSafeAreaInsets();
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

  const heroStyle = useRevealStyle(0);
  const formStyle = useRevealStyle(120);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        {/* Hero — brand badge over a plain gradient field, echoing the
            reference screenshot's photo-hero-into-white-sheet layout with
            this app's own brand mark instead of a product photo. Dropped
            the earlier decorative SVG scatter — it read as noise rather
            than adding anything next to the badge/wordmark. */}
        <Animated.View style={[{ height: HERO_HEIGHT }, heroStyle]}>
          <LinearGradient
            colors={["#16A34A", "#0D9457"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, paddingTop: insets.top }}
          >
            <View className="flex-1 flex-row items-center justify-center gap-2.5">
              <Ionicons name="hammer" size={30} color="#FFFFFF" />
              <Text className="text-3xl text-white" style={{ fontFamily: GOLOS_WEIGHTS.extrabold }}>
                Masters
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Form sheet — overlaps the hero's bottom edge and sits on plain
            white (bg-surface) against the screen's bg-background (light
            gray), with a shadow, so it reads as a raised card over the
            gradient instead of blending into a same-colored page. Its
            fields render one shade down (bg-background) from this card's
            white via TextField/PhoneInput's `onSurface` prop — same
            card-then-field nesting as the reference screenshot.
            Shadow and rounded-corner clipping are split across an outer
            (shadow, no clip) and inner (rounded + overflow hidden) view —
            putting both shadow and overflow:hidden on the same view clips
            the shadow itself along with the corners. */}
        <Animated.View style={[{ flex: 1, marginTop: -24, shadowColor: "#0F172A", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 12 }, formStyle]}>
          <View
            className="flex-1 bg-surface px-6 pb-10 pt-8"
            style={{ overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
          >
            <Text className="text-center text-2xl text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {t("login_title")}
            </Text>
            <Text className="mb-8 mt-1.5 text-center text-sm text-muted">{t("login_subtitle")}</Text>

            <View className="gap-4">
              <PhoneInput label={t("phone")} value={phone} onChange={setPhone} onSurface />
              <TextField
                label={t("password")}
                value={password}
                onChangeText={setPassword}
                secureToggle
                leadingIcon="lock-closed-outline"
                onSurface
                autoCapitalize="none"
              />

              <Link href="/forgot-password" asChild>
                <Pressable className="self-end">
                  <Text className="text-sm font-medium text-primary">{t("forgot_password")}</Text>
                </Pressable>
              </Link>

              <Button color="primary" loading={loginMutation.isPending} disabled={!canSubmit} onPress={onSubmit}>
                {t("login_submit")}
              </Button>

              <View className="flex-row items-center gap-3 py-1">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-xs text-muted">{t("login_or_divider")}</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

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
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
