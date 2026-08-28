import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import StaticCopy from "./rollup/static-copy-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Builds into dist/assets/, and manifest.json is copied into dist/ via
// StaticCopy so dist/manifest.json + dist/assets/iframe.html match
// manifest.json's ticket_sidebar path ("assets/iframe.html").
// Package with: zcli apps:package dist
export default defineConfig({
  root: "src",
  base: "./",
  plugins: [
    react(),
    StaticCopy({
      targets: [{ src: resolve(__dirname, "manifest.json"), dest: "../" }],
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
