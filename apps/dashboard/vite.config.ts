import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
  ],
  ssr: {
    // Explicitly list packages that should NOT be externalized (i.e., should be bundled)
    // for the SSR build. This ensures Node.js built-ins within them are handled correctly
    // for the server environment, preventing "browser compatibility" issues during build.
    noExternal: [
      "@tanstack/react-start",
      // If other TanStack or server-related packages also cause similar issues,
      // you might need to add them here.
    ],
    external: [
      "node:stream",
      "node:stream/web",
      "node:async_hooks",
    ]
  },
  server: {
    port: 3000,
  },
});
