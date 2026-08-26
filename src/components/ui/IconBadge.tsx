import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";

// Flat, saturated bg + white icon — bolder than a pastel-bg/colored-icon
// pairing, matching the reference app's solid colored account-type squares
// (blue checking / green savings / gold crypto) rather than a softer look.
const TONES = {
  violet: "#6C5CE7",
  sky: "#0EA5E9",
  teal: "#14B8A6",
  amber: "#F59E0B",
  rose: "#F43F5E",
  emerald: "#10B981",
} as const;

export type IconBadgeTone = keyof typeof TONES;
const TONE_KEYS = Object.keys(TONES) as IconBadgeTone[];

/** Deterministic tone from any string id (category guid/name) — same
 *  category always gets the same color without a hand-maintained map. */
export function toneFromString(seed: string): IconBadgeTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TONE_KEYS[hash % TONE_KEYS.length];
}

interface IconBadgeProps {
  /** Ionicons glyph name, used when `imageUri` isn't given/fails. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Real category icon URL from the backend (category.icon) — preferred over `icon` when present. */
  imageUri?: string | null;
  tone?: IconBadgeTone;
  size?: number;
}

export function IconBadge({ icon = "briefcase-outline", imageUri, tone = "violet", size = 44 }: IconBadgeProps) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-2xl"
      style={{ width: size, height: size, backgroundColor: TONES[tone] }}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: size * 0.55, height: size * 0.55 }} resizeMode="contain" />
      ) : (
        <Ionicons name={icon} size={size * 0.46} color="#FFFFFF" />
      )}
    </View>
  );
}
