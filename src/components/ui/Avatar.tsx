import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

// Falls back to a person icon, not an initial letter — a blank avatar photo
// is common (most users never upload one), and a plain "?" or single letter
// tile read as broken/unset rather than as an intentional placeholder. Also
// recovers from a broken/expired image URL via onError, so a dead photo link
// doesn't just render nothing.
export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const colors = useThemeColors();
  const [failed, setFailed] = useState(false);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-emerald-100 dark:bg-accent/15"
      style={{ width: size, height: size }}
    >
      <Ionicons name="person" size={size * 0.55} color={colors.primary} />
    </View>
  );
}
