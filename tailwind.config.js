/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  // `font-medium/semibold/bold` select a Golos weight *file* (fontFamily
  // below) instead of setting fontWeight: custom fonts don't synthesize
  // weights reliably (Android fakes bold over the regular file, iOS ignores
  // it), so a numeric weight rendered inconsistently across platforms.
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    // Type scale in explicit px. NativeWind resolves rem as 14px on native
    // (not 16 like the web), so the default rem-based scale rendered every
    // size ~12% small (text-sm was 12.25px, text-base 14px). One scale here
    // fixes all call sites at once.
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["14px", { lineHeight: "20px" }],
      base: ["16px", { lineHeight: "22px" }],
      lg: ["18px", { lineHeight: "24px" }],
      xl: ["20px", { lineHeight: "26px" }],
      "2xl": ["24px", { lineHeight: "30px" }],
      "3xl": ["30px", { lineHeight: "36px" }],
      "4xl": ["36px", { lineHeight: "42px" }],
    },
    extend: {
      lineHeight: {
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
      },
      fontFamily: {
        regular: ["GolosText_400Regular"],
        medium: ["GolosText_500Medium"],
        semibold: ["GolosText_600SemiBold"],
        bold: ["GolosText_700Bold"],
      },
      colors: {
        // Two-accent system mirroring the reference screens: `primary`
        // (green) drives navigation/active-state/badges, `accent` (emerald)
        // is reserved for the one main call-to-action per screen — never mix
        // the two on the same control.
        primary: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#059669",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
