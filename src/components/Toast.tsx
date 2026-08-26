import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToastStore } from "@/stores/toast.store";

const KIND_STYLES = {
  error: "bg-red-600",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
} as const;

// Backs @/utils/toast's showError/showSuccess/showWarning — mounted once in
// the root layout. Deliberately plain (no animation lib, no external toast
// package) until real screens/screenshots dictate the final look.
export function Toast() {
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <Pressable
      onPress={() => dismiss(toast.id)}
      className={`absolute left-4 right-4 rounded-xl px-4 py-3.5 ${KIND_STYLES[toast.kind]}`}
      style={{ top: insets.top + 8 }}
    >
      <Text className="text-center text-sm font-medium text-white">{toast.message}</Text>
    </Pressable>
  );
}
