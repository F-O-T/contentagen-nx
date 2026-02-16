import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useActiveOrganization() {
   const { data: activeOrganization } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   if (!activeOrganization) {
      throw new Error("No active organization found");
   }

   // Extract activeSubscription from the organization response
   const { activeSubscription, projectLimit, projectCount, ...organization } =
      activeOrganization;

   return {
      activeOrganization: organization,
      activeSubscription,
      projectLimit,
      projectCount,
   };
}
