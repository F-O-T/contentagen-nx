import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

/**
 * Fetches the current onboarding status and task completion state.
 * Returns onboardingCompleted, onboardingProducts, tasks map, and publicApiKey.
 */
export function useOnboardingStatus() {
	return useQuery(orpc.onboarding.getOnboardingStatus.queryOptions({}));
}
