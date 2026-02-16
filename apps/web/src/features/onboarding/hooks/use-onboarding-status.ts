import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

/**
 * Fetches the current onboarding status for both organization and project.
 * Returns:
 * - organization: { onboardingCompleted, name, slug }
 * - project: { onboardingCompleted, onboardingProducts, tasks, name }
 */
export function useOnboardingStatus() {
   return useSuspenseQuery(
      orpc.onboarding.getOnboardingStatus.queryOptions({}),
   );
}

/**
 * Helper to check if organization onboarding is complete
 */
export function useIsOrgOnboardingComplete() {
   const { data } = useOnboardingStatus();
   return data.organization.onboardingCompleted ?? false;
}

/**
 * Helper to check if project onboarding is complete
 */
export function useIsProjectOnboardingComplete() {
   const { data } = useOnboardingStatus();
   return data.project.onboardingCompleted ?? false;
}
