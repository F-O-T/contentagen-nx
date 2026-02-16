import type { PostHog } from "posthog-node";
import type { FeatureFlagContext } from "./server";

export type EarlyAccessFeatureSSR = {
   name: string;
   description: string;
   stage: "alpha" | "beta" | "concept";
   documentationUrl: string | null;
   flagKey: string | null;
};

/**
 * Server-side helper to check if a user is enrolled in an early access feature
 * Uses PostHog's feature flags on the server
 */
export async function isEnrolledInFeatureSSR(
   posthog: PostHog,
   flagKey: string,
   context: FeatureFlagContext,
): Promise<boolean> {
   try {
      const result = await posthog.isFeatureEnabled(flagKey, context.userId, {
         groupProperties: context.groupProperties,
         groups: context.groups,
         personProperties: context.userProperties,
      });
      return result ?? false;
   } catch (error) {
      console.error(
         `[Early Access SSR] Failed to check feature flag ${flagKey}:`,
         error,
      );
      return false;
   }
}

/**
 * Server-side helper to get all enrolled early access features for a user
 * Note: PostHog doesn't provide server-side early access feature list API
 * You need to define features in your codebase and check them individually
 */
export async function getEnrolledFeaturesSSR(
   posthog: PostHog,
   featureFlags: string[],
   context: FeatureFlagContext,
): Promise<Set<string>> {
   const enrolled = new Set<string>();

   await Promise.all(
      featureFlags.map(async (flagKey) => {
         const isEnabled = await isEnrolledInFeatureSSR(
            posthog,
            flagKey,
            context,
         );
         if (isEnabled) {
            enrolled.add(flagKey);
         }
      }),
   );

   return enrolled;
}
