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
      refillRate: 5,
      interval: 10,
      capacity: 10,
      characteristics: ["ip.src"],
   },
   shield: {
      mode: isProduction ? ("LIVE" as const) : ("DRY_RUN" as const),
   },
};
