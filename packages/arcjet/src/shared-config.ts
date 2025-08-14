import type { ArcjetWellKnownBot, ArcjetBotCategory } from "@arcjet/node";
import { isProduction } from "@packages/environment/helpers";
export const ARCJET_CONFIG = {
   isProduction: isProduction,
   detectBot: {
      allow: [] as (ArcjetWellKnownBot | ArcjetBotCategory)[],
      mode: isProduction ? ("LIVE" as const) : ("DRY_RUN" as const),
   },
   tokenBucket: {
      mode: isProduction ? ("LIVE" as const) : ("DRY_RUN" as const),
      refillRate: 20, // Increased rate for higher throughput
      interval: 10, // Keep interval unchanged
      capacity: 50, // Allow higher burst capacity
      characteristics: ["ip.src"],
   },
   shield: {
      mode: isProduction ? ("LIVE" as const) : ("DRY_RUN" as const),
   },
};
