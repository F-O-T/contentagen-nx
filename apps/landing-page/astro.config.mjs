import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],
  output: "server",

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "react-dom/server": "react-dom/server.edge",
        "react-dom/server.browser": "react-dom/server.edge",
      },
    },
  },
});
