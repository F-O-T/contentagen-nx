import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import {
   FEATURE_DISPLAY_NAMES,
   type Feature,
   getMinimumPlanForFeature,
   PLAN_FEATURES,
} from "@packages/stripe/features";
import { useMemo } from "react";
import { useActiveOrganization } from "./use-active-organization";

export { Feature } from "@packages/stripe/features";

type FeatureAccessResult = {
   /** Current plan for the active organization */
   plan: PlanName;
   /** Check if the current plan has access to a feature */
   hasFeature: (feature: Feature) => boolean;
   /** Get all features available on the current plan */
   availableFeatures: Feature[];
   /** Check if user is on a paid plan */
   isPaidPlan: boolean;
   /** Get the display name of a feature */
   getFeatureDisplayName: (feature: Feature) => string;
   /** Get the minimum plan required for a feature */
   getRequiredPlan: (feature: Feature) => PlanName;
   /** Get the display name of a plan */
   getPlanDisplayName: (plan: PlanName) => string;
};

/**
 * Hook to check feature access based on the organization's subscription plan.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasFeature, plan } = useFeatureAccess();
 *
 *   if (!hasFeature(Feature.CHAT)) {
 *     return <UpgradePrompt feature={Feature.CHAT} />;
 *   }
 *
 *   return <ChatComponent />;
 * }
 * ```
 */
export function useFeatureAccess(): FeatureAccessResult {
   const { activeSubscription } = useActiveOrganization();

   // Determine the current plan from subscription
   // Default to FREE if no subscription or status is not active/trialing
   const plan = useMemo(() => {
      if (!activeSubscription) return PlanName.FREE;

      const status = activeSubscription.status;
      if (status !== "active" && status !== "trialing") {
         return PlanName.FREE;
      }

      // Map subscription plan name to PlanName enum
      const planName = activeSubscription.plan?.toLowerCase();
      if (planName === PlanName.LITE) return PlanName.LITE;
      if (planName === PlanName.PRO) return PlanName.PRO;

      return PlanName.FREE;
   }, [activeSubscription]);

   // Check if a specific feature is available
   const hasFeature = useMemo(() => {
      return (feature: Feature): boolean => {
         return PLAN_FEATURES[plan]?.includes(feature) ?? false;
      };
   }, [plan]);

   // Get all available features for the current plan
   const availableFeatures = useMemo(() => {
      return PLAN_FEATURES[plan] ?? [];
   }, [plan]);

   // Check if on a paid plan
   const isPaidPlan = useMemo(() => {
      return plan !== PlanName.FREE;
   }, [plan]);

   // Get feature display name
   const getFeatureDisplayName = (feature: Feature): string => {
      return FEATURE_DISPLAY_NAMES[feature] ?? feature;
   };

   // Get minimum required plan for a feature
   const getRequiredPlan = (feature: Feature): PlanName => {
      return getMinimumPlanForFeature(feature);
   };

   // Get plan display name
   const getPlanDisplayName = (planName: PlanName): string => {
      const planInfo = STRIPE_PLANS.find((p) => p.name === planName);
      return planInfo?.displayName ?? planName;
   };

   return {
      plan,
      hasFeature,
      availableFeatures,
      isPaidPlan,
      getFeatureDisplayName,
      getRequiredPlan,
      getPlanDisplayName,
   };
}
