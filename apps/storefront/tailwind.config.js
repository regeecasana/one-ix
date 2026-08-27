/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Relay" -- a clear-sky, full-signal palette. Same token names as
        // before so component classNames didn't need touching, just the
        // brand underneath them.
        paper: "#EAF1F3",
        canvas: "#FFFFFF",
        ink: "#122029",
        "ink-soft": "#57707C",
        blaze: "#0EA5A0",
        "blaze-dark": "#0B8983",
        moss: "#2F9E6E",
        hairline: "#D3DEE2",
      },
      fontFamily: {
        display: ['"Space Mono"', "monospace"],
        body: ['"Manrope"', "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
      },
      borderRadius: {
        sm: "2px",
      },
    },
  },
  plugins: [],
};
