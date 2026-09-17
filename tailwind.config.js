/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
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
