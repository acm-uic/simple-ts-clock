import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "frontend/",
  build: {
    outDir: "../dist/public/",
    rollupOptions: {
      input: resolve(import.meta.dirname, "frontend/main.ts"),
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
