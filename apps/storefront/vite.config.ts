import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 0.0.0.0, not just localhost -- required so the dev server is reachable
    // from outside its Docker container (see infra/).
    host: true,
  },
});
