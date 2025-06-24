import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({}),
  env: {
    schema: {
      VITE_SERVER_URL: envField.string({
        access: "public",
        context: "client",
      }),
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve:
      process.env.NODE_ENV === "production"
        ? {
          alias: {
            "react-dom/server": "react-dom/server.edge",
            "react-dom/server.browser": "react-dom/server.edge",
          },
        }
        : {},
  },
});
