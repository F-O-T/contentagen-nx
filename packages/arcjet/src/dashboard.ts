import arcjet, { detectBot, tokenBucket, shield } from "@arcjet/node";
import { ARCJET_CONFIG } from "./shared-config";

export function createArcjetDashboard(key: string) {
   return arcjet({
      key,
      rules: [
         detectBot({
            allow: ARCJET_CONFIG.detectBot.allow,
            mode: ARCJET_CONFIG.detectBot.mode,
         }),
         tokenBucket({
            mode: ARCJET_CONFIG.tokenBucket.mode,
            refillRate: ARCJET_CONFIG.tokenBucket.refillRate,
            interval: ARCJET_CONFIG.tokenBucket.interval,
            capacity: ARCJET_CONFIG.tokenBucket.capacity,
            characteristics: ARCJET_CONFIG.tokenBucket.characteristics,
         }),
         shield({
            mode: ARCJET_CONFIG.shield.mode,
         }),
      ],
   });
}
