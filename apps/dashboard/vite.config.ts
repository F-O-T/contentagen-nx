import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
   plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackRouter({
         target: "react",
         autoCodeSplitting: true,
      }),
      react(),
   ],
   server: {
      port: 3000,
   },
   build: {
      rollupOptions: {
         output: {
            manualChunks: {
               // Core React runtime - loaded on every page
               "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
               // Lexical editor - lazy loaded when editor is opened
               "vendor-lexical": [
                  "lexical",
                  "@lexical/clipboard",
                  "@lexical/code",
                  "@lexical/hashtag",
                  "@lexical/history",
                  "@lexical/html",
                  "@lexical/link",
                  "@lexical/list",
                  "@lexical/mark",
                  "@lexical/markdown",
                  "@lexical/overflow",
                  "@lexical/plain-text",
                  "@lexical/rich-text",
                  "@lexical/selection",
                  "@lexical/table",
                  "@lexical/text",
                  "@lexical/utils",
               ],
               // Charts - lazy loaded when analytics pages are opened
               "vendor-recharts": ["recharts"],
               // Flow diagrams - lazy loaded when flow editor is opened
               "vendor-xyflow": ["@xyflow/react"],
               // TanStack utilities
               "vendor-tanstack": [
                  "@tanstack/react-query",
                  "@tanstack/react-router",
                  "@tanstack/react-form",
                  "@tanstack/react-table",
               ],
            },
         },
      },
   },
});
