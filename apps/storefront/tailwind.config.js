/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "XLSmart" -- purple-to-pink gradient system, matching the
        // brief's own mockups. Same token *names* as the previous two
        // design passes so most component classNames didn't need
        // touching, just the values underneath them.
        paper: "#FFFFFF",
        canvas: "#FFFFFF",
        ink: "#150F2E",
        "ink-soft": "#6B7280",
        blaze: "#7C3AED", // gradient start (violet)
        "blaze-dark": "#6D28D9",
        pink: "#EC4899", // gradient end
        moss: "#16A34A", // savings/success green, unrelated to brand gradient
        lavender: "#F5F0FC",
        hairline: "#E7E3F2",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', "sans-serif"],
        mono: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(90deg, #7C3AED, #EC4899)",
      },
    },
  },
  plugins: [],
};
