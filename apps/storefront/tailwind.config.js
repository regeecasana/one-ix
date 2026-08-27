/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#E8E1CE",
        canvas: "#F8F4E9",
        ink: "#21231F",
        "ink-soft": "#5B5A4E",
        blaze: "#C7431C",
        "blaze-dark": "#9C3315",
        moss: "#4B5D45",
        hairline: "#CBC1A4",
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', "sans-serif"],
        body: ['"Work Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        sm: "2px",
      },
    },
  },
  plugins: [],
};
