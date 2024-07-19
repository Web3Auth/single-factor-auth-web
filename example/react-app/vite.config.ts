/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
      sourcemap: false,
    },
    plugins: [react()],
    server: {
      open: true,
      port: 3000,
    },
    resolve: {
      alias: { "bn.js": resolve("./node_modules/bn.js"), lodash: resolve("./node_modules/lodash-es") },
    },
  };
});
