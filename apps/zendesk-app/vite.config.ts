import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into assets/, matching manifest.json's ticket_sidebar path.
// base: "./" -- Zendesk serves the built assets from an unpredictable
// path once uploaded/zipped, so asset URLs must be relative, not rooted.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/iframe.html",
    },
  },
});
