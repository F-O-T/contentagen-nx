// Astro-specific shared config

// Only import types for bot categories for correct typing
import type { ArcjetWellKnownBot, ArcjetBotCategory } from "@arcjet/node";

export const ARCJET_CONFIG = {
   isProduction: process.env.NODE_ENV === "production",
   key: process.env.ARCJET_KEY ?? "",
   detectBot: {
      allow: [] as (ArcjetWellKnownBot | ArcjetBotCategory)[],
      mode:
         process.env.NODE_ENV === "production"
            ? ("LIVE" as const)
            : ("DRY_RUN" as const),
   },
   tokenBucket: {
      mode:
         process.env.NODE_ENV === "production"
            ? ("LIVE" as const)
            : ("DRY_RUN" as const),
      refillRate: 5,
      interval: 10,
      capacity: 10,
      characteristics: ["ip.src"],
   },
   shield: {
      mode:
         process.env.NODE_ENV === "production"
            ? ("LIVE" as const)
            : ("DRY_RUN" as const),
   },
};
