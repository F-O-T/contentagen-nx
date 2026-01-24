import { P as PlanName, l as PLAN_FEATURES, m as getMinimumPlanForFeature, F as FEATURE_DISPLAY_NAMES } from "./router-HyRWfAJI.mjs";
import { r as reactExports } from "../_libs/react.mjs";
import { u as useActiveOrganization } from "./use-active-organization-a8BhfK6J.mjs";
function useFeatureAccess() {
  const { activeSubscription } = useActiveOrganization();
  const plan = reactExports.useMemo(() => {
    if (!activeSubscription) return PlanName.FREE;
    const status = activeSubscription.status;
    if (status !== "active" && status !== "trialing") return PlanName.FREE;
    const planName = activeSubscription.plan?.toLowerCase();
    if (planName === PlanName.LITE) return PlanName.LITE;
    if (planName === PlanName.PRO) return PlanName.PRO;
    return PlanName.FREE;
  }, [activeSubscription]);
  const hasFeature = reactExports.useMemo(() => {
    return (feature) => {
      return PLAN_FEATURES[plan]?.includes(feature) ?? false;
    };
  }, [plan]);
  return {
    plan,
    hasFeature,
    availableFeatures: PLAN_FEATURES[plan] ?? [],
    isPaidPlan: plan !== PlanName.FREE,
    getFeatureDisplayName: (f) => FEATURE_DISPLAY_NAMES[f] ?? f,
    getRequiredPlan: getMinimumPlanForFeature
  };
}
export {
  useFeatureAccess as u
};
