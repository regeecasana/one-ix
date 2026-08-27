import type { Config } from "tailwindcss";

export default {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        canvas: "#FFFFFF",
        ink: "#150F2E",
        "ink-soft": "#6B7280",
        blaze: "#7C3AED",
        "blaze-dark": "#6D28D9",
        pink: "#EC4899",
        moss: "#16A34A",
        lavender: "#F5F0FC",
        hairline: "#E7E3F2",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jakarta)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(90deg, #7C3AED, #EC4899)",
      },
    },
  },
  plugins: [],
} satisfies Config;
