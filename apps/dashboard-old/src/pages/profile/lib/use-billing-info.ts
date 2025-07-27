import { betterAuthClient } from "@/integrations/better-auth";
import { createQueryKey } from "@packages/eden";
import { useQuery } from "@tanstack/react-query";

export const useBillingInfo = () => {
   const { data: customerState, isLoading: isLoadingCustomerState } = useQuery({
      queryKey: createQueryKey("betterAuthClient.customer.state"),
      queryFn: () => betterAuthClient.customer.state(),
   });

   return {
      customerState,
      activeSubscription: customerState?.data?.activeSubscriptions[0],
      activeMeter: customerState?.data?.activeMeters[0],
      isLoading: isLoadingCustomerState,
   };
};
