import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import type { Plugin as RollupPlugin } from "rollup";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

/**
 * @lexical/code bundles prism language plugins that are IIFEs calling `})(Prism)`.
 * They reference `Prism` as a bare global variable that is expected to be set by
 * the main prismjs module. In the browser this works because `window.Prism` is set
 * by `import "prismjs"` before the lazy editor chunk loads.
 *
 * On the server the editor routes are `ssr: false`, but the route tree still
 * statically imports the route modules for metadata, causing `@lexical/code` to
 * end up in the SSR bundle. When Nitro evaluates that bundle at module load time
 * it hits `})(Prism)` where `Prism` is undefined → ReferenceError.
 *
 * Fix: inject `globalThis.Prism` and `globalThis.window` stubs as a banner before
 * the Nitro SSR chunk that contains prismjs so the language-plugin IIFEs can run
 * safely. The stubs are harmless because the editor never renders server-side.
 */
function prismSsrPolyfillRollupPlugin(): RollupPlugin {
   return {
      name: "prism-ssr-polyfill",
      renderChunk(code, chunk) {
         if (
            !chunk.fileName.includes("prismjs") ||
            !code.includes("require_prism")
         ) {
            return null;
         }

         // Stub `Prism` and `window` globals before the prism language-plugin
         // IIFEs run (they call `})(Prism)` at the top level of the module).
         const polyfill = [
            "// Prism SSR polyfill - prevents ReferenceError in Bun/Node server context",
            "if (typeof Prism === 'undefined') globalThis.Prism = globalThis.Prism || {};",
            "if (typeof window === 'undefined') globalThis.window = globalThis;",
            "",
         ].join("\n");

         return { code: polyfill + code, map: null };
      },
   };
}

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
      nitro({
         preset: "bun",
         rollupConfig: {
            plugins: [prismSsrPolyfillRollupPlugin()],
         },
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
