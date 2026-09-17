import { useRef } from "react";
import { TextInput, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
}

// Same segmented-box interaction as the web project's components/shared/OtpInput
// (per-box refs, auto-advance on digit entry, backspace jumps back).
export function OtpInput({ value, onChange, length = 6, autoFocus, onComplete }: OtpInputProps) {
  const colors = useThemeColors();
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focusAt = (idx: number) => refs.current[idx]?.focus();

  const emit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (idx: number, text: string) => {
    const d = text.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    emit(next.join("").slice(0, length));
    if (d && idx < length - 1) focusAt(idx + 1);
  };

  const handleKeyPress = (idx: number, key: string) => {
    if (key === "Backspace" && !digits[idx] && idx > 0) focusAt(idx - 1);
  };

  return (
    <View className="flex-row justify-center gap-2.5">
      {digits.map((digit, idx) => (
        <TextInput
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          value={digit}
          onChangeText={(t) => handleChange(idx, t)}
          onKeyPress={(e) => handleKeyPress(idx, e.nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={autoFocus && idx === 0}
          className={`h-[60px] w-[46px] rounded-2xl text-center text-xl font-bold ${
            digit ? "bg-primary/10 border-2 border-primary" : "bg-surface border border-border"
          }`}
          style={{ color: colors.foreground }}
        />
      ))}
    </View>
  );
}
