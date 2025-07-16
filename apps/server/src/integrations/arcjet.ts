import { Elysia } from "elysia";
import { createArcjetServer } from "@packages/arcjet/server";
import { env } from "@api/config/env";
const aj = createArcjetServer(env.ARCJET_KEY);
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
