import { PlanName } from "@packages/stripe/constants";

/**
 * SDK rate limit configurations per plan.
 * These are applied when creating API keys.
 */
export const SDK_RATE_LIMITS = {
   [PlanName.FREE]: {
      rateLimitEnabled: true,
      rateLimitTimeWindow: 1000 * 60, // 1 minute
      rateLimitMax: 100,
      remaining: 100,
      refillInterval: 1000 * 60, // 1 minute
      refillAmount: 100,
   },
   [PlanName.LITE]: {
      rateLimitEnabled: true,
      rateLimitTimeWindow: 1000 * 60, // 1 minute
      rateLimitMax: 1000,
      remaining: 1000,
      refillInterval: 1000 * 60, // 1 minute
      refillAmount: 1000,
   },
   [PlanName.PRO]: {
      rateLimitEnabled: true,
      rateLimitTimeWindow: 1000 * 60, // 1 minute
      rateLimitMax: 10000,
      remaining: 10000,
      refillInterval: 1000 * 60, // 1 minute
      refillAmount: 10000,
   },
} as const;

export type SDKRateLimitConfig = (typeof SDK_RATE_LIMITS)[PlanName];

/**
 * SDK mode determines how the SDK can be used.
 * - static: Only for build-time fetching (SSG/ISR)
 * - ssr: Full server-side rendering support
 */
export type SDKMode = "static" | "ssr";

/**
 * Get the SDK mode for a given plan.
 * Only PRO plans get full SSR support.
 */
export function getSDKModeForPlan(plan: PlanName): SDKMode {
   return plan === PlanName.PRO ? "ssr" : "static";
}

/**
 * Get rate limit configuration for a given plan.
 */
export function getRateLimitConfig(plan: PlanName): SDKRateLimitConfig {
   return SDK_RATE_LIMITS[plan];
}

/**
 * Per-minute request limits per plan (for display/documentation).
 */
export const SDK_MINUTE_LIMITS = {
   [PlanName.FREE]: 100,
   [PlanName.LITE]: 1000,
   [PlanName.PRO]: 10000,
} as const;
