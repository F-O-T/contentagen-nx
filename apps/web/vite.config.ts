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
// Resolve the native ESM build of tslib to avoid the UMD global detection
// failure when @peculiar/* (used by @simplewebauthn/server → @better-auth/passkey)
// is bundled into an ESM .mjs by Nitro under Bun.
const tslibEsm = require.resolve("tslib/tslib.es6.mjs");

const config = defineConfig({
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
   },
   optimizeDeps: {
      include: ["react", "react-dom", "prismjs"],
   },
   plugins: [
      devtools(),
      nitro({ preset: "bun", alias: { tslib: tslibEsm } }),
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
