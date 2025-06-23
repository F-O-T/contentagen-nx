import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
