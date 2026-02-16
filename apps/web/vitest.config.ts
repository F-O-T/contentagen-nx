import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
   esbuild: {
      jsx: "automatic",
   },
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
      },
   },
   test: {
      include: ["apps/web/__tests__/**/*.test.{ts,tsx}"],
   },
});
