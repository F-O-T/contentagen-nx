import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  env: {
    schema: {
      VITE_SERVER_URL: envField.string({
        access: "public",
        context: "client",
        default: "https://content-writer-b9gq.onrender.com",
      }),
    },
  },
  integrations: [react()],
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },
});
