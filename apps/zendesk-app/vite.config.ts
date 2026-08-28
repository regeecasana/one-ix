import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import StaticCopy from "./rollup/static-copy-plugin";
import { extractMarketplaceTranslation } from "./rollup/modifiers/translations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: "src",
  base: "./",
  plugins: [
    react(),
    StaticCopy({
      targets: [
        { src: resolve(__dirname, "src/manifest.json"), dest: "../" },
        {
          src: resolve(__dirname, "src/translations/en.json"),
          dest: "../translations",
          modifier: extractMarketplaceTranslation,
        },
      ],
    }),
  ],
  build: {
    outDir: resolve(__dirname, "dist/assets"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src/iframe.html"),
    },
  },
});
