import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { passthroughImageService, defineConfig, envField } from "astro/config";
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/astro";

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
      validateSecrets: true,
   },
   integrations: [
      react(),
      sitemap(),
      arcjet({
         characteristics: ["ip.src"], // Track requests by IP
         rules: [
            // Shield protects your app from common attacks e.g. SQL injection
            shield({ mode: "LIVE" }),
            // Create a bot detection rule
            detectBot({
               mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
               // Block all bots except the following
               allow: [
                  "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                  // Uncomment to allow these other common bot categories
                  // See the full list at https://arcjet.com/bot-list
                  //"CATEGORY:MONITOR", // Uptime monitoring services
                  //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
               ],
            }),
            // Create a token bucket rate limit. Other algorithms are supported.
            tokenBucket({
               mode: "LIVE",
               refillRate: 5, // Refill 5 tokens per interval
               interval: 10, // Refill every 10 seconds
               capacity: 10, // Bucket capacity of 10 tokens
            }),
         ],
      }),
   ],
   output: "server",
   server: {
      host: "0.0.0.0",
   },
   site: "https://www.contentagen.com",
   vite: {
      plugins: [tailwindcss()],
   },
});
