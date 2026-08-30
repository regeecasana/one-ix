import type { Config } from "tailwindcss";

export default {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        canvas: "#FFFFFF",
        ink: "#0B2530",
        "ink-soft": "#5C7480",
        // Concentrix brand -- blaze/blaze-dark kept as the token names (used
        // across ~12 files) but repointed from the old purple to Concentrix
        // navy, so no gradient and no per-usage renaming was needed.
        blaze: "#003D5B",
        "blaze-dark": "#00293D",
        teal: "#25E2CC",
        // Error/danger text only -- unrelated to the brand palette, left as
        // its own distinct color so errors don't start looking like accents.
        pink: "#EC4899",
        moss: "#16A34A",
        lavender: "#E6FBF7",
        hairline: "#D9E6E7",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
