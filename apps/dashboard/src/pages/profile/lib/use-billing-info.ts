import { betterAuthClient } from "@/integrations/clients";
import { useQuery } from "@tanstack/react-query";

export const useBillingInfo = () => {
   const { data: customerState, isLoading: isLoadingCustomerState } = useQuery({
      queryKey: ["customerState"],
      queryFn: () => betterAuthClient.customer.state(),
   });

   return {
      customerState,
      activeSubscription: customerState?.data?.activeSubscriptions[0],
      activeMeter: customerState?.data?.activeMeters[0],
      isLoading: isLoadingCustomerState,
   };
};
