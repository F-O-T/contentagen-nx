import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import node from "@astrojs/node";
export default defineConfig({
  integrations: [mdx(), sitemap(), react()],
  site: "https://blog.contentagen.com",

  output: "server",
  server: {
    host: "0.0.0.0",
  },
  adapter: node({
    mode: "standalone",
  }),
  vite: {
    ssr: {
      noExternal: [
        "@packages/layouts"
      ]
    },

    plugins: [tailwindcss()],
  },
});
