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
 * @lexical/code bundles a top-level diff-language IIFE that calls `})(Prism)`,
 * expecting `Prism` to already be the fully-initialised global set by prismjs.
 * In the browser `import "prismjs"` sets `window.Prism` eagerly. On the server
 * the editor routes are `ssr: false`, but TanStack Router's generated route tree
 * statically imports all route modules for metadata — so @lexical/code ends up
 * in the Nitro SSR bundle and its top-level IIFE crashes at startup.
 *
 * `require_prism` is defined earlier in the same chunk but is a lazy CommonJS
 * factory that is never called at module-level — so `Prism` is undefined when
 * the diff IIFE executes.
 *
 * Fix: inject a call to `require_prism()` immediately after its factory
 * definition closes (`}));`) and before the diff IIFE runs. This initialises
 * the real Prism object (with `.languages`) via its own `global.Prism = Prism`
 * assignment, making subsequent `(function(t){...})(Prism)` calls safe.
 * The call is guarded by `typeof window === 'undefined'` so it only runs in
 * SSR/Node/Bun contexts; the browser path is unchanged.
 */
function prismSsrPolyfillRollupPlugin(): RollupPlugin {
   // Real newline character — matches actual bundled output
   const INJECTION_MARKER =
      "if (typeof global !== 'undefined') global.Prism = Prism;\n}));";

   return {
      name: "prism-ssr-polyfill",
      renderChunk(code) {
         // No filename check — Nitro produces a single SSR chunk in production
         if (
            !code.includes("require_prism") ||
            !code.includes(INJECTION_MARKER)
         ) {
            return null;
         }

         const injection =
            INJECTION_MARKER +
            "\n// Prism SSR init — ensures global.Prism is set before\n" +
            "// @lexical/code top-level language IIFEs execute.\n" +
            "if (typeof window === 'undefined') require_prism();\n";

         return {
            code: code.replace(INJECTION_MARKER, injection),
            map: null,
         };
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
