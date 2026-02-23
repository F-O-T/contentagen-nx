import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);

const config = defineConfig({
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
         // Workaround: Vite 8 beta's __toESM skips setting .default when
         // a CJS module sets __esModule: true (tslib does via createExporter).
         // Force ESM entry to avoid __commonJSMin wrapping entirely.
         tslib: require.resolve("tslib/tslib.es6.mjs"),
      },
   },
   optimizeDeps: {
      include: ["react", "react-dom"],
   },

   plugins: [
      devtools(),
      nitro({
         preset: "bun",
      }),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
         projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact({
         babel: {
            plugins: ["babel-plugin-react-compiler"],
         },
      }),
   ],
});

export default config;
