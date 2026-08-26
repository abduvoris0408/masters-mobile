import { Text, TextInput } from "react-native";

// Golos Text — applied as the app-wide default so every <Text>/<TextInput>
// gets it without touching each call site's className. Components that need
// a specific weight file (not just a numeric fontWeight, which custom fonts
// on Android don't synthesize) set `fontFamily` explicitly — see
// GOLOS_WEIGHTS below and e.g. Button/ListingCard/Header for the highest-
// visibility bold text.
export const GOLOS_WEIGHTS = {
  regular: "GolosText_400Regular",
  medium: "GolosText_500Medium",
  semibold: "GolosText_600SemiBold",
  bold: "GolosText_700Bold",
  extrabold: "GolosText_800ExtraBold",
  black: "GolosText_900Black",
} as const;

let applied = false;

export function applyGolosAsDefaultFont() {
  if (applied) return;
  applied = true;
  const base = { fontFamily: GOLOS_WEIGHTS.regular };
  // @ts-expect-error — defaultProps isn't in RN's public Text typings but is
  // the standard cross-app-default-font technique (works on every platform,
  // unlike relying on NativeWind's base layer for a bare-tag selector).
  Text.defaultProps = Text.defaultProps ?? {};
  // @ts-expect-error
  Text.defaultProps.style = [base, Text.defaultProps.style];
  // @ts-expect-error
  TextInput.defaultProps = TextInput.defaultProps ?? {};
  // @ts-expect-error
  TextInput.defaultProps.style = [base, TextInput.defaultProps.style];
}
