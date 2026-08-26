import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into assets/, matching manifest.json's ticket_sidebar path.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/iframe.html",
    },
  },
});
