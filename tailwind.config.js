/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Two-accent system mirroring the reference screens: `primary`
        // (violet) drives navigation/active-state/badges, `accent` (green)
        // is reserved for the one main call-to-action per screen — never mix
        // the two on the same control.
        primary: {
          DEFAULT: "#6C5CE7",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        // Dedicated token (not `primary.dark`) — a shade key literally named
        // "dark" reads ambiguously next to Tailwind's `dark:` variant prefix
        // and the generated `bg-primary-dark` class silently failed to apply
        // in testing (confirmed via a real screenshot: the drawer panel had
        // no background at all).
        sidebar: "#2E2450",
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
