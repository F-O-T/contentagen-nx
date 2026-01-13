import { PlanName } from "@packages/stripe/constants";
import {
   FEATURE_DISPLAY_NAMES,
   Feature,
   planHasFeature,
} from "@packages/stripe/features";
import { auth } from "../integrations/auth";

/**
 * Get the user's current plan from their subscription.
 * Defaults to FREE if no active subscription.
 */
export async function getUserPlanFromSession(
   organizationId: string | null | undefined,
   headers: Headers,
): Promise<PlanName> {
   if (!organizationId) {
      return PlanName.FREE;
   }

   try {
      // Get subscription from auth API
      const subscriptions = await auth.api.listActiveSubscriptions({
         headers,
         query: { referenceId: organizationId },
      });

      const activeSubscription = subscriptions.find(
         (sub) => sub.status === "active" || sub.status === "trialing",
      );

      if (!activeSubscription) {
         return PlanName.FREE;
      }

      const planName = activeSubscription.plan?.toLowerCase();
      if (planName === PlanName.LITE) return PlanName.LITE;
      if (planName === PlanName.PRO) return PlanName.PRO;

      return PlanName.FREE;
   } catch {
      return PlanName.FREE;
   }
}

/**
 * Check if the user has access to a specific feature.
 * Throws an error if the feature is not available.
 */
export async function requireFeatureAccess(
   feature: Feature,
   organizationId: string | null | undefined,
   headers: Headers,
): Promise<void> {
   const plan = await getUserPlanFromSession(organizationId, headers);

   if (!planHasFeature(plan, feature)) {
      const featureName = FEATURE_DISPLAY_NAMES[feature] ?? feature;
      throw new Error(
         `A funcionalidade "${featureName}" não está disponível no seu plano atual. Faça upgrade para acessar.`,
      );
   }
}

export { Feature };
