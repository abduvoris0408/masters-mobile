// Golos Text weight files. Prefer the Tailwind classes (`font-regular`,
// `font-medium`, `font-semibold`, `font-bold` — mapped to these files in
// tailwind.config.js); use the constants where a literal is needed (native
// header options, `style` props).
//
// Weight policy: regular for body copy, medium for secondary labels,
// semibold for titles/buttons/chips, bold only for the brand wordmark and
// hero numbers (balance, prices).
export const GOLOS_WEIGHTS = {
  regular: "GolosText_400Regular",
  medium: "GolosText_500Medium",
  semibold: "GolosText_600SemiBold",
  bold: "GolosText_700Bold",
  extrabold: "GolosText_800ExtraBold",
  black: "GolosText_900Black",
} as const;

export { applyGolosAsDefaultFont } from "./defaultFont";
