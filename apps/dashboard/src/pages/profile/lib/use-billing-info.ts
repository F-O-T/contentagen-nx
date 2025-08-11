import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useBillingInfo = () => {
   const trpc = useTRPC();
   const { data: customerState, isLoading } = useSuspenseQuery(
      trpc.sessionHelper.getCustomerState.queryOptions(),
   );
   return {
      customerState,
      activeSubscription: customerState?.activeSubscriptions[0],
      activeMeter: customerState?.activeMeters[0],
      isLoading,
   };
};
