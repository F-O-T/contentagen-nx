import { env } from "@/config/env";
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

const aj = arcjet({
   key: env.ARCJET_KEY, // Get your site key from https://app.arcjet.com
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
});

export const arcjetProtect = createIsomorphicFn()
   .client(() => {})
   .server(async () => {
      const request = getWebRequest();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
         headers[key] = value;
      });

      const arcjetRequest = {
         ...request,
         headers,
      };

      const decision = await aj.protect(arcjetRequest, { requested: 5 });
      return decision;
   });
