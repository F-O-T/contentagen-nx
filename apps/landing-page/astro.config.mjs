import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { passthroughImageService, defineConfig, envField } from "astro/config";
export default defineConfig({
   image: {
      service: passthroughImageService(),
   },
   adapter: node({
      mode: "standalone",
   }),
   env: {
      schema: {
         VITE_SERVER_URL: envField.string({
            access: "public",
            context: "client",
         }),
      },
   },
   integrations: [react(), sitemap()],
   output: "server",
   server: {
      host: "0.0.0.0",
   },
   site: "https://www.contentagen.com",
   vite: {
      plugins: [tailwindcss()],
   },
});
