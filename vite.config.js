/** @type {import('vite').UserConfig} */
import { resolve } from "node:path";

export default {
  base: "/anilist-smashorpass",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        share: resolve(__dirname, "share/index.html"),
      },
    },
  },
};
