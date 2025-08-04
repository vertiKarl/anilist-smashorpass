/** @type {import('vite').UserConfig} */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: "/anilist-smashorpass",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        share: resolve(__dirname, "share/index.html"),
      },
    },
  },
  esbuild:
    mode === "production"
      ? {
          dropLabels: ["DEBUG"],
        }
      : {},
}));
