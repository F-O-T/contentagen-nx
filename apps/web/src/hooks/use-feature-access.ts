import { PlanName } from "@packages/stripe/constants";
import {
   Feature,
   FEATURE_DISPLAY_NAMES,
   getMinimumPlanForFeature,
   PLAN_FEATURES,
} from "@packages/stripe/features";
import { useMemo } from "react";
import { useActiveOrganization } from "./use-active-organization";

export { Feature } from "@packages/stripe/features";

export function useFeatureAccess() {
   const { activeSubscription } = useActiveOrganization();

   const plan = useMemo(() => {
      if (!activeSubscription) return PlanName.FREE;
      const status = activeSubscription.status;
      if (status !== "active" && status !== "trialing") return PlanName.FREE;
      const planName = activeSubscription.plan?.toLowerCase();
      if (planName === PlanName.LITE) return PlanName.LITE;
      if (planName === PlanName.PRO) return PlanName.PRO;
      return PlanName.FREE;
   }, [activeSubscription]);

   const hasFeature = useMemo(() => {
      return (feature: Feature): boolean => {
         return PLAN_FEATURES[plan]?.includes(feature) ?? false;
      };
   }, [plan]);

   return {
      plan,
      hasFeature,
      availableFeatures: PLAN_FEATURES[plan] ?? [],
      isPaidPlan: plan !== PlanName.FREE,
      getFeatureDisplayName: (f: Feature) => FEATURE_DISPLAY_NAMES[f] ?? f,
      getRequiredPlan: getMinimumPlanForFeature,
   };
}
