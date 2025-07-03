import { env, isProduction } from "@api/config/env";
import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/bun";
import { Elysia } from "elysia";

const aj = arcjet({
   key: env.ARCJET_KEY,
   rules: [
      detectBot({
         allow: [],
         mode: isProduction ? "LIVE" : "DRY_RUN",
      }),
      tokenBucket({
         mode: isProduction ? "LIVE" : "DRY_RUN",
         refillRate: 5,
         interval: 10,
         capacity: 10,
         characteristics: ["ip.src"],
      }),
      shield({
         mode: isProduction ? "LIVE" : "DRY_RUN",
      }),
   ],
});

// This is the correct, idiomatic ElysiaJS approach
export const ArcjetShield = new Elysia({ name: "arcjet-shield" }).onRequest(
   // Get the `ip` from Elysia's context
   async ({ request, set }) => {
      try {
         const decision = await aj.protect(request, {
            // Pass the `ip` from Elysia's context to Arcjet
            requested: 1,
         });

         if (decision.isDenied()) {
            set.status = 403;
            return {
               error: "Access Denied",
               reason: decision.reason,
            };
         }
      } catch (error) {
         console.error("Arcjet protection error:", error);
         // Allow the request to continue if Arcjet fails
      }
   },
);
