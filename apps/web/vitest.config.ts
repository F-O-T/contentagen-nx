import { fileURLToPath, URL } from "node:url";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
   esbuild: {
      jsx: "automatic",
   },
   plugins: [
      viteTsConfigPaths({
         projects: ["./tsconfig.json"],
      }),
   ],
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
   },
   test: {
      include: ["./__tests__/**/*.test.{ts,tsx}"],
   },
});
